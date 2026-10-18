# 不可变更新与链式写入

> 本文描述 `immutable: true` 模式下的写入语义。该选项**默认关闭**，需要显式开启，见 [options - immutable](./using-detail.md#options-immutable)。

## 一句话说明

开启 `immutable` 后，对状态树的任何写入都会**新建**从根到被写字段这条路径上的每一层对象，而不是就地修改原对象。因此**写入之前产生的状态树永远不会被改写**。

这也是链式更新（`store.userInfo.name = 'x'`）生效的前提。

## 链式写入

```ts
import { defineStore } from "resy";

const useStore = defineStore(
  {
    userInfo: {
      name: "Liu-Shan-Bao",
      address: { city: "bj" },
    },
    rename() {
      // 只需直接赋值，路径上的每一层都会自动换成新对象
      this.userInfo.name = "LSB";
    },
  },
  { immutable: true },
);
```

写入 `userInfo.name` 之后：

```
       写入前                          写入后
   根对象 root                     根对象 root'        <- 新
      |                                |
   userInfo                        userInfo'          <- 新
      |                                |
   name: 'Liu-Shan-Bao'            name: 'LSB'        <- 新值
   address: A                      address: A         <- 同一引用
```

- **路径上的每一层**（`userInfo`、根对象）都获得新引用；
- **路径之外的分支**（如 `address`、其他顶层字段）保持同一引用，因此不会引起无关重渲染；
- **写入前的整棵树完全冻结**，可以安全地作为历史快照保存。

## 旧快照不会被改写

```ts
const before = store.userInfo;      // 取一个引用

store.userInfo.name = "LSB";

before.name;                        // 仍是 'Liu-Shan-Bao'
store.userInfo.name;                // 'LSB'
```

这一点在需要状态历史、时间旅行调试或并发渲染时非常重要。同样的保证也适用于 `subscribe` 回调收到的 `prevState`：它表示**该批次开始之前**的状态，不会被后续写入改写。

`prevState`、`nextState`、`effectState` 在 TypeScript 中是**深度只读快照**，对嵌套对象、数组、`Map`/`Set` 的写入会编译报错；它们在运行时仍是原始引用，写入不会经过提交管线，因此需要修改时请使用 `store`、actions 或 `setState`。

`subscribe(..., immediate: true)` 的立即回调没有自己的批次：此时 `prevState` 与 `nextState` 是同一个当前状态对象，不会是 `undefined`，也不会是更早批次留下的值。由批次触发的回调仍使用该批次开始前的 `prevState`。

通过 `store.xxx` 读取同样可用于保存快照——读到的引用指向当时状态树中的那个对象，路径被后续写入替换后，这个引用仍保持原值：

```ts
const before = store.userInfo;   // 指向当时状态树中的 userInfo
store.userInfo.name = "LSB";
before.name;                     // 仍是 'Liu-Shan-Bao'
store.userInfo.name;             // 'LSB'
```

## 嵌套对象可用于依赖数组

开启 `immutable` 后，**同一路径在目标对象未变化时返回同一个对象**，因此嵌套对象可以安全地放进依赖数组：

```tsx
const App = () => {
  const { userInfo, rename, moveCity } = useStore();
  const { address } = userInfo;

  useEffect(() => {
    // 只有 address 自身变化时才执行
    console.log("address changed", address);
  }, [address]);

  return (
    <>
      <button onClick={rename}>rename</button>
      <button onClick={moveCity}>moveCity</button>
    </>
  );
};
```

- 点击 `rename`（只改 `userInfo.name`）→ `address` 保持同一引用 → **副作用不重跑**；
- 点击 `moveCity`（改 `address.city`）→ `address` 获得新引用 → **副作用执行一次**。

> ⚠️ 未开启 `immutable` 时该结论不成立：`userInfo` 返回的是原始对象，每次读取都是同一引用，但状态变化也不会触发更新。

## 句柄是路径视图，不是元素本身

`store.userInfo` 读到的对象是一个**路径句柄**：它记住自己来自哪条路径，读取取的是**创建时的快照**，写入则通过路径提交到当前状态。

- 需要当前值时，重新从 `store` 读取该路径；已持有的句柄不会跟着后续提交更新。
- 句柄可以暂存并连续写入，解构后连续赋值是安全的：

```ts
const { userInfo } = store;

userInfo.name = "a";
userInfo.address.city = "sh";   // 子写入会克隆 userInfo，句柄仍可继续写
userInfo.name = "b";
```

- 不要把一个句柄当成元素本身来修改；真正"属于元素自己"的对象是原始对象（见下一节）。
- 读取是快照，所以 `userInfo.count += 1` 在同一句柄上连续执行两次，会两次都基于同一个旧值计算。需要基于最新值累加时，重新从 `store` 读取，或改用 `setState`。

## 游离元素

元素被移出状态树后（对象 `delete`、数组 `shift`/`splice`/`pop`/整体替换、`Map.delete`、`Set.delete`），之前取得的句柄就**游离**了：

- **写入被忽略**：不产生新状态、不记录变化键、不触发订阅与重渲染，也不抛错（开发环境对每条路径输出一次告警）；
- **读取仍返回创建时的快照**；
- **元素自身的变化由原始对象承担**：`shift()`/`splice()` 的返回值，或 `rawState` 里的对象。它不被 store 管理，修改它不会触发更新。

```ts
const handle = store.list[0];        // 句柄
const removed = store.list.shift();  // removed 是原始对象

handle.id = 99;                      // 游离写：被忽略，状态不变
removed.id = 99;                     // 原始对象自身变化：不影响 store
```

判定按**位置**进行：元素移位后即使对象仍在树里（例如被 `push` 到另一个下标），旧句柄也视为游离，不会按对象身份重新定位。需要继续操作它时，从 `store` 重新读取路径。

## 数组

数组的变异方法整体可用，每次调用作用于**副本**后提交一次，旧数组不受影响：

```ts
const store = createStore({ tags: ["a"] }, { immutable: true });

const before = store.tags;
store.tags.push("b");

before;            // ['a']        <- 旧数组未被修改
store.tags;        // ['a', 'b']
```

支持的方法包括 `push`、`pop`、`shift`、`unshift`、`splice`、`sort`、`reverse`、`fill`、`copyWithin`，以及直接写 `length`。

**不需要记住具体名单**：实现并不枚举方法名，而是对数组上的任意函数调用统一走「作用于副本后提交」这一条路径，因此未来 ECMAScript 新增的变异方法会自动适用。

**只读方法不触发更新**，返回值与原生一致：

```ts
store.tags.slice(0, 1);        // ['a']，不产生状态更新
store.tags.map(t => t + "!");  // ['a!','b!']，不产生状态更新
store.tags.join(",");          // 'a,b'
```

> ⚠️ `slice` / `filter` / `concat` 返回的数组里是**原始元素引用**，直接修改它们会绕过 store（不换根、不触发渲染）。需要写入时，请通过状态路径操作。`map(x => x)` 是例外：回调参数是句柄，返回值也是句柄。

## 不可穿透的叶节点

只有**纯对象与数组**会被写入穿透。以下类型被视为**叶节点**，只能整体替换，不能写入其内部字段：

| 类型 | 读取行为 | 写入内部字段 | 整体替换 |
| --- | --- | --- | --- |
| 纯对象、数组 | 返回代理 | ✅ 写时复制生效 | ✅ |
| `Date`、`RegExp` 等内建 | 返回**原始对象** | ⚠️ 会就地修改，且不触发更新 | ✅ |
| 类实例 | 返回代理 | ❌ 开发环境抛错，生产环境忽略 | ✅ |
| `Map`、`Set` | 返回 `ResyMap` / `ResySet` 句柄 | ✅ 通过 `set`/`add`/`delete`/`clear` 生效 | ✅ |

`Map` / `Set` 的成员读写走句柄自己的方法，一次方法调用提交一次；成员对象可以继续链式写入。非成员属性（例如 `store.m.foo = 1`）落在句柄实例上，不进入状态，也不会报错——成员写入只认容器方法。

冻结或不可扩展的对象/数组（`Object.freeze` / `Object.seal` / `Object.preventExtensions`）按**叶节点**处理：读取直接返回原始对象（不包代理），写入遵循原生冻结/密封语义。这类分支已经不可扩展，resy 不再为它提供链式更新。

**示例：**

```ts
// ✅ 整体替换：正常生效，路径上的引用都会更新
store.when = new Date();

// ⚠️ 调用 Date 自身的方法：不触发更新，且会改写那个对象（旧快照也会看到）
store.when.setFullYear(2025);

// ❌ 类实例的内部字段：开发环境会抛出带路径信息的错误，避免被无声丢弃
store.box.bump();

// ⚠️ 类实例读取时仍会被包成代理：依赖私有字段（#x）的方法会抛
// "Cannot read private member ..."，请把实例当作原子值整体替换。

// ✅ Map 成员：通过容器方法写入
store.m.set("k", { value: 1 });
store.m.get("k").value = 2;
```

## 未开启 immutable 时的行为

`immutable` 默认关闭。关闭时：

- `store.userInfo` 返回**原始对象**，对其属性的赋值不经过代理，因此**不会触发重渲染**；
- 数组没有代理包装，变异方法按原生语义就地生效。

如果需要链式更新与状态快照保证，请显式开启：

```ts
defineStore(model, { immutable: true });
```

## 另见

- [options - immutable](./using-detail.md#options-immutable)
- [defineStore](./defineStore.md)
- [createStore](./createStore.md)
