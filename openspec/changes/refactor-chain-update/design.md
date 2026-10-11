# Design

## Context

动机见 `proposal.md - Why`。这里只记录影响实现方式的现状与约束。

当前链式写入的执行链是「三段式」，其中间态是问题的根源：

```
  store.userInfo.name = 'b'
        |
  [1] reduceChanged(value, keyChains, firstLevelValue)
        firstLevelValue = _$state_.userInfo   <- 旧树上的对象
        就地写入 firstLevelValue.name = 'b'    <- 旧树在此被污染
        |
  [2] updateMetaState(firstLevelKey, createNewRefValue(firstLevelValue))
        |
  [3] scheduler.assignMergeState
        _$state_ = { ...旧root, userInfo: <[1] 里已被改写的对象> }
```

关键约束：

- 渲染层通过 `useSyncExternalStore` 订阅，其快照比较要求根状态对象在写入后具有新身份，因此「就地写入」在不额外引入版本号机制的前提下不可行。
- 路径信息目前以 `Set<{ key: keyof S }>` 传递并在消费侧用 `shift()` 丢弃第一层，正确性依赖 Set 的插入顺序，且 Set 去重使同名 key 跨层时路径失序。
- 两个消费方（`state/index.ts` 的 hook 路径、`class-connect/index.ts` 的 `classEngineStore`）都通过委托到基础代理 `metaStore.store` 读取嵌套对象，因此它们共享同一套嵌套读写实现。class 侧唯一的缺口是它自身缺少写陷阱。
- `immutable` 默认未开启；链式更新仅在 `immutable: true` 时存在（见 `specs/state-update-semantics`）。

## Goals / Non-Goals

**Goals:**

- 让写入侧的写时复制成为唯一路径，消除「先就地改、再换根」的时序依赖。
- 让路径成为一等公民，同时服务于写入（提交位置）与读取（缓存键）。
- 让读取侧的对象身份稳定性可被依赖数组消费。
- 让 class 侧的写入能力与 hook 侧对称，且复用同一套更新流程。

**Non-Goals:**

- 不改变批处理合流时机（连续写入仍合流为一次更新）。
- 不实现 Map / Set 的链式写入穿透。
- 不实现嵌套粒度的依赖追踪（仍为第一层 key）。
- 不做写入性能优化（根对象浅拷贝、代理失效策略）。
- 不改变 `createStore` / `defineStore` / `useStore` / `useConciseState` 的调用签名。

## Decisions

### D1：路径用有序数组，而非 Set

`Set<{ key: keyof S }>` → `PropertyKey[]`（路径第 0 项为根状态的第一层键）。

理由：

- 语义显式。现在 `reduceChanged` 用 `shift()` 丢掉第一层，正确性依赖 Set 的插入顺序；数组的 `slice(1)` 表达同一意图且不依赖遍历顺序。
- 支持同名 key 跨层。Set 按值去重，`{ x: { x: { x: 1 } } }` 这类路径在 Set 中会塌缩，落进错误的 reduce 分支。
- 类型诚实。现有 `{ key: keyof S }` 只覆盖第一层键，第 2 层往后的键在类型上不存在，只能靠 `as` 掩盖；`PropertyKey` 正确描述任意层级。
- 可复用。路径是唯一能同时表达「写到哪个位置」（写入侧）和「这是哪条路径」（读取侧缓存键）的表示。

替代方案：保留 Set 但在插入侧改成有序结构——仍无法解决同名 key 去重问题。

**契约**：`type StatePath = PropertyKey[]`，`path[0]` 为根状态的第一层键，`path[path.length - 1]` 为被写字段。路径一经创建不再修改（每次递进产生新数组），避免跨调用共享可变状态。`keyLevel` 参数随 `path.length` 推导而删除；`firstLevelKey` 等价于 `path[0]`，不再单独传递。

### D2：自叶子向上逐层克隆，一次性换根

