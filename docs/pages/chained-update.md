# 链式更新的实现

> 本文面向开发者，讲解 `immutable: true` 下链式更新（`store.userInfo.name = 'x'`）的实现。使用方式见 [不可变更新与链式写入](./immutable.md)。

## 一、它要解决的问题

开启 `immutable` 后，一次嵌套写入必须同时满足四个条件：

| 条件 | 为什么需要 |
| --- | --- |
| 旧状态树**不被改写** | 状态历史、时间旅行、并发渲染 |
| 路径上每一层**换新引用** | 消费方靠引用比较感知变化；渲染层需要根身份变化 |
| 路径外的分支**共享引用** | 避免无关重渲染 |
| 同一路径**重复读取返回同一对象** | 嵌套对象才能放进 `useEffect` 依赖数组 |

旧实现的做法是「先就地改旧树上的对象，再替换根引用」，这会让前两条互相冲突：为了最终值正确，它依赖「新旧根共享同一个已被改写的对象」这一未声明的时序巧合。因此本次改为**真正的写时复制**。

## 二、核心契约：路径是唯一真相

全部实现只有三个角色，一条契约。

```
  ① 路径 StatePath = PropertyKey[]        「位置：从根怎么走」
          |
          v
  ② 代理（store/core.ts #createProxy）     「读时包装、写时把路径交出去」
          |
          v
  ③ 提交（immutable/utils.ts commitPath）  「按路径写时复制，产出新根」
```

**契约**：代理不关心自己的值是什么，它只携带「我是从根走哪几步到这里的」。所有读取、写入、提交都以这个路径重新定位。

这条契约取代了旧实现里分散三处、且互相依赖时序的位置信息（`Set<{key}>` + `firstLevelKey` + 代理闭包里的 `target`）。

## 三、路径怎么长出来

`store/core.ts` 的 `get` 陷阱每次用 `[...path, key]` 生成**新数组**，因此路径不可变、可安全共享：

```ts
get: (_: S, key: keyof S) => {
  const sourceFrom$State = path.length === 0;

  const value = sourceFrom$State ? this._$state_[key] : (target as S)[key];

  if (!sourceFromThis && immutable && typeof value !== "function" && proxyable(value)) {
    return this.#createProxy(value as object, [...path, key], applyOriginFunction);
  }
  // ...
}
```

以 `store.userInfo.address.city` 为例：

```
  store                    -> path = []                        target = _$state_
  store.userInfo           -> path = ['userInfo']              target = state.userInfo
  store.userInfo.address   -> path = ['userInfo','address']    target = state.userInfo.address
  .city                    -> 非可代理值（字符串），直接返回
```

`sourceFrom$State = path.length === 0` 是关键简化：**只有根层实时读 `_$state_`**（因为每次提交都会换掉它），嵌套层读自己的 `target`。

## 四、写：代理只交出位置

```ts
set: (_: S, key: keyof S, value: ValueOf<S>) => updater.updateMetaState(
  [...path, key], value, false,
),
deleteProperty: (_: S, key: keyof S) => updater.updateMetaState(
  [...path, key], undefined as ValueOf<S>, true,
),
```

代理**完全不碰数据** —— 没有 `target`、没有 `firstLevelKey`、没有递归、没有「先改再换根」。它只报出「写到哪」和「写什么」。

## 五、提交：`commitPath`

核心中的核心，`src/immutable/utils.ts`：

```ts
export const commitPath = <S extends PrimitiveState>(
  root: S, path: StatePath, value: unknown, isDelete = false,
): CommitResult<S> => {
  const leafKey = path[path.length - 1];
  const rest = path.slice(0, -1);

  // 宿主只读一次，校验与复制共用
  const leafOwner = readAtPath(root, rest);
  if (!isPenetrable(leafOwner)) {
    return leafOwner === undefined
      ? { committed: false, reason: "noop" }              // 路径不存在：普通无操作
      : { committed: false, reason: "leaf", host: leafOwner };  // 撞上叶节点：交给调用方报错
  }

  if (!isDelete && Object.is(leafOwner[leafKey], value)) {
    return { committed: false, reason: "noop" };           // 值没变
  }

  const newLeafOwner = cloneShallow(leafOwner);            // ① 复制叶子容器
  if (isDelete) Reflect.deleteProperty(newLeafOwner, leafKey);
  else newLeafOwner[leafKey] = value;

  let current: unknown = newLeafOwner;
  for (let i = rest.length - 1; i >= 0; i--) {             // ② 自下而上复制
    const next = cloneShallow(readAtPath(root, rest.slice(0, i)));
    next[rest[i]] = current;
    current = next;
  }

  return { committed: true, root: current as S };
};
```

