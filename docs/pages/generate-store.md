# 状态容器
通过模块化设计，将应用的状态管理划分为多个独立的模块或“状态容器”，每个模块负责自身的状态及其操作逻辑；
而每一个划分的模块对应的状态容器我们称之为**store**。

## 生成store的方式
- `defineStore`: 定义一个 **宏store**。
- `createStore`: 创建一个 **常规store**。

### 使用 `defineStore` (推荐)
#### 定义一个 宏store
```tsx
import { defineStore } from "resy";

type Model = {
  count: number;
  increase(): void;
};

const useStore = defineStore<Model>({
  count: 0,
  increase() {
    this.count++;
  },
});
```
#### 使用 宏store
```tsx
import React from "react";

const App = () => {
  const { count, increase, store } = useStore();

  return (
    <>
      <p>count:{count}</p>
      <button onClick={increase}>increase</button>
      <button
        onClick={() => {
          store.count++;
        }}
      >
        increase-free
      </button>
    </>
  );
};
```

### 使用 `createStore`
#### 创建一个 常规store
```tsx
import { createStore } from "resy";

type Model = {
  count: number;
  increase(): void;
};

const store = createStore<Model>({
  count: 0,
  increase() {
    this.count++;
  },
});
```

#### 使用 常规store
```tsx
import React from "react";
import { useStore } from "resy";

const App = () => {
  const { count, increase } = useStore(store);
  // or
  // const { count, increase } = store.useStore();

  return (
    <>
      <p>count:{count}</p>
      <button onClick={increase}>increase</button>
      <button
        onClick={() => {
          store.count++;
        }}
      >
        increase-free
      </button>
    </>
  );
};
```