提交算法从叶子开始向上复制，每层只复制一次，最后对根赋值一次：

```
  commit(path = ['userInfo','nameInfo','value'], v)

  old.nameInfo.value === v ? -> 放弃，不改状态
  否则：
    node_2 = { ...old.nameInfo, value: v }
    node_1 = { ...old.userInfo, nameInfo: node_2 }
    newRoot = { ..._$state_, userInfo: node_1 }
    _$state_ = newRoot                    <- 唯一一次根赋值
```

理由：这是「先建完整新树、再一次性换根」的自然实现，中间不产生对活对象的写入，因此旧树从始至终不被触碰。当前的三段式之所以污染旧树，是因为它在替换根之前就把值写进了旧树上的对象。

替代方案：

- Redux Toolkit 风格的结构共享递归（`produce`）——需要草稿对象与最终化阶段，对已在用 Proxy 拦截写入的架构是重复建设。
- 沿路径自顶向下边遍历边复制——需要在遍历中途持有旧值，且中途换根会产生中间态，不如自底向上干净。

**契约**：`commitPath` 是纯函数，不接触 `MetaStore`，返回的值即调用方必须赋给 `_$state_` 的新根。

```ts
/**
 * @returns 变化时返回新根；未变化时返回传入的 root 本身（引用相等即「无变化」）
 */
const commitPath = <S extends PrimitiveState>(
  root: S,
  path: StatePath,
  value: unknown,
  isDelete = false,
): S
```

返回原 root 表示无变化，比返回 `{ changed, root }` 包装对象更省一次分配，且调用方只做一次 `Object.is` 比较即可判断。契约要求：**同一逻辑写入允许多次调用 `commitPath` 并取最后一次结果**（幂等安全），因为中间结果不落盘。

实现：

```ts
const commitPath = (root, path, value, isDelete = false) => {
  const leafKey = path[path.length - 1];
  const rest = path.slice(0, -1);

  const oldLeafOwner = readAtPath(root, rest);          // 只在 rest 上走，规避 path[0] 是原始值
  const oldValue = isDelete ? undefined : oldLeafOwner[leafKey];
  if (!isDelete && Object.is(oldValue, value)) return root;   // 无变化

  // 1) 叶子容器：复制 + 写入/删除
  const newLeafOwner = cloneShallow(oldLeafOwner);
  if (isDelete) Reflect.deleteProperty(newLeafOwner, leafKey);
  else newLeafOwner[leafKey] = value;

  // 2) 自 rest 末端向上逐层复制，最后一份即为新根
  let cur = newLeafOwner;
  for (let i = rest.length - 1; i >= 0; i--) {
    const next = cloneShallow(readAtPath(root, rest.slice(0, i)));
    next[rest[i]] = cur;
    cur = next;
  }
  return cur;
};

const cloneShallow = (v) => Array.isArray(v) ? v.slice() : { ...v };

/** 沿路径读取；任何一段不可穿透时返回 undefined（写入被忽略） */
const readAtPath = (root, path) => {
  let cur = root;
  for (const k of path) {
    if (!isPenetrable(cur)) return undefined;
    cur = cur[k];
  }
  return cur;
};

/** D4 的可穿透判定：仅纯对象与数组 */
const isPenetrable = (v) =>
  Array.isArray(v) ||
  (typeof v === "object" && v !== null &&
   (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null));
```

各情形下的行为（与 spec 对齐）：

| 情形 | 结果 |
|---|---|
| `path = ['count']` | `rest` 为空，`cloneShallow(root)` 后写 `count`，返回新根 |
| 同值写入 | 提前返回原 `root`，路径上零分配 |
| 路径穿过非纯对象（D4 叶节点） | `readAtPath` 返回 `undefined`，写入被忽略、不产生新引用 |
| 删除末段 | `Reflect.deleteProperty` 作用于副本，原对象不受影响 |
| 数组元素 | `Array.isArray` 分支用 `slice()`，数字索引作为 `PropertyKey` 天然可用 |

