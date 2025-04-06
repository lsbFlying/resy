# 快速开始

## 安装
::: code-group
```sh [pnpm]
$ pnpm add resy
```

```sh [yarn]
$ yarn add resy
```

```sh [npm]
$ npm add resy
```

```sh [bun]
$ bun add resy
```
:::

## 使用
### 定义一个 宏store
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
### 使用 宏store
```tsx
import React from "react";

const App = () => {
  const { count, increase } = useStore();

  return (
    <>
      <p>count:{count}</p>
      <button onClick={increase}>increase</button>
    </>
  );
};
```
