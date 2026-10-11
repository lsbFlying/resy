# Spec Delta

## Purpose

定义 store 状态更新在写入侧的可观察语义：链式（嵌套路径）更新必须做到写时复制，使旧状态树保持冻结、路径上的引用变化可被消费方观测，并明确哪些数据类型可被写入穿透。

## ADDED Requirements

### Requirement: 链式更新不得修改写入前的状态树

当通过嵌套路径写入（例如 `store.userInfo.name = 'x'`）时，系统 MUST NOT 修改写入前已存在的任何状态对象。写入前通过 `_$state_` 或任意已持有的引用访问到的对象，在写入后 MUST 保持其原有属性值。

#### Scenario: 旧快照在链式写入后保持冻结

- **WHEN** 先持有当前状态树的引用，随后执行 `store.userInfo.name = 'b'`
- **THEN** 通过先前持有的引用读到的 `userInfo.name` 仍为写入前的值 `'a'`

#### Scenario: 旧根对象在链式写入后保持冻结

- **WHEN** 持有第一层属性对象的引用，随后对该属性下的嵌套字段执行写入
- **THEN** 先前持有的对象不出现新增、修改或删除的属性

### Requirement: 链式更新必须沿路径产生新引用

链式写入后，从根到被写字段的路径上每一层对象 MUST 具有与写入前不同的对象身份，使消费方能够通过引用比较感知变化。根状态对象 MUST 在每次实际发生变化的写入后具有新的对象身份。

#### Scenario: 路径上的每一层都获得新身份

- **WHEN** 对 `userInfo.nameInfo.value` 执行链式写入且新值与旧值不同
- **THEN** `userInfo`、`nameInfo` 与根状态对象三者都获得与写入前不同的对象身份

#### Scenario: 根状态对象身份在写入后变化

- **WHEN** 任意嵌套字段发生实际变化
- **THEN** 快照读取接口返回的根状态对象与写入前不是同一个对象

### Requirement: 链式更新必须保持路径外的结构共享

链式写入 MUST NOT 为写入路径之外的任何分支创建新对象，这些分支 MUST 继续与写入前的状态树共享同一对象引用，以维持引用相等性并避免无关重渲染。

#### Scenario: 兄弟分支保持同一引用

- **WHEN** 只修改 `userInfo.name`，状态树中还存在 `other` 分支
- **THEN** 写入后的 `other` 与写入前是同一个对象

#### Scenario: 同级兄弟字段的宿主对象被复制但内容不变

- **WHEN** 只修改 `userInfo.name`，而 `userInfo` 还存在 `address` 字段
- **THEN** 写入后的 `userInfo.address` 与写入前的 `userInfo.address` 是同一个对象

### Requirement: 订阅回调的前置状态必须是真实历史快照

传递给订阅回调的 `prevState` MUST 表示该批次第一批写入发生之前的状态，且 MUST NOT 被同批次或后续批次的写入改写。即使在同一同步执行块内连续多次写入，`prevState` 也必须保持为批次开始前的值。

#### Scenario: prevState 反映批次开始前的值

- **WHEN** 状态为 `{ userInfo: { name: 'a', age: 1 } }`，在同一同步块内依次写入 `name = 'b'` 与 `age = 20`，批次结束后读取回调收到的 `prevState`
- **THEN** `prevState.userInfo.name` 为 `'a'`，`prevState.userInfo.age` 为 `1`

#### Scenario: prevState 不被后续写入改写

- **WHEN** 一次批次完成后，通过先前收到的 `prevState` 引用再次读取其中的嵌套值
- **THEN** 读到的值仍为该批次开始前的值

### Requirement: 值未变化时不得产生新引用

当链式写入的值与当前值按 `Object.is` 判定相等时，系统 MUST NOT 修改状态树，也 MUST NOT 为该路径上的任何层产生新引用。

#### Scenario: 同值写入不改变引用

- **WHEN** 对某个嵌套字段写入与其当前值相同的值
- **THEN** 第一层属性对象、路径上的各层对象与根状态对象都保持原有身份

### Requirement: 链式写入仅对纯对象与数组生效

当 `immutable` 选项开启时，链式写入 MUST 只穿透纯对象与数组。其它数据类型 MUST 被视为不可穿透的叶节点：其整体可以被替换，但其内部字段的修改 MUST NOT 产生新的状态树引用。

#### Scenario: 路径穿过非纯对象时整体替换生效

- **WHEN** 状态中存在一个 `Date` 或类实例字段，并对其整体赋值一个新实例
- **THEN** 写入生效，且根状态对象与路径上的各层获得新引用

#### Scenario: 非纯对象内部字段的修改不产生新引用

- **WHEN** 对状态中某个 `Date` 字段调用其自身的变更方法（例如 `setFullYear`）
- **THEN** 状态树不产生新的引用，且该变更不被视为一次状态更新

#### Scenario: 非代理内建类型的就地修改对旧快照可见

- **WHEN** 状态中某个 `Date` 字段被读取后，对该字段或其属性执行写入
- **THEN** 该对象被就地修改，写入前持有的该对象引用也能观察到这一修改；系统 MUST NOT 为此产生新的状态树或触发状态更新

#### Scenario: 写入不可穿透路径时开发期必须报错

- **WHEN** 在开发环境对一个宿主不可穿透的路径执行写入（例如对类实例字段调用其变更方法）
- **THEN** 系统抛出包含该路径与宿主类型信息的错误，MUST NOT 静默丢弃该写入