### D3：代理按路径缓存，第一层以目标对象为键

```
  WeakMap<目标对象, Map<路径字符串, 代理>>
```

- 第一层用目标对象做键（弱引用，避免长期持有已废弃对象）；
- 第二层用路径字符串做键，使同一目标对象在不同路径下得到不同代理。

理由：

- **正确性优先**。对象可被多处共享（`{ a: { s: shared }, b: { s: shared } }`）。若只按目标对象缓存，两条路径会拿到同一个代理，而该代理只能携带其中一条路径，对另一条路径的写入会落错位置。
- **身份稳定性来自路径**。同一路径重复读取必然命中同一缓存项，因此 `store.userInfo === store.userInfo` 成立；目标对象未变时跨渲染也命中同一项。
- **缓存无需显式失效**。提交后路径上的目标对象被替换，新目标对象没有缓存项，自然产生新代理；旧对象上的缓存项随对象一起被回收。这一性质是缓存与写时复制的耦合点，必须保持。

替代方案：

- 只按目标对象缓存——身份共享更彻底，但共享对象写入会串位置（已在 spec 中明确要求按路径区分）。
- 缓存代理时在写入前回查路径是否仍指向该对象——可同时获得全局身份共享与写入安全，但引入每次写入的额外校验与错误分支，收益不足以抵消复杂度。

**契约**：缓存位于 `MetaStore` 实例私有字段，键结构为 `WeakMap<object, Map<string, Store<S>>>`，因此随 store 一起被回收，且不会跨 store 泄漏。

```ts
#proxyCache: WeakMap<object, Map<string, ReturnType<typeof this.#createProxy>>> = new WeakMap();
```

`#createProxy` 在创建代理前按 `pathKey` 命中即返回同一实例：

```ts
const cacheKey = pathKey(path);
const perTarget = this.#proxyCache.get(target);
const cached = perTarget?.get(cacheKey);
if (cached !== undefined) return cached;
const proxy = new Proxy(target, { /* 陷阱 */ });
(perTarget ?? (this.#proxyCache.set(target, new Map()), this.#proxyCache.get(target)!))
  .set(cacheKey, proxy);
return proxy;
```

路径键编码采用**按类型前缀 + 分隔符**，避免纯 `join` 的碰撞：

```ts
const pathKey = (path: StatePath) => path.map((k) =>
  typeof k === "string"  ? `s${k}` :
  typeof k === "number"  ? `n${k}` :
  /* symbol */             `y${k.description ?? String(k)}`
).join("\u0001");
```

前缀使 `['a\u0001sb']` 与 `['a','b']` 不会碰撞；`\u0001` 不出现在正常属性名中。Symbol 键按 `description` 编码属于已知的极端近似（两个同名描述的 Symbol 会共享缓存项），见 Open Questions。

**失效策略**：无显式失效。提交后路径上的对象被 D2 替换，新对象没有缓存项，因此自然产生新代理；旧对象连同其缓存项被 GC。**这条耦合必须保持**——任何「就地修改后复用旧代理」的优化都会破坏 spec `state-read-identity`。

**陈旧代理的写入语义**：代理同时携带自己的 `path`。写入时**不读代理闭包里的 `target`**，而是通过 `readAtPath(_$state_, path)` 读旧值，因此即使持有的是提交前的代理，写入也会落在路径的当前位置。这一选择使「持有旧引用后写入」不会静默写错位置。

### D4：非纯对象作为不可穿透的叶节点

判定「可穿透」用 `Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null`，仅纯对象与数组可穿透。

理由：

- 复制一个类实例需要保留原型、getter/setter、不可枚举属性、私有字段，`Object.create(getPrototypeOf(v))` 加自身属性拷贝无法正确处理访问器与私有字段，容易产生静默错误。
- 语义上更可预测：`Date`、`RegExp`、自定义实例被视为原子值，整体替换生效，内部方法调用不产生状态更新——这条边界明确写入 spec，成为契约而非缺陷。

