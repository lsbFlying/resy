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

## 不可穿透的叶节点

只有**纯对象与数组**会被写入穿透。以下类型被视为**叶节点**，只能整体替换，不能写入其内部字段：

| 类型 | 读取行为 | 写入内部字段 | 整体替换 |
| --- | --- | --- | --- |
| 纯对象、数组 | 返回代理 | ✅ 写时复制生效 | ✅ |
| `Date`、`RegExp` 等内建 | 返回**原始对象** | ⚠️ 会就地修改，且不触发更新 | ✅ |
| 类实例、`Map`、`Set` | 返回代理 | ❌ 开发环境抛错，生产环境忽略 | ✅ |

**示例：**

```ts
// ✅ 整体替换：正常生效，路径上的引用都会更新
store.when = new Date();

// ⚠️ 调用 Date 自身的方法：不触发更新，且会改写那个对象（旧快照也会看到）
store.when.setFullYear(2025);

// ❌ 类实例的内部字段：开发环境会抛出带路径信息的错误，避免被无声丢弃
store.box.bump();
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