#### Scenario: 生产环境下不可穿透路径的写入为无操作

- **WHEN** 在生产环境对一个宿主不可穿透的路径执行写入
- **THEN** 系统不产生新的状态树、不触发状态更新，也不抛出异常

#### Scenario: 数组元素可被链式写入穿透

- **WHEN** 对状态中的数组元素执行嵌套写入（例如 `store.list[1].id = 99`）
- **THEN** 写入生效，数组与根状态对象获得新引用，且未被修改的元素保持原有身份

### Requirement: 数组变异方法必须产生新数组且不改动旧快照

在 `immutable` 模式下，调用数组的变异方法（包括但不限于 `push`、`pop`、`shift`、`unshift`、`splice`、`sort`、`reverse`、`fill`、`copyWithin`）MUST 得到与原生数组一致的结果，MUST NOT 修改写入前的数组对象，且 MUST 使数组及其宿主对象获得新引用。系统 MUST NOT 通过枚举具体方法名来实现该行为。

#### Scenario: push 不修改旧快照

- **WHEN** 先持有数组引用，随后执行 `store.list.push(99)`
- **THEN** 通过先前持有的引用读到的数组仍为写入前的长度与内容，而新状态中的数组包含新元素

#### Scenario: pop 与 shift 不抛错且结果正确

- **WHEN** 对状态中的数组执行 `store.list.pop()` 或 `store.list.shift()`
- **THEN** 不抛出异常，新状态中的数组为移除首/尾元素后的结果，且旧数组未被修改

#### Scenario: sort 与 reverse 结果与原生一致

- **WHEN** 对状态中的数组执行 `store.list.sort(comparator)` 或 `store.list.reverse()`
- **THEN** 新状态中的数组顺序与对同内容原生数组执行同一操作的结果一致

#### Scenario: splice 与 fill 结果与原生一致

- **WHEN** 对状态中的数组执行 `store.list.splice(...)` 或 `store.list.fill(...)`
- **THEN** 新状态中的数组内容与对同内容原生数组执行同一操作的结果一致，且旧数组未被修改

#### Scenario: 直接写入 length 生效

- **WHEN** 对状态中的数组执行 `store.list.length = 2`
- **THEN** 新状态中的数组被截断为两个元素，旧数组未被修改

#### Scenario: 宿主对象被克隆

- **WHEN** 对嵌套路径下的数组执行变异（例如 `store.nested.arr.push(9)`）
- **THEN** 该数组的宿主对象与根状态对象都获得新引用，且路径外的分支保持原有引用

#### Scenario: 每次方法调用恰好产生一次状态提交

- **WHEN** 在同一个同步执行块内对同一数组连续调用多个变异方法
- **THEN** 每个方法调用各自产生一次提交，且不因某个方法内部的多次元素写入而产生中间状态提交

#### Scenario: 代码未列举的变异方法同样生效

- **WHEN** 运行时在数组原型上挂载一个新的变异方法（系统代码中不存在该方法名），并通过状态中的数组调用它
- **THEN** 该方法的变更生效并反映到新状态中

### Requirement: 数组只读方法不得触发状态更新

在 `immutable` 模式下，调用数组的只读方法（包括但不限于 `join`、`indexOf`、`slice`、`map`、`filter`、`concat`、`reduce`、`find`、`includes`）MUST 返回与原生数组一致的结果，且 MUST NOT 改变状态树、MUST NOT 使状态更新被触发。

#### Scenario: 只读方法不产生新引用

- **WHEN** 在 `immutable` 模式下连续调用 `store.list.slice(1)`、`store.list.map(fn)`、`store.list.join('-')`、`store.list.indexOf(x)`、`store.list.concat([y])`
- **THEN** 每个方法返回正确结果，根状态对象与数组均保持原有引用，且不产生待处理的更新

#### Scenario: 只读方法不受未提交变异影响

- **WHEN** 先对数组执行一个变异方法，随后在同一同步块内调用只读方法
- **THEN** 只读方法作用在其被调用时刻的状态上，返回结果与该时刻状态一致

### Requirement: 数组被整体替换后变异必须作用于新数组

当数组字段被整体赋值替换后，后续对其执行的变异 MUST 作用于替换后的数组，MUST NOT 基于替换前的旧数组内容继续修改。

#### Scenario: 整体替换后再变异

- **WHEN** 先执行 `store.list.push(3)`，随后执行 `store.list = [9, 9]`，再执行 `store.list.push(7)`
- **THEN** 新状态中的数组为 `[9, 9, 7]`

#### Scenario: 整体替换后只读读到新数组

- **WHEN** 执行整体替换后立即读取该数组
- **THEN** 读到的内容与替换后的数组一致，而非替换前的内容

### Requirement: 未开启 immutable 时保持就地写入语义

当 `immutable` 选项未开启时，系统 MUST 保持就地写入语义：嵌套赋值直接作用于当前状态对象，不产生新的状态树引用。链式写入的写时复制保证 MUST NOT 在该模式下生效。

#### Scenario: 默认模式下嵌套写入直接作用于原对象

- **WHEN** 未开启 `immutable`，先持有第一层属性对象的引用，随后对该属性下的嵌套字段赋值
- **THEN** 通过先前持有的引用读到的字段值为新值

#### Scenario: 默认模式下读取嵌套对象返回原始引用

- **WHEN** 未开启 `immutable`，连续两次读取同一嵌套路径
- **THEN** 两次读到的对象不是代理包装对象，对其赋值直接作用于状态对象