替代方案：支持类实例并保留原型——收益是可穿透，代价是难以穷尽的边界情况，与「先保正确性」的取向冲突。

**可穿透判定必须与代理判定一致（实现 2.9 时发现）**：`proxyable`（是否包代理）与 `isPenetrable`（是否可写入穿透）原本是两套独立判定，且前者更宽松，于是 `Map`/`Set`/类实例会被包上代理、写入再被拒绝，形成**静默丢弃**。实测：`store.box.bump()` 确实触发了 `set` 陷阱并走到提交步骤，却因宿主不可穿透而被丢弃，`box.value` 保持不变且无任何提示。

处理方式：提交前先判定宿主是否可穿透，**开发期抛出带路径与类型信息的错误，生产期保持 no-op**（与「无效路径写入」采用同一策略）。`Map`/`Set` 不受影响，因为它们经由 `map.ts`/`set.ts` 的专用工厂自行提交，不经过这条代理 `set` 陷阱路径。

**非代理内建类型仍会被就地改写**：`proxyable(new Date()) === false`，所以 `store.when` 返回的是**原始对象**，`store.when.anyKey = 1` 或 `store.when.setFullYear(...)` 既不入状态树、也不触发更新，但确实改写了那个对象，因此旧快照也会观察到变化。这与「旧快照冻结」的要求冲突，是叶节点规则的已知代价，已在 spec 场景中如实记录，不作为可修复项。

### D5：class 侧写入转发到外层代理

`classEngineStore` 补 `set` / `deleteProperty`，转发到 `createStore` 返回的外层代理（而非内部基础代理 `metaStore.store`）。

理由：

- 职责边界清晰：内部基础代理负责「怎么读」（路径、写时复制），外层代理是公共写入口，负责「怎么公开地写」。
- 两种转发在最终行为上等价（都汇入 `updateMetaState`），但转发到外层代理使 `this.store.count = 5` 与 `store.count = 5` 走同一条入口，减少一处语义分叉点。

读路径不动：`classEngineStore.get` 仍委托到基础代理，因此 class 侧自动继承 D2/D3 的写时复制与身份稳定性，无需重复实现。

### D6：`prevState` 改为引用快照而非浅拷贝

`prevBatchState = { ..._$state_ }` → `prevBatchState = _$state_`。

理由：浅拷贝的初衷是防止后续写入改写 `prevState`，但这个防护对第二层以下无效（共享引用），实测会产生 `prevState.userInfo` 报 `b/1` 而真实历史值为 `a/1` 的错误。D2 落地后旧树被冻结，直接持有引用即安全，浅拷贝不再必要，且能消除顶层键被后续写入覆盖的可能。

### D7：`assignMergeState` 契约改为接收新根

`scheduler.assignMergeState` 从「接收第一层新值并自行浅拷贝根」改为「接收已构建好的新根并直接赋值」，同时保留变化键的记录用于 `taskData`。

理由：D2 的提交已经产出完整新根，scheduler 再展开一次是重复的 `O(顶层键数)` 拷贝，并且会让「谁是根的唯一构建者」出现两个来源。这是批处理的合流点，改动必须配套回归 `tests/batchUpdateBasic/` 与 `tests/classConnect/` 全量。

### D8：顺带修复调用约定缺陷

- `apply` 陷阱把私有方法 `#createProxy` 当裸值传给 Map/Set 工厂，接收方以普通函数调用导致 `this` 丢失（当前 `store.m.get('k').v = 1` 抛 `TypeError`）。改为传入绑定后的函数，不改变 Map/Set 仍作为叶节点的定位。
- 移除 `src/subscribe/index.ts` 中遗留的调试输出。

**契约**：`CreateProxyType` 的第一个参数从「原样传递 `#createProxy`」改为传递包装器，杜绝 `this` 丢失：

