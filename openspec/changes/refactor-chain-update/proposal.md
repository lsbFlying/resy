# Proposal

## Why

`immutable: true` 下的链式更新（`store.userInfo.name = 'x'`）名为 immutable，实际语义却是「先就地改写旧树上的对象，再替换根引用」。

实测证据（探针脚本，已还原）：

- 写入后旧快照被就地污染：写入前捕获的 `_$state_.userInfo` 的 `name` 从 `'a'` 变成 `'b'`；
- 写入路径上第一层对象被改写，而 `subscribe` 的 `prevState` 是浅拷贝、第二层以下共享引用，导致 `prevState` 自诞生即失真——实测 `prevState.userInfo` 报 `b/1`，而写入前真实值是 `a/1`；
- 最终值之所以正确，依赖「新旧根共享同一个已被改写的对象」这一未声明的时序巧合，没有测试保护；
- 同一路径反复读取返回不同的 Proxy（`store.userInfo === store.userInfo` 为 `false`），使 `useEffect`/`useMemo` 的依赖数组对嵌套对象完全失效；
- class 侧的 `this.store.count = 5` 静默丢失（`classEngineStore` 缺少 `set` 陷阱，写入落在空 target 上），不报错、不改数据、不重渲染；
- 现有 `tests/immutable/index1.test.tsx` 的断言写成 `expect(() => counter === 2)`（传入函数，恒为真），未验证任何行为，掩盖了上述问题。

因此需要把链式更新的契约明确为真 immutable，并让读取侧的身份稳定性成为可测的保证。

## What Changes

- **BREAKING**（行为层面）：链式写入不再就地改写旧树。路径上每一层都产生新引用（含根），路径外的分支保持同一引用，旧快照完全冻结。
- **BREAKING**（行为层面）：`subscribe` 回调的 `prevState` 变为真实的历史快照，不再是写入瞬间即被污染的浅拷贝。
- 路径表示从 `Set<{ key: keyof S }>` 改为有序的 `PropertyKey[]`，显式表达层级并支持同名 key 跨层。
- Proxy 按「路径」缓存：目标对象未变时，同一路径反复读取返回同一个 Proxy，使嵌套对象引用跨渲染稳定、可用于依赖数组。
- `classEngineStore` 补 `set` / `deleteProperty` 陷阱并转发到公共写入口，使 `this.store.count = 5` 与 hook 侧 `store.count = 5` 语义一致。
- 统一提交方式为「自叶子向上逐层克隆、一次性换根」，消除现有「先就地改、再换根、再被 scheduler 换根」的三段式时序依赖。
- 修复 `src/store/core.ts` 的 `apply` 陷阱把私有方法 `#createProxy` 当裸值传递导致 `this` 丢失的问题（当前 `store.m.get('k').v = 1` 抛 `TypeError`）。
- 移除 `src/subscribe/index.ts:31` 遗留的调试 `console.log(123, ...)`。

## Capabilities

### New Capabilities

- `state-update-semantics`: store 状态更新的可观察语义——链式（嵌套路径）更新的写时复制保证、旧快照与 `prevState` 的不可变性、`immutable` 选项的作用域、以及哪些数据类型被当作不可穿透的叶节点。
- `state-read-identity`: 状态读取侧的对象身份语义——同一路径重复读取与跨渲染读取时 Proxy 引用的稳定性保证，以及依赖数组（`useEffect` / `useMemo` / 类组件重渲染过滤）可以依赖该稳定性的契约。
- `class-store-connection`: `ComponentWithStore` 与 store 的连接契约——`this.store` 的读写能力与 hook 侧对称、类组件重渲染的触发条件，以及数据引用的登记方式。

### Modified Capabilities

（无。项目当前 `openspec/specs/` 为空，尚无既有 capability 的需求被修改。）

## Impact

**受影响代码**

- `src/store/core.ts`：Proxy 创建与陷阱（路径、`set` / `deleteProperty` / `apply`）
- `src/immutable/utils.ts`：`reduceChanged` → 路径克隆；`createNewRefValue` 的类型判定
- `src/immutable/types.ts`：`KeyChainsSourceItemType` 改为路径类型
- `src/immutable/map.ts`、`src/immutable/set.ts`：随路径类型与 `createProxy` 签名调整
- `src/updater/index.ts`：`updateMetaState` → 单次提交路径
- `src/scheduler/index.ts`：`assignMergeState` 契约（批处理合流点）
- `src/subscribe/index.ts`：`prevBatchState` 语义 + 移除调试日志
- `src/class-connect/index.ts`：`classEngineStore` 补写陷阱

**受影响 API / 语义**

- `store.<path> = value`：由「就地改写」变为「写时复制」，依赖旧快照不变或 `prevState` 精确的代码行为会改变
- `subscribe` 的 `prevState`：由污染值变为真实历史值
- `this.store.<key> = value`：由静默无效变为生效（新增能力）
- `ClassStoreType<S>`：类型保持可写，与实际能力对齐

**不受影响**

- 批处理行为：连续多次写入仍合流为一次更新（已有实现保持不动，需回归验证）
- `createStore` / `defineStore` / `useStore` / `useConciseState` 的调用签名
- 非 `immutable` 模式：保持原有就地写入行为

**已知约束（本轮不做，记录在案）**

- Map / Set 的链式更新仍不支持，被视为叶节点；本轮只修复其访问崩溃
- 路径穿过 class 实例、`Date`、`RegExp` 等非纯对象时不穿透，作为叶节点
- 依赖追踪粒度仍为第一层 key（嵌套粒度留待 computed 完善时统一处理）
- 写入时 O(顶层键数) 的根对象浅拷贝未优化
