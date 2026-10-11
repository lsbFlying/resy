# Tasks

> 参考：`specs/state-update-semantics`、`specs/state-read-identity`、`specs/class-store-connection` 定义「做什么」，`design.md` 定义「怎么做」（D1–D12，其中 D10 为 `updater`/`scheduler` 最终契约、D11 为逐文件改动清单、D12 为数组通用包装）。
> 采用 design.md 的迁移策略：先落地路径模型与写入侧（第 1–2 组）并回归，再落地数组变异（第 3 组），随后读取侧（第 4–5 组），最后 class 侧与集成（第 6–7 组）。

## 1. 路径模型与读写陷阱骨架（D1）

- [x] 1.1 在 `src/immutable/types.ts` 新增 `StatePath = PropertyKey[]`，删除 `KeyChainsSourceItemType`；将 `CreateProxyType` 签名改为 `(target, parentTarget, path: StatePath, applyOriginFunction?)`，同步 `MapPrototypeProxyableFactoryType`、`SetPrototypeProxyableFactoryType`，删除其中的 `firstLevelKey`、`keyLevel`、`keyChains` 参数；验证 `npx tsc --noEmit` 列出所有待同步引用点，且列出的位置与 D11 清单一致
- [x] 1.2 在 `src/store/core.ts` 的 `#createProxy` 中把参数 `keyChains: Set<...>` 改为 `path: StatePath`，路径通过 `[...path, key]` 递进（每次产生新数组，不修改入参）；验证路径累积测试通过：对 `userInfo.nameInfo.value` 写入时 `commitPath` 收到的路径为 `['userInfo','nameInfo','value']`
- [x] 1.3 新增同名 key 跨层路径测试：对 `{ x: { x: { x: 1 } } }` 执行 `store.x.x.x = 42`，验证路径长度为 3、内容为 `['x','x','x']`、最终值为 `42`（该用例在旧 Set 实现下会因去重而塌缩）
- [x] 1.4 更新 `src/immutable/utils.ts` 的 `iteratorProcessing`：路径参数改为 `StatePath` 并移除 `keyLevel`，迭代递进改为 `[...path, key]`；验证 `npx vitest run tests/dataType tests/basic` 全量通过

## 2. 写入侧：路径克隆提交与调度契约（D2、D7、D8、D9、D10）

- [x] 2.1 在 `src/immutable/utils.ts` 用 `commitPath(root, path, value, isDelete?)` 替换 `reduceChanged`，按其纯函数契约实现（变化返回新根，无变化返回传入的 `root` 本身）；新增 `readAtPath`、`cloneShallow`、`isPenetrable` 三个辅助函数；将 `createNewRefValue` 收敛为 `cloneShallow`（仅纯对象与数组）；验证单元测试覆盖 D2 各情形：同值写入零分配、`path.length === 1` 的根级写入、删除末段、路径穿过非纯对象时不产生新引用
- [x] 2.2 修改 `src/updater/index.ts` 的 `updateMetaState` 为 `(path: StatePath, value: unknown, isDelete?: boolean) => boolean`，移除 `target`、`firstLevelKey`、`keyChains`、`applyOriginFunction` 四个参数，旧值改为通过 `readAtPath(_$state_, path.slice(0, -1))` 从当前根读取（不读代理闭包中的 `target`）；验证调用方 `src/store/core.ts` 与 `src/store/index.ts` 的陷阱同步更新后 `npx tsc --noEmit` 通过
- [x] 2.3 将 `src/immutable/map.ts` 与 `src/immutable/set.ts` 中手抄的 `reduceChanged + updateMetaState` 组合替换为单次 `commitPath` 调用，消除三份分叉逻辑；同时清理 `src/immutable/set.ts` 的 `forEach` 分支中两处 `{ key: "?" }` 占位路径段（按 D8 选取元素索引计数器或 `Symbol.for` 占位，并在代码注释中记录该选择）；验证 `npx vitest run tests/dataType tests/basic` 全量通过
- [x] 2.4 将 `src/scheduler/index.ts` 的 `assignMergeState` 改为 `(newRoot: S, changedKey: keyof S, value: ValueOf<S>)`，移除其内部的根对象浅拷贝，直接赋值 `_$state_ = newRoot` 并记录 `taskData`；同步 `src/updater/index.ts` 的调用点；验证 `npx vitest run tests/batchUpdateBasic`（5 个文件）全量通过且连续写入仍合流为一次回调
- [x] 2.5 按 D9 实现批内「无变化」的记录条件：`updateMetaState` 中以「`commitPath` 返回的新根 !== 当前根」或「本批次已对该键有记录」为条件决定是否调用 `assignMergeState`，确保批内后续同值写入仍会把本批次构建的新根赋给 `_$state_`；验证 batchUpdateBasic 的连续写入用例通过，且首次同值写入不触发回调
- [x] 2.6 修复 `src/store/core.ts` 的 `apply` 陷阱：将裸传的 `this.#createProxy` 改为闭包包装器 `(target, parentTarget, path, applyOriginFunction) => this.#createProxy(...)`，杜绝 `this` 丢失；验证构造含 Map 的状态并执行 `store.m.get('k')` 不再抛 `TypeError`，且 `npx vitest run tests/dataType` 通过
- [x] 2.7 按 D10 更新 `updater.setState` 的键循环：改为 `commitPath(_$state_, [key], value)` 后按 2.5 的条件提交，并保持 `willUpdatingProcessing()` 在赋值 `_$state_` 之前调用；验证 `npx vitest run tests/setState tests/syncUpdate` 全量通过
- [x] 2.8 在 `tests/immutable/index2.test.tsx` 中按 `specs/state-update-semantics` 的 scenario 逐条落地写入侧测试：旧快照冻结、路径各层新引用、路径外结构共享、同值写入不产生新引用；验证 `npx vitest run tests/immutable` 通过，且每条断言在临时回退对应实现后能失败（确认断言真实生效）
- [x] 2.9 在同一文件补充叶节点边界测试，对应 spec 中「链式写入仅对纯对象与数组生效」：`Date` 整体替换生效、`Date` 内部方法调用不产生新引用（且其内部值被就地修改、旧快照可观察到该修改）、数组元素链式写入生效；验证 `npx vitest run tests/immutable` 通过