```ts
// 现状（this 丢失）
this.#createProxy,

// 改为（闭包捕获实例）
(target, parentTarget, path, applyOriginFunction) =>
  this.#createProxy(target, parentTarget, path, applyOriginFunction),
```

同时清理 `src/immutable/set.ts` 的 `forEach` 分支中两处占位键 `{ key: "?" }`——该占位会污染路径，改为以元素索引（`forEach` 回调的第二个参数不适用于 Set，改用计数器）或 `Symbol.for("set-entry")` 作为路径段，确保 `set.forEach` 中读到的嵌套对象可被写入。

### D9：批内「无变化」与 `taskData` 的记录条件

D2 的「无变化返回原 root」与 D7 的「一次性换根」配合时，需要明确无变化是否触发更新：

- **首次对某键的写入无变化时不调用 `assignMergeState`**，与现状一致（现状由 `if (!Object.is(value, _$state_[key]))` 守卫）。
- **同一批次内后续写入无变化时仍调用 `assignMergeState`**，因为它必须把该批次早先构建的新根重新赋给 `_$state_`，且 `taskData` 中该键已有记录。

实现方式：由 `commitPath` 返回的 `newRoot === currentRoot` 判断「本次写入是否产生变化」，由 `taskData` 是否已包含该键判断「本批次是否已发生过变化」，两者取或决定是否调用 `assignMergeState`。

### D10：`updater` 与 `scheduler` 的最终契约

```ts
// scheduler
/** 接收已构建好的完整新根，直接赋值；记录变化键供订阅回调使用 */
assignMergeState(newRoot: S, changedKey: keyof S, value: ValueOf<S>): void

// updater
/** 唯一的链式写入入口。路径第 0 项即第一层键，因此不再需要 firstLevelKey / target 参数 */
updateMetaState(path: StatePath, value: unknown, isDelete?: boolean): boolean

// updater.set(state, opts) 的 key 循环内
const boundary = _$state_[key];
const next = commitPath(_$state_, [key], value);
if (next !== _$state_ || hasTask) {
  _subscriber_.willUpdatingProcessing();     // 必须在赋值前捕获 prevState
  _scheduler_.assignMergeState(next, key, value);
  this.finallyBatchProcessing();
}
```

从 `updateMetaState` 移除的参数：`target`（改为从 `_$state_` 按路径读取）、`firstLevelKey`（即 `path[0]`）、`keyChains`（即 `path`）、`applyOriginFunction`（原本即未使用，Map/Set 分支自行处理写入）。`src/immutable/map.ts` 与 `set.ts` 中手抄的 `reduceChanged + updateMetaState` 组合随之替换为单次 `commitPath` 调用，消除三份分叉逻辑。

### D11：逐文件改动清单

| 文件 | 改动 |
|---|---|
| `src/immutable/types.ts` | 新增 `StatePath = PropertyKey[]`；`CreateProxyType` 参数改为 `(target, parentTarget, path, applyOriginFunction?)`；删除 `KeyChainsSourceItemType`、`keyLevel`、`firstLevelKey`；Map/Set 工厂签名同步 |
| `src/immutable/utils.ts` | `reduceChanged` → `commitPath`（纯函数）；新增 `readAtPath`、`cloneShallow`、`isPenetrable`；`createNewRefValue` 收敛为 `cloneShallow`（仅纯对象与数组）；`iteratorProcessing` 改为路径数组并移除 `keyLevel` |
| `src/immutable/map.ts` | 各分支的 `reduceChanged + updateMetaState` 组合改为单次 `commitPath`；去掉 `keyLevel`；`clear` 分支传入空容器作为新值 |
| `src/immutable/set.ts` | 同上；并清理 `forEach` 的 `{ key: "?" }` 占位（D8） |
| `src/store/core.ts` | `#createProxy(target, parentTarget, path, applyOriginFunction?)`；新增 `#proxyCache` 与 `pathKey`；`set`/`deleteProperty` 传入 `path`；`apply` 传入包装后的 `createProxy`（D8）；`get` 中的路径递进改为 `[...path, key]`；数组分支的函数值走通用包装（D12） |
| `src/store/index.ts` | `createStore` 外层代理的 `set`/`deleteProperty` 改为 `updateMetaState([key], value, isDelete)` |
| `src/updater/index.ts` | `updateMetaState` 新签名（D10）；`setState` 循环改用 `commitPath`；`initiateCommit` 归一化「是否已有记录」的判定（D9） |
| `src/scheduler/index.ts` | `assignMergeState(newRoot, changedKey, value)`，移除内部根对象浅拷贝（D7） |
| `src/subscribe/index.ts` | `prevBatchState` 改引用快照；移除调试输出（D6、D8） |
| `src/class-connect/index.ts` | `classEngineStore` 补 `set` / `deleteProperty` 转发到外层代理（D5） |

