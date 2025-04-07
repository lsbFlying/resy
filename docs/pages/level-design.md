# 层次设计

## 统一扁平化
统一扁平化的状态设计：`state`、`Actions` 和 `计算属性（Getters）` 在同一层级，
直接将状态（`state`）、操作方法（`Actions`）以及计算属性（`Getters`）统一在同一层级，
避免进行了分层的传统方案带来的复杂性。
这样做的优势：

- **贴合 JavaScript 的直觉化编程习惯**：  
开发者可以在同一对象中定义和操作状态、方法和计算属性，而无需担心上下文对象不同导致的错误或混乱。
- **适配函数性质的状态更新场景：**  
函数式状态变化需要灵活的上下文引用，而统一层级可以方便开发者直接通过 `this` 操作状态属性。

## 分层设计的局限
分层设计（例如 `state`、`getters`、`actions` 模型）虽然结构清晰，但会带来以下问题：
- **`this` 上下文的困惑：**  
  在分层设计中，`this` 的指向不同，需要记住 `actions`、`getters` 等层级的上下文（通常 `this.state` 或绑定某一上下文）：
```tsx
// 假如采用分层设计则如下：
const store = defineStore({
  state: {
    count: 0,
  },
  getters: {
    doubleCount() {
      return this.count * 2; // 错误，这里的 this 指向 `getters`，无法直接访问 `state`
    },
  },
  actions: {
    increase() {
      this.count++; // 错误，这里的 this 指向 `actions`，无法直接访问 `state`
    },
  },
});
```
- **实现复杂度的提升：**  
  分层后的模型需要额外的绑定逻辑来处理 `state` 和其他层级间的关联，增加了开发和维护的成本。

## 直接设计的优势
直接设计避免了这些问题，所有 `Actions`、`Getters` 和 `State` 统一
放置于 `defineStore`、`createStore` 首要参数 `initialState` 的同一层级，简化了操作逻辑：
```tsx
import React from "react";

const useStore = defineStore({
  count: 0, // 状态属性
  doubleCount() {
    return this.count * 2; // `this` 指向整个状态对象
  },
  increase() {
    this.count++; // 同样的 `this` 直接访问状态
  },
  change() {
    this.increase();  // 并且可以访问状态对象内部的Actions
    this.count += 9;
  },
});

function App() {
  const { count, doubleCount, increase, change } = useStore();
  return (
    <div>
      <div>count: {count}</div>
      <div>doubleCount: {doubleCount()}</div>
      <button onClick={increase}>
        increase
      </button>
      <button onClick={change}>
        change
      </button>
    </div>
  );
}
```
