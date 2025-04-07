# 类型设计

## 完善的 TypeScript 类型推断
- 状态的类型会根据 `initialState` 自动推断，无论是直接传递对象还是返回函数，`resy` 都能提供智能的 TS 类型推断。
- 状态属性可以通过 `泛型` 增强类型推断，避免潜在错误。
- 还对状态属性命名进行了一定的约束（防止定义非法或冲突的属性名），进一步强化了开发体验和规范性。

## 类型推断
```tsx
import { createStore, defineStore } from "resy";
const store = createStore({ count: 0 });

store.count += 1; // 自动推断 `count` 为 number 类型
store.count = "value"; // 报错：Type 'string' is not assignable to 'number'

const useStore = defineStore({
  count: 0,
  change() {
    this.count += 1; // 自动推断 `count` 为 number 类型
    this.count = "value"; // 报错：Type 'string' is not assignable to 'number'
  },
});
```

## 泛型强化类型提示
```tsx
import { createStore, defineStore } from "resy";

type Model = {
  count: number;
  text?: number | string;
};

const store = createStore<Model>({ count: 0, text: "hello" });

store.count += 1; // 自动推断 `count` 为 number 类型
store.count = "value"; // 报错：Type 'string' is not assignable to 'number'

// 允许undefined进行赋值
store.text = undefined;
// 允许number进行赋值
store.text = 666;
// 允许string进行赋值
store.text = "world";

const useStore = defineStore({
  count: 0,
  change() {
    this.count += 1; // 自动推断 `count` 为 number 类型
    this.count = "value"; // 报错：Type 'string' is not assignable to 'number'

    // 允许undefined进行赋值
    this.text = undefined;
    // 允许number进行赋值
    this.text = 666;
    // 允许string进行赋值
    this.text = "world";
  },
});
```

## 属性命名约束
```tsx
import { createStore, defineStore } from "resy";

// store是属于 `resy` 内部禁止重命名的属性名称之一
const store = createStore({
  store: "",  // Type string is not assignable to type never
});

const useStore = defineStore({
  store: "",  // Type string is not assignable to type never
});
```
**类似的禁用属性名称还有：`setState`、`syncState`、`restore`、`subscribe`、`useStore`、`useSubscription`、`getOptions`、`setOptions`**
