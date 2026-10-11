# Spec Delta

## Purpose

定义状态读取侧的对象身份语义：在 `immutable` 模式下，同一嵌套路径的读取必须返回身份稳定的代理对象，使依赖数组与重渲染过滤能够基于引用比较正确工作。

## ADDED Requirements

### Requirement: 同一路径重复读取返回同一对象身份

在 `immutable` 模式下，对同一状态路径的重复读取 MUST 返回同一个代理对象，使 `Object.is` 比较能够用于判断该路径是否发生变化。

#### Scenario: 同一次渲染内重复读取同一路径

- **WHEN** 在同一执行上下文中连续两次读取 `store.userInfo`，且期间未发生任何状态写入
- **THEN** 两次读到的对象是同一个对象

#### Scenario: 深层路径重复读取

- **WHEN** 连续两次读取 `store.userInfo.address`，且期间未发生任何状态写入
- **THEN** 两次读到的对象是同一个对象

### Requirement: 目标对象未变时跨渲染保持身份稳定

当某条路径对应的目标对象未被写入改变时，该路径在多次渲染之间 MUST 返回身份相同的对象，使该值可以安全地用于 `useEffect`、`useMemo` 的依赖数组以及组件间的引用比较。

#### Scenario: 无关状态更新不影响嵌套路径身份

- **WHEN** 组件渲染时读取 `userInfo.address` 并将其放入依赖数组，随后发生一次与 `userInfo` 无关的状态更新并触发重渲染
- **THEN** 两次渲染读到的 `address` 是同一个对象，依赖该值的副作用不因该次更新而重新执行

#### Scenario: 兄弟字段变更不影响嵌套路径身份

- **WHEN** 读取 `userInfo.address` 后，只修改 `userInfo` 下的兄弟字段 `name`
- **THEN** 重新渲染时读到的 `address` 与之前是同一个对象

### Requirement: 目标对象变化时提供新身份

当路径对应的目标对象被写入改变时，该路径 MUST 返回与变化前不同的对象身份，使依赖该值的消费方能够观察到变化。

#### Scenario: 修改目标对象自身产生新身份

- **WHEN** 读取 `userInfo.address` 后，对 `address.city` 执行链式写入
- **THEN** 重新渲染时读到的 `address` 与之前不是同一个对象

#### Scenario: 目标对象被替换时路径身份跟随更新

- **WHEN** 读取 `userInfo.address` 后，对 `userInfo.address` 整体赋值为一个新对象
- **THEN** 重新渲染时读到的 `address` 是新赋值的对象，而非写入前的旧对象

### Requirement: 路径读取必须始终反映当前状态

在 `immutable` 模式下，对某条路径的读取 MUST 返回当前状态树中该位置的对象，MUST NOT 返回已被写入替换掉的旧对象。

#### Scenario: 路径读取总是取得当前位置的值

- **WHEN** 先读取 `userInfo.address` 并持有该引用，随后对 `userInfo.address` 整体赋值为新对象，再重新读取该路径
- **THEN** 新读到的对象是新赋值的对象，而先前持有的引用仍指向旧对象且其内容未被修改

#### Scenario: 未受影响的路径在其祖先上发生写入时保持同一值

- **WHEN** 读取 `userInfo.address` 后，对 `userInfo` 下的兄弟字段 `name` 执行链式写入
- **THEN** 重新读取 `userInfo.address` 得到的仍是与写入前相同的对象

### Requirement: 同一对象被多处共享时按路径独立标识

当同一个对象被挂在状态树的不同路径下时，系统 MUST 按路径区分其代理身份，且对任一路径的写入 MUST 只影响该路径所属的位置，MUST NOT 改写另一路径下的状态。

#### Scenario: 共享对象在不同路径下写入互不影响

- **WHEN** 同一对象被同时挂在 `a.s` 与 `b.s` 两条路径下，先读取两条路径，随后对 `a.s` 的字段执行写入
- **THEN** `a.s` 的字段更新生效，而 `b.s` 的字段保持写入前的值

#### Scenario: 共享对象在不同路径下可同时被修改

- **WHEN** 同一对象被同时挂在 `a.s` 与 `b.s` 两条路径下，分别对两条路径的字段执行写入
- **THEN** 两次写入的结果都生效，且各自位置上保留对应的值