## 3. 数组变异：通用包装 + 单次提交（D12）

> 依赖第 2 组的 `commitPath`。本组同时修复现有缺陷：`store.list.pop()` 与 `store.list.shift()` 当前直接抛 `TypeError` 并把数组变成 `undefined`。

- [x] 3.1 在 `src/store/core.ts` 的 `#createProxy` 中为数组分支实现通用包装：当 `target` 是数组且读取到的值是函数时，返回一个包装函数——按路径从当前树取数组、浅拷贝为 draft、`Reflect.apply(method, draft, args)`、以**该数组自身所在的路径**（含宿主那一级）调用一次 `commitPath` 提交；验证十个变异方法结果正确：`push`/`pop`/`shift`/`unshift`/`splice`/`sort`/`reverse`/`fill`/`copyWithin` 与直接写 `length`
- [x] 3.2 按 spec 中「数组变异方法必须产生新数组且不改动旧快照」补充 `tests/immutable/index4.test.tsx`：旧数组引用在变异后保持原内容、新数组与新根身份变化、路径外分支保持同一引用；验证 `npx vitest run tests/immutable` 通过，且断言在去掉包装后可失败
- [x] 3.3 补充「宿主对象被克隆」与「嵌套数组」测试：对 `store.nested.arr.push(9)` 验证数组、宿主对象与根三者都获得新引用，且 `旧 nested !== 新 nested`；该断言必须独立存在，因为它捕获的是「提交路径漏掉宿主」这一症状为「值对但旧快照被污染」的易错点
- [x] 3.4 补充「代码未列举的变异方法同样生效」的测试：运行时在 `Array.prototype` 上挂载一个系统代码中不存在的方法名，通过状态中的数组调用并验证变更生效，随后清理该原型方法；该测试是「不枚举方法名」这一契约的直接体现
- [x] 3.5 补充 `pop`/`shift` 回归测试并验证不再抛 `TypeError`、数组不会变为 `undefined`：分别执行 `store.list.pop()` 与 `store.list.shift()`，验证结果数组内容正确且旧数组未被修改
- [x] 3.6 按 spec 中「数组只读方法不得触发状态更新」补充测试：连续调用 `slice`/`map`/`join`/`indexOf`/`concat`/`filter` 后验证返回值正确、根状态对象与数组引用均未变化、`taskData` 为空（不产生待处理更新）；验证该测试在把只读方法也纳入提交且不做值比较时会失败
- [x] 3.7 按 spec 中「数组被整体替换后变异必须作用于新数组」补充测试：`push(3)` → `store.list = [9,9]` → `push(7)` 后结果必须为 `[9,9,7]`，且整体替换后立即读取得到新数组内容；验证该测试能捕获「常驻 draft 基线过期」这一错误实现
- [x] 3.8 验证链式调用返回值契约：`push` 返回新的 `length` 数值，`sort`/`reverse` 的返回值与 `store.list` 是同一对象（可继续链式），验证新增测试通过

## 4. 读取侧：代理按路径缓存（D3）