### 关键在 ② 那个反向循环

用 `store.userInfo.address.city = 'sh'` 走一遍（`path = ['userInfo','address','city']`，故 `rest = ['userInfo','address']`）：

```
  ① leafOwner = readAtPath(root, ['userInfo','address'])   = 旧 address
     newLeafOwner = { ...旧address, city: 'sh' }            ← 新 address，原对象零写入

  ② i = 1：readAtPath(root, ['userInfo']) = 旧 userInfo
     next = { ...旧userInfo, address: 新address }           ← 新 userInfo

  ③ i = 0：readAtPath(root, []) = root
     next = { ...root, userInfo: 新userInfo }               ← 新 root
```

```
   旧树                                  新树
   root ────────────┐                    root'              ← 新
     userInfo       │                      userInfo'        ← 新
       address      │                        address'       ← 新
         city:'bj'  │                          city:'sh'    ← 新值
                    └── 旧树三层引用原封不动，全程无写入
```

注意 `readAtPath(root, ...)` **始终从传入的 `root` 读**，所以每一层复制的都是**旧树上的对象**。「旧快照冻结」正来源于此。

### 为什么返回联合类型

```ts
export type CommitResult<S> =
  | { committed: true; root: S }
  | { committed: false; reason: "leaf"; host: unknown }
  | { committed: false; reason: "noop" };
```

两个原因：

1. **让「无变化」和「被拒绝」不再挤在同一个 `boolean` 里**。用返回 `S | null` 之类的写法，调用方很容易把「拒绝」误当成「没变化」而静默丢弃写入。
2. **调用方不可能读到一个从未构建过的 root** —— 类型上就要求先判别 `committed`。

`host` 随结果带出，是为了让报错能命名「是哪个类型的值拒绝了写入」，而不用**再走一遍路径**。

### 三个分支的语义

| 情况 | 返回 | 调用方行为 |
| --- | --- | --- |
| 值真的变了 | `{ committed: true, root }` | 提交新根 + 通知 |
| 值没变 / 路径走不通 | `{ committed: false, reason: "noop" }` | 静默，什么都不做 |
| 撞上不可穿透的叶节点 | `{ committed: false, reason: "leaf", host }` | 开发期抛错，生产期静默 |

## 六、编排：`updateMetaState`

`src/updater/index.ts`：

```ts
updateMetaState(path: StatePath, value: ValueOf<S>, isDelete = false): boolean {
  const key = path[0] as keyof S;

  const result = commitPath(this.$metaStore._$state_, path, value, isDelete);

  if (!result.committed) {
    if (result.reason === "leaf") pathErrorProcessing(path, result.host);
    return true;
  }

  const { _scheduler_, _subscriber_ } = this.$metaStore;
  _subscriber_.willUpdatingProcessing();      // ★ 必须在安装根之前
  _scheduler_.commitRoot(result.root, key, value);
  this.finallyBatchProcessing();

  return true;
}
```

三层职责与命名：

```
  commitPath     (immutable/utils.ts)   构造：按路径写时复制，产出新根
       |
       v
  updateMetaState (updater)             编排：抓 prevState → 安装 → 调度批次
       |
       v
  commitRoot      (scheduler)           提交：_$state_ = newRoot + 记录 taskData
```

**★ 的顺序是硬约束**：`willUpdatingProcessing()` 负责抓 `prevState`。它若在 `commitRoot` 之后调用，订阅者拿到的「旧状态」就已经是新状态了。