新增测试文件建议：`tests/immutable/index2.test.tsx`（写入侧写时复制与叶节点边界）、`tests/immutable/index3.test.tsx`（读取侧身份稳定与共享对象路径隔离）、`tests/classConnect/index8.test.tsx`（类侧写入与删除）。

### D12：数组变异用「通用包装 + 单次提交」，不枚举方法名

**问题**：数组变异方法（`push`/`pop`/`splice`/`sort`…）不走 `set` 陷阱的单属性写入路径 —— 它们会连续做多次内部写入。实测当前实现：`store.list.push(99)` 值对但**就地污染旧数组**；`store.list.pop()` 与 `store.list.shift()` **直接抛 `TypeError`**（`src/immutable/utils.ts` 的 `reduceChanged` 在 `previousValue[itemKey] = value` 处因中间态错位而失败）。

**已排除的方案**（均经实验，记录以备回溯）：

- **逐次提交 + 转发 `receiver`**：不可行。`Reflect.set(receiver, …)` 中 `receiver` 即代理本身，会无限递归；改为 `Reflect.set(target, …)` 后矩阵与未修补完全一致 —— 因为本设计中代理的 `target` 就是 `_$state_` 里的活对象，写 `target` 本身就是就地污染。`pop`/`shift` 依旧失败。读侧取活值（另一变体）同样无效：污染发生在写侧，修复读侧无济于事。
- **让数组代理的 target 成为常驻 draft 数组**：变异方法全部正确、旧快照冻结，但**数组被整体替换后失效** —— 代理 target 在创建时固定、无法切换，`store.list = [9,9]` 后再 `push(7)` 得到 `[1,2,3,7]` 而非 `[9,9,7]`。同步 draft 内容也无法修正，因为读路径仍指向旧 draft。

**采用方案**：数组代理的 `get` 遇到**任意函数值**时返回同一条通用包装，不判断方法名。

```
  store.list.sort(cmp)
       |
       v
  从当前树按路径取数组 -> 浅拷贝为 draft
       |
       v
  Reflect.apply(method, draft, args)        <- 原生语义，中间态不外泄
       |
       v
  以【该数组自身所在的路径】提交一次（含宿主那一级）
       |
       v
  返回值 === draft 时返回代理，使 push().sort() 可链式
```

理由：

- **不枚举方法名**。所有函数共用一条包装，ECMAScript 未来新增的变异方法自动覆盖；只读方法（`slice`/`map`/`join`/`filter`/`concat`…）走同一条包装，但因提交前 `commitPath` 的 `Object.is` 判断发现值未变而**不产生提交、不触发更新**。
- **一次方法调用 = 一次提交**。方法全程作用于 detached draft，中途不发生 root 替换，因此不存在「方法内读写序列与状态替换互相干扰」的问题 —— 这正是逐次提交方案对方法内部实现产生隐式依赖、并导致 `pop`/`shift` 崩溃的根源。
- **整体替换天然正确**。每次调用都从当前树取数组，不做常驻 draft，因此不存在 target 失效问题。

