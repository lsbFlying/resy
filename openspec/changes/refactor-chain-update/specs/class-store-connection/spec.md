# Spec Delta

## Purpose

定义类组件通过 `ComponentWithStore` 连接 store 后的行为契约：`this.store` 的读写能力、重渲染的触发条件，以及类组件可观察的状态引用登记方式。

## ADDED Requirements

### Requirement: 类组件的 this.store 必须支持读取状态与工具方法

`this.store` MUST 提供对 store 状态的读取能力，并 MUST 暴露 store 的公共工具方法（例如 `setState`、`syncUpdate`）。读取状态时不存在的第一层键 MUST 返回 `undefined` 而非抛出异常。

#### Scenario: 读取第一层状态

- **WHEN** 类组件在渲染中读取 `this.store.count`
- **THEN** 返回状态中 `count` 的当前值

#### Scenario: 读取嵌套状态

- **WHEN** 类组件读取 `this.store.userInfo.name`
- **THEN** 返回状态中该嵌套路径的当前值

#### Scenario: 读取 store 工具方法

- **WHEN** 类组件读取 `this.store.setState` 或 `this.store.syncUpdate`
- **THEN** 返回可调用的函数，且其行为与通过 `createStore` 返回的 store 调用时一致

#### Scenario: 读取不存在的键

- **WHEN** 类组件读取一个状态中不存在且不属于工具方法的第一层键
- **THEN** 得到 `undefined`，不抛出异常

### Requirement: 类组件的 this.store 写入必须生效并触发更新

`this.store` 的第一层属性赋值 MUST 更新 store 状态，并 MUST 触发类组件的重渲染。该写入 MUST 与通过 `createStore` 返回的 store 执行同名赋值具有一致的语义，MUST NOT 静默失败。

#### Scenario: 第一层赋值更新状态

- **WHEN** 类组件执行 `this.store.count = 5`
- **THEN** store 状态中的 `count` 变为 `5`

#### Scenario: 第一层赋值触发重渲染

- **WHEN** 类组件执行 `this.store.count = 5`，且该组件在渲染中读取了 `count`
- **THEN** 组件重新渲染，且渲染输出反映新值

#### Scenario: 嵌套赋值与 hook 侧语义一致

- **WHEN** 类组件执行 `this.store.userInfo.name = 'b'`，且 `immutable` 已开启
- **THEN** 该写入具有与 hook 侧 `store.userInfo.name = 'b'` 相同的写时复制语义

#### Scenario: 删除第一层属性生效

- **WHEN** 类组件执行 `delete this.store.someKey`
- **THEN** 状态中的该键被移除，且订阅该键的组件重新渲染

### Requirement: 类组件重渲染必须按引用登记过滤

类组件在渲染中读取过的第一层键 MUST 被登记为引用。状态更新后，类组件 MUST 只在被登记的键发生变化时重渲染，未被登记的键发生变化时 MUST NOT 触发该组件的重渲染。

#### Scenario: 未使用的键变化不触发重渲染

- **WHEN** 类组件在渲染中只读取了 `count`，随后状态中的 `text` 发生变化
- **THEN** 该组件不重渲染

#### Scenario: 已使用的键变化触发重渲染

- **WHEN** 类组件在渲染中读取了 `count`，随后状态中的 `count` 发生变化
- **THEN** 该组件重渲染

#### Scenario: 嵌套写入按其第一层键触发重渲染

- **WHEN** 类组件在渲染中读取了 `userInfo`，随后对 `userInfo` 下的嵌套字段执行写入
- **THEN** 该组件重渲染，且渲染输出反映新的嵌套值

### Requirement: 类组件卸载后必须停止接收更新

类组件卸载后，其与 store 的连接 MUST 被解除，MUST NOT 再因状态更新而触发渲染或抛出异常。

#### Scenario: 卸载后状态更新不触发已卸载组件

- **WHEN** 类组件卸载后，store 状态发生变化
- **THEN** 该组件不再渲染，且不产生错误

#### Scenario: 卸载后清理数据引用登记

- **WHEN** 类组件卸载
- **THEN** 其登记的引用集合被清空

### Requirement: 类组件与 hook 共享同一份状态更新语义

类组件与函数组件的更新 MUST 汇入同一个状态更新流程，共享同一份批次调度与不可变处理。同一 store 被类组件与函数组件同时连接时，一次状态写入 MUST 对两者产生一致的最终状态。

#### Scenario: 类组件与 hook 组件共享状态

- **WHEN** 同一个 store 同时被一个类组件与一个函数组件连接，任一方的动作更新了共享状态
- **THEN** 两方读到的状态值一致，且各自按自身登记的引用决定是否重渲染

#### Scenario: 批次内多次写入合流为一次更新

- **WHEN** 在同一同步执行块内连续多次写入状态
- **THEN** 连接该 store 的组件在本轮批次结束后统一更新，订阅回调只被通知一次