## 七、代理缓存：身份稳定的来源

`src/store/core.ts`：

```ts
const cacheKey = pathKey(path);
const cacheForTarget = this.#proxyCache.get(target as object);
const cached = cacheForTarget?.get(cacheKey);
if (cached !== undefined) return cached;

const proxy = new Proxy(target, { /* traps */ });

const perTarget = this.#proxyCache.get(target as object);
if (perTarget === undefined) {
  this.#proxyCache.set(target as object, new Map([[cacheKey, proxy]]));
} else {
  perTarget.set(cacheKey, proxy);
}
return proxy;
```

结构是 `WeakMap<目标对象, Map<路径键, 代理>>`。

**内层键为什么必须是路径，不能只用目标对象？** 对象可以被多处共享：`{ a: { s: shared }, b: { s: shared } }`。若只按目标对象缓存，两条路径会拿到同一个代理，而代理只能携带一条路径 —— 写 `store.a.s.x` 就会落到 `b` 上。

**为什么不需要显式失效？** 提交会替换路径上的对象，新对象没有缓存项，自然产生新代理；旧对象连同它的缓存项被 GC。这条「缓存依赖提交后目标对象被替换」的耦合是必须保持的不变式 —— 任何「就地改完复用旧代理」的优化都会破坏它。

### `pathKey` 的编码

`src/store/utils.ts`。直观做法是拿分隔符把路径 `join` 起来，但那会产生碰撞：

```
  ['a', 'sb'].join(SEP)    === 'a' + SEP + 'sb'     // 两个段
  ['a\u0001sb'].join(SEP)  === 'a' + SEP + 'sb'     // 一个段，字符串相同
```

两条不同路径得到同一个键，于是共用缓存项，其中一条解析到错误对象。修法是**逐段转义**：每段加类型前缀，段内的分隔符双写。

```
  ['a', 'sb']     ->  "sa\u0001ssb"        读作 s a │ s s b    -> 两段 'a'、'sb'
  ['a\u0001sb']   ->  "sa\u0001\u0001sb"   读作 s a ␁␁ s b     -> 一段 'a\u0001sb'
```

因为**段内的分隔符都被双写**，单个分隔符就只可能出现在段边界上，编码可被无歧义反解。类型前缀另行解决 `[1]` 与 `['1']` 的碰撞。

## 八、数组：为什么必须「单次提交」

数组方法不是一次属性写入，而是一串：

```
  arr.push(99)
     ├── arr[len] = 99        -> set 陷阱
     └── arr.length = len+1   -> set 陷阱
```

若这两次各自提交，第二次提交时 `length` 已被第一次改过，方法内部的读写会与不断替换的 root 互相打架。实测中这种模式会让 `pop`/`shift` 直接把状态弄坏。

所以数组走**通用包装** —— 不判断方法名，而是让任意函数调用都作用于独立副本、然后提交一次：

```ts
return (...args: unknown[]) => {
  const current = readAtPath(this._$state_, path);
  if (!Array.isArray(current)) return undefined;

  const draft = current.slice();                        // ① 独立副本
  const result = Reflect.apply(member, draft, args);    // ② 原生语义作用于副本

  let changed = draft.length !== current.length;        // ③ 内容比较
  if (!changed) {
    for (let i = 0; i < draft.length; i++) {
      if (!Object.is(draft[i], current[i])) { changed = true; break; }
    }
  }
  if (changed) {
    updater.updateMetaState(path, draft as ValueOf<S>, false);   // ④ 恰好一次提交
  }

  return result === draft ? proxy : result;             // ⑤ 返回 this 的方法交回本代理
};
```

三个要点：

- **不枚举方法名**：所有函数共用一条路径，ECMAScript 未来新增的变异方法自动覆盖。代价是每次调用有一次数组浅拷贝（只读方法也拷）。
- **③ 不能省**：`draft` 永远是**新数组**，提交步骤的身份比较必然判为「有变化」。不比较内容的话，`slice`/`map`/`join` 这些只读方法也会换根并通知订阅者。
- **④ 用 `path` 而非 `[...path, key]`**：数组代表它所在的整个位置，提交路径必须包含**宿主**，否则宿主不被克隆，旧快照会与新数组共享引用。这个错误的症状是「值对了但快照被污染」，靠值断言发现不了。