**关键实现约束（易错点）**：提交路径 MUST 包含宿主那一级（`['nested','arr']` 而非仅提交数组内容），否则宿主对象不会被克隆，旧快照会与新数组共享引用。症状是「值正确但旧快照被污染」，不易通过值断言发现，必须有独立测试。

**成本**：每次数组方法调用发生一次数组浅拷贝（只读方法也拷）。这是本决策的已知代价，与「不枚举方法名、覆盖未来方法」换取，已记录在 Risks。

**与 D9 的关系**：数组提交也走 `commitPath` 与 `assignMergeState`，因此批内记账规则一致 —— 同一同步块内多次数组操作各自提交，`taskData` 按第一层键合并。


### D13：`Map`/`Set` 方法调用与提交（实现中修复的既有缺陷）

**修复前**（`immutable: true`，本次改动之前即如此）：`Map.get`/`Map.set` 抛 `parentTarget.get is not a function`；`Map.has`/`Set.has`/`Map.keys` 抛 `incompatible receiver`；`delete`/`clear` 把容器本身覆盖成成员值（`{ m: new Map() }` 变成 `{ m: 2 }`）。`Map.size`/`Set.size` 与 `forEach`/`entries`/`values` 正常。

**四个独立根因**：

1. **`apply` 陷阱传错了 `parentTarget`**。`get` 陷阱会把 `Map.prototype.get` 这类方法包成代理以便进入 `apply` 陷阱；而该函数代理的 `target` **就是那个函数**，于是陷阱里的 `proxy` 指的是函数而非容器。工厂因此拿到函数，`parentTarget.get` 不存在。修法：容器按路径取（`readAtPath(_$state_, path)`），`thisArg` 作为内建方法的 receiver，二者不再是同一个变量。
2. **工厂提交了两次**。`commitPath(state, path, nextMap)` 之后又调用 `updateMetaState([path[0]], value)`，第二次把**成员值**写到第一层键上，覆盖掉刚提交的容器。修法：统一为一次 `updateMetaState(path, nextContainer)`，由 `commitPath` 构建根、`assignMergeState` 赋值。
3. **方法不在路由表里**。`has` 与 `Map.keys` 既不在 `_MAP_SET_PROTOTYPE_PROXYABLE_TARGET_`（决定走哪个工厂），也不在 `mapSetPrototypeProxyableSet`（决定是否包装）。前者导致 `apply` 陷阱不介入、内建方法直接以代理为 receiver 而 `incompatible receiver`；后者导致方法根本不进工厂。两处都补齐。
4. **成员判断写在了代理上**。`delete`/`clear` 里用 `parentTarget.has(...)`/`parentTarget.size`，而 `parentTarget` 是容器代理，Map 内建方法对代理无 `[[MapData]]`。改为在克隆出的真实 `Map` 上判断。

**新增覆盖**：`Map.prototype.has`、`Map.prototype.keys`、`Set.prototype.has` 纳入路由表与判定集合；两个工厂新增 `has` 分支（在原始容器上做成员测试）。

**验证**：19 个方法/迭代器操作全部通过，且嵌套路径（`store.deep.m.set(...)`）正确替换每一层并冻结旧快照。

## Risks / Trade-offs