- [x] 4.1 在 `src/store/core.ts` 的 `MetaStore` 中新增实例私有字段 `#proxyCache: WeakMap<object, Map<string, Store<S>>>` 与模块级 `pathKey(path: StatePath)` 编码函数（按 D3 的类型前缀 + `\u0001` 分隔实现），在 `#createProxy` 创建代理前先查缓存、未命中再创建并写回；验证 spec 中「同一路径重复读取返回同一对象身份」的两个 scenario：`store.userInfo === store.userInfo` 与 `store.userInfo.address === store.userInfo.address` 均为真
- [x] 4.2 在 `tests/immutable/index3.test.tsx` 中补充跨渲染身份稳定测试，对应 spec 中「目标对象未变时跨渲染保持身份稳定」：组件读取 `userInfo.address` 并在一次与 `userInfo` 无关的状态更新后重渲染，两次读到的对象相同，且依赖该值的副作用不因该次更新重跑；验证 `npx vitest run tests/immutable tests/finegrained` 通过
- [x] 4.3 补充共享对象按路径区分身份的测试，对应 spec 中「同一对象被多处共享时按路径独立标识」：同一对象挂在 `a.s` 与 `b.s` 两处，分别写入互不串位置；验证该用例在把缓存键退化为「只按目标对象」时失败（确认它能捕获 D3 的替代方案）
- [x] 4.4 补充「目标对象变化时提供新身份」与「路径读取必须始终反映当前状态」的测试：修改 `address.city` 后 `address` 获新身份；整体替换 `userInfo.address` 后重新读取得到新对象而先前持有的旧引用内容不变；验证新增测试通过
- [x] 4.5 补充陈旧代理写入语义测试（D3 契约）：持有提交前取得的嵌套代理引用，在该路径的对象已被替换后通过旧代理写入，验证写入落在路径的当前位置而非静默写错位置

## 5. 订阅侧：prevState 语义与调试输出清理（D6、D8）

- [x] 5.1 将 `src/subscribe/index.ts` 的 `prevBatchState` 由 `{ ..._$state_ }` 浅拷贝改为直接持有 `_$state_` 引用快照，并移除遗留的调试输出；验证 spec 中「订阅回调的前置状态必须是真实历史快照」的两个 scenario：状态为 `{ userInfo: { name: 'a', age: 1 } }` 时在同批次内依次写入 `name = 'b'` 与 `age = 20`，回调收到的 `prevState.userInfo.name` 为 `'a'` 且 `.age` 为 `1`
- [x] 5.2 补充 `prevState` 不被后续写入改写的测试（批次完成后通过先前引用再次读取仍为历史值）；验证 `npx vitest run tests/subscribe` 通过，且该测试在把 5.1 回退为浅拷贝后失败

## 6. class 侧写入能力（D5）

- [x] 6.1 为 `src/class-connect/index.ts` 的 `classEngineStore` 补 `set`（`Reflect.set(store, key, value)`）与 `deleteProperty`（`Reflect.deleteProperty(store, key)`）陷阱，转发到 `createStore` 返回的外层代理；读路径与依赖登记逻辑保持不变；验证 spec 中 `class-store-connection` 的写入 scenario：类组件执行 `this.store.count = 5` 后状态变为 `5`、组件重渲染且 DOM 反映新值
- [x] 6.2 在 `tests/classConnect/index8.test.tsx` 中补充类组件嵌套写入与删除属性测试，对应 spec 中「嵌套赋值与 hook 侧语义一致」与「删除第一层属性生效」：`this.store.userInfo.name = 'b'` 在 `immutable` 下具有写时复制语义（旧快照冻结）、`delete this.store.someKey` 生效且订阅该键的组件重渲染；验证 `npx vitest run tests/classConnect` 通过
- [x] 6.3 补充类组件重渲染按引用登记过滤的测试，对应 spec 中「类组件重渲染必须按引用登记过滤」：只读取 `count` 的组件在 `text` 变化时不重渲染、在 `count` 变化时重渲染、读取 `userInfo` 的组件在嵌套写入时重渲染；验证新增测试通过
- [x] 6.4 补充类组件卸载与共享状态的测试，对应 spec 中「类组件卸载后必须停止接收更新」与「类组件与 hook 共享同一份状态更新语义」：卸载后状态更新不触发渲染且不报错、同一 store 被类组件与函数组件同时连接时一次写入对两者状态一致；验证 `npx vitest run tests/classConnect` 通过

## 7. 集成验证与文档

- [x] 7.1 运行全量测试 `npm test`（`vitest run --coverage`），确认既有测试与新增测试全部通过；对现有以函数为参数的失效断言（`expect(() => x === n)`）确认已按 spec 改写为真实断言
- [x] 7.2 运行 `npm run build` 确认 `rollup` 与类型声明生成成功（覆盖 `src/immutable/types.ts` 的 `StatePath` 与 `CreateProxyType` 签名改动）
- [x] 7.3 运行 `./.tooling/node_modules/.bin/openspec validate refactor-chain-update --strict` 确认 change 的 spec 与 artifact 结构通过校验
- [x] 7.4 更新项目文档中关于链式更新的说明（`README.md` 与 `docs/`），写明 `immutable: true` 为前提、旧快照冻结保证、路径读取身份稳定的用法（可用于依赖数组）、以及叶节点边界（Map/Set/class/`Date` 不可穿透）；验证文档中给出的示例代码按原文执行可得到所述结果

## Workflow follow-up

- 归档前确认 design.md D3 记录的「路径缓存依赖提交后目标对象被替换」这一耦合点已有对应测试保护（4.4 与 4.5 覆盖）。
- 归档前确认 design.md Open Questions 中关于 Symbol 路径键与 `set.ts` `forEach` 路径段的两条待定项已按实际实现记录结论。
- 归档完成后核对主 spec 的 `## Purpose` 是否按 `specs/*/spec.md` 的内容正确生成。