### 数组与对象的快照语义必须一致

数组分支的读取来源要和对象分支对齐：

```ts
const live = readAtPath(this._$state_, path);
const source = live === target ? live : target;
```

- 仍是当前位置（`live === target`）→ 读活值；
- 已被提交替换（陈旧代理）→ 读 `target`，即**读时那个对象**。

对象分支读 `target`，所以写入前取得的引用是一个忠实的快照。若数组无条件读活值，被持有的数组就会跟随后续提交，于是「数组跟随、对象不跟随」——两者行为不一致。

## 九、四类值放在一起看

| 值 | 处理方式 | 写入穿透 | 旧快照 |
| --- | --- | --- | --- |
| 纯对象 / 数组 | `commitPath` + 数组通用包装 | ✅ | 冻结 |
| `Map` / `Set` | 专用工厂（`map.ts`/`set.ts`），方法被包装成代理以进入 `apply` 陷阱，工厂以容器为 receiver、克隆真实容器后单次提交 | ✅（成员级） | 冻结 |
| `Date` / `RegExp` | 不满足 `proxyable`，返回原始对象 | ❌ 绕过状态 | **会被就地改** |
| 类实例 | `proxyable` 为真、`isPenetrable` 为假 | ❌ 开发期报错 | 冻结（写入被拒） |

`Date` 那一行是唯一无法保证冻结的：它在代理链之外，对其调用自身变更方法既不进状态树、也不触发更新，但确实改写了那个对象。这是叶节点规则的已知代价，已作为契约写进 spec，而不是留成含糊地带。

## 十、完整调用链

```
  store.userInfo.address.city = 'sh'
        │
        ├─ get('userInfo')   -> path ['userInfo']
        ├─ get('address')    -> path ['userInfo','address']
        │
        └─ set('city','sh')  -> updateMetaState(['userInfo','address','city'], 'sh')
                 │
                 ├─ commitPath(root, path, 'sh')
                 │     └─ 自下而上复制 address → userInfo → root
                 │
                 ├─ result.committed === true
                 │
                 └─ willUpdatingProcessing()      ★ 先抓 prevState
                    commitRoot(newRoot, 'userInfo', 'sh')
                      ├─ _$state_ = newRoot
                      └─ taskData.userInfo = 'sh'
                    finallyBatchProcessing()      -> 微任务中统一 flush
```

批处理合流点在这里：同一同步块内多次写入，`taskData` 按**第一层键**合并，微任务里只跑一轮 `batchUpdateProcessingCore`，订阅者只被通知一次。

## 十一、相关文件

| 文件 | 职责 |
| --- | --- |
| `src/immutable/utils.ts` | `commitPath`、`readAtPath`、`isPenetrable`、`cloneShallow`、`iteratorProcessing` |
| `src/immutable/types.ts` | `StatePath`、`CreateProxyType`、Map/Set 工厂类型 |
| `src/store/core.ts` | `#createProxy`（`get`/`set`/`deleteProperty` 陷阱）、`#proxyCache` |
| `src/store/utils.ts` | `pathKey` 路径编码 |
| `src/updater/index.ts` | `updateMetaState` 编排、`setState` 键循环 |
| `src/scheduler/index.ts` | `commitRoot` 提交根、`taskData` 批处理记账 |
| `src/immutable/map.ts` / `set.ts` | `Map`/`Set` 原型方法的工厂 |
| `src/immutable/index.ts` | 方法名 → 工厂的路由表 |

对应的验收测试集中在 `tests/immutable/`：`index2`（写入侧语义）、`index3`（读取身份与 `pathKey`）、`index4`（数组）、`index5`/`index6`（路径模型与 `commitPath`）、`index7`（`prevState`）、`index8`（`Map`/`Set`）。
