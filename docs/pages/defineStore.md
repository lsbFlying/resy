# defineStore <Badge type="tip" text="^11.1.0" />
`defineStore` 是建立在 `createStore` 的底层调用之上的处理方法，返回的是一个简化使用的 **宏处理 hook 函数**。

## 简单的 Hooks 风格
- `defineStore` 的使用方式类似 React 的 Hooks，你通过调用 `useStore()` 即可直接获取响应式的状态以及状态更新方法。
- 开发者不需要记忆额外的 API，也无需显式引用或传递 `store` 对象，直接使用即可。

**示例：**
```tsx
import React from "react";
import { defineStore } from "resy";

const useStore = defineStore({
  count: 0,
  increase() {
    this.count++;
  },
});

function App() {
  const { count, increase } = useStore();
  return (
    <div>
      <div>counter: {count}</div>
      <button
        // 更新视图
        onClick={increase}
      >
        增加
      </button>
    </div>
  );
}
```

## 支持灵活更新
- 除了通过封装的 Actions 操作状态，`defineStore` 也允许直接通过 `useStore()` 解构出 `store` 对象操作状态。这使得它在需要高灵活性时同样非常好用。
    - **深度可追踪时**：通过封装的 Actions 中维护更复杂的逻辑。
    - **快速原子操作时**：直接使用 `store.count++` 来更新内部状态。

**示例：**
```tsx
import React from "react";
import { defineStore } from "resy";

const useStore = defineStore({
  count: 0,
  increase() {
    this.count++;
  },
});

function App() {
  const { count, increase, store } = useStore();
  return (
    <div>
      <div>counter: {count}</div>
      <button
        // 封装更新，具备业务逻辑追踪能力
        // onClick={increase}
        // 灵活直接更新状态，立即响应视图
        onClick={() => store.count++}
      >
        增加
      </button>
    </div>
  );
}
```
**注：解构出来的 `store` 对象本质上就是 `createStore` 创建出来的对象。**

## 易于模块化组织
- 每个 `defineStore` 实例对应独立的 `useStore` 函数，直接调用即可完成模块化开发，既支持单一状态模块使用，也可以通过多个 `defineStore` 实现多模块化组织。

**示例：**

```tsx
import React from "react";
import { defineStore } from "resy";

const useUserStore = defineStore({ username: "Alice" });
const useCartStore = defineStore({ items: [] });

function App() {
  const { username } = useUserStore();
  const { items } = useCartStore();
  return (
    <div>
      name:{username}
      items:{items}
    </div>
  );
}
```