- [同时改动写入侧与读取侧，回归面覆盖渲染、订阅、类组件三条链] → 先落地写入侧（D1/D2/D7/D8）并回归现有测试，再落地读取侧缓存（D3）；两步各自可独立验证。
- [路径缓存与写时复制存在隐式耦合：缓存依赖「提交后目标对象被替换」这一性质] → 在 design 与 spec 中显式记录该耦合点；补充「提交后旧路径不再返回旧对象」的测试，防止后续优化误破坏。
- [共享对象按路径区分身份，意味着同一对象在多处不会共享代理身份，对使用 `Object.is` 比较跨路径引用的代码可能产生意外] → 该行为已在 spec `state-read-identity` 中明确定义为契约，并在非纯对象叶节点规则下保持一致。
- [`immutable` 默认未开启，`store.userInfo` 直接返回原始对象，链式写入绕过所有代理] → 属于既有行为并在 spec 中明确定义；调试与文档中需明确「链式更新需要 `immutable: true`」，避免误判为缺陷。
- [旧快照不再被改写，可能使依赖「写入后旧引用也反映新值」的代码行为改变] → 这属于 proposal 中记录的 breaking 变更；迁移说明要求此类代码改为重新读取状态。
- [类组件与函数组件共享更新流程，`assignMergeState` 契约变更可能影响 `_$stateRefs_` 过滤] → 该过滤读取新根的顶层键，只要新根仍是完整状态对象即不受影响；以 `tests/classConnect/` 全量回归验证。
- [路径克隆的每层复制成本与深度线性相关，根赋值成本与顶层键数线性相关] → 本轮接受，作为已知成本记录；优化（如根对象浅拷贝的惰性化）留待后续独立变更。
- [数组方案的通用包装使每次数组方法调用都发生一次数组浅拷贝（只读方法也拷）] → 本轮接受，与「不枚举方法名、自动覆盖 ECMAScript 未来方法」换取；只读方法虽拷贝但不进入提交、不触发更新，因此是纯性能成本而非正确性成本。后续若成为热点，可按「仅当方法可能变异时才拷贝」优化，但需以 spec 场景确保行为不变。


## Migration Plan

1. 落地写入侧：D1（路径类型）、D2（提交算法）、D7（scheduler 契约）、D8（调用约定修复），使 `proposal.md` 中与「旧快照冻结」「prevState 真实」相关的行为生效。
2. 回归 `tests/batchUpdateBasic/`、`tests/classConnect/`、`tests/subscribe/` 全量，确认批处理与类组件未回归。
3. 落地读取侧：D3（路径缓存）与 D6（`prevState` 引用快照），使身份稳定性生效。
4. 落地 class 侧写入：D5，并补充类组件写入的测试覆盖。
5. 重写 `tests/immutable/` 中失效的断言（现有断言以函数为参数，恒为真），改为逐条对应 `specs/` 中的 scenario。
6. 落地数组方案：D12（通用包装、提交路径含宿主、`pop`/`shift` 回归点），并补充数组场景的测试。
7. 修复 `Map`/`Set`（D13）：`parentTarget` 来源、单次提交、补齐 `has`/`keys` 路由、成员判断落在真实容器上。
8. 更新文档中关于链式更新的说明，明确 `immutable: true` 前提与叶节点边界。

回滚策略：本变更以独立提交落地，各步可单独回退。写入侧与读取侧之间无强依赖（读取侧缓存在写入侧正确时收益最大，但回退写入侧不会导致缓存失效错误）。

## Open Questions

- 路径缓存键采用「类型前缀 + `\u0001` 分隔」的字符串编码；当路径段为 Symbol 时按 `description` 编码，两个描述相同的不同 Symbol 会共享同一缓存项。属性名以 Symbol 为主的语言用法极少，且后果仅限该极端情形的代理身份共享；若后续需要严格正确，可改为长度前缀编码或按目标对象嵌套 `Map`，两者都可在不改变 spec 的前提下替换。是否需要现在就收紧，待实现后按实际用法判断。
- 缓存键用字符串拼接还是嵌套 `Map`，在何种路径长度下出现可测量的开销差异——可在实现后以基准测试回答，不影响 spec 与任务拆分。
- `set.ts` 的 `forEach` 路径段如何选取（元素索引计数器 vs `Symbol.for` 占位）会轻微影响 Set 嵌套读写的路径语义；由于 Map/Set 本轮定位为叶节点，可先取实现上最简单的一种并记录，待 Map/Set 链式更新立项时统一决定。
