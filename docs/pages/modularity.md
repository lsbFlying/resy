# 模块化
模块化可以根据封闭程度和状态操作的自由度分为 `强封闭模块化` 和 `弱封闭模块化`。

## 模块化的对象
通常而言，状态容器针对的模块化对象是以 `路由为单位的模块化组件页面`；
如果你的编码对象不是以 `路由为单位` 而是 `路由大模块` 之内的 `某一复杂的大组件模块` 为单位；
那么我们建议你使用 `useConciseState` 来进行状态管理。

## 强封闭模块化

### 定义
模块内部的状态和逻辑被严格封闭，外部无法直接操作其内部状态，只能通过预定义的接口（如 `Actions` 或 `useStore()`）来更新和访问。模块本身完全隐藏了具体的数据操作细节。

### 特点
- 模块的内部状态和逻辑不可直接访问或修改，操作必须经过预定义的规范接口。
- 封装性强，可维护性高，适用于需要严格控制状态更新流程和追踪变化来源的场景。
- 外部调用者只能通过明确的 API（如 `increase()`, `useStore() `）操作模块，无法直接操作状态变量。

### 适用场景
- 大型模块应用中，需要严格规范状态更新流程以及追踪来源（比如确保日志记录或一致性）。
- 状态的变化可能包含复杂的业务逻辑，防止开发者直接修改状态导致不可控行为。

### 示例：defineStore 的强封闭模块化
在强封闭设计中，模块不允许直接操作状态，只能通过定义的 `increase()` 方法修改 `count` 值：

```tsx
import React from "react";
import { defineStore } from "resy";

const useStore = defineStore({
   count: 0,
   increase() {
      this.count++;  // 状态更新逻辑集中于方法定义中
   },
});

function App() {
  // 使用时通过 `increase()` 接口更新状态
  const { count, increase } = useStore();
  console.log(count); // 访问count值
  return (
    <div>
      <div>count: {count}</div>
      <button
        // 封装性操作
        onClick={increase}
      >
        increase
      </button>
    </div>
  );
}
```

## 弱封闭模块化

### 定义
模块内部的状态和逻辑是部分封闭的，外部既可以通过接口操作，也可以直接访问和修改状态变量。模块对状态操作自由度较高，封装程度较弱。

### 特点
- 状态和逻辑可以通过接口操作，也支持直接访问或修改内部变量。
- 适合开发者需要更多控制权的场景，例如快速迭代或调试过程中直接操作状态。
- 封闭性较弱，但灵活性更高，适用于简单业务或状态变化频繁、无需严格追踪的场景。

### 适用场景
- 开发过程中需要高度灵活的状态操作，快速调试或临时实验。
- 状态逻辑较简单，不需要过多的约束和封装来维护。

### 示例：createStore 的弱封闭模块化
在弱封闭设计中，可以直接对 `store.count` 进行更新，而不仅仅依赖 `increase()` 方法：

```tsx
import React from "react";
import { createStore } from "resy";

const store = createStore({
  count: 0,
  increase() {
    this.count++;  // 提供方法更新状态
  },
});

function App() {
  // 使用时既可以通过接口，也可以直接修改状态
  const { count, increase } = store.useStore();
  console.log(count); // 访问count值
  return (
    <div>
      <div>count: {count}</div>
      <button
        // 封装性操作
        // onClick={increase}
        // 自由修改状态（弱封闭）
        onClick={() => store.count++}
      >
        increase
      </button>
    </div>
  );
}
```

### 示例：defineStore 的弱封闭模块化
在 `defineStore` 的弱封闭设计中，也可以通过解构出 `store` 对象进行更新，而不仅仅依赖 `increase()` 方法：

```tsx
import React from "react";
import { defineStore } from "resy";

const useStore = defineStore({
   count: 0,
   increase() {
      this.count++;  // 状态更新逻辑集中于方法定义中
   },
});

function App() {
  // 组件内解构 store
  const { count, increase, store } = useStore();
  console.log(count); // 访问count值
  return (
    <div>
      <div>count: {count}</div>
      <button
        // 封装性操作
        // onClick={increase}
        // 自由修改状态（弱封闭）
        onClick={() => store.count++}
      >
        increase
      </button>
    </div>
  );
}
```

**defineStore 弱封闭模块化的相对性：**
- 我们可以明显看出 `defineStore` 的弱封闭模块化设计是相对安全的，因为解构store对象的步骤仍然是在组件之内， 一定程度上使得状态的可追溯性得以缓解。
- 而 `createStore` 创建的 `store` 甚至可以在任何地方进行更新，缺乏一定程度上的状态可追踪性的安全问题。
- 但同时 `defineStore` 也提供了类似 `createStore` 那样的灵活性，属于较为均衡的使用设计模式。

## 核心区别对比

| **维度**             | **强封闭模块化**             | **弱封闭模块化**            |
|------------------------|----------------------------|---------------------------|
| **状态修改**           | 状态只能通过预定义的接口操作             | 状态既可以通过接口操作，也可以直接修改内部状态变量 |
| **封装性**            | 封装程度高，数据完全隐藏于模块内部，外部无法直接访问 | 封装程度较弱，状态和逻辑对外透明，允许直接操作   |
| **操作自由度**          | 操作受限制（仅能通过接口逻辑），自由度低       | 操作较自由，可以直接访问或修改状态变量       |
| **适用场景**           | 大型、复杂应用或需要严格控制状态更新的场景      | 小型、简单应用或调试开发中需要灵活操作的场景    |

## 实际应用建议

1. **选择强封闭模块化：**
    - 当状态逻辑复杂且对一致性要求较高时，优先使用强封闭模块化。
    - 确保状态更新只能通过预定义接口，便于追踪状态变化来源和维护业务逻辑。

2. **选择弱封闭模块化：**
    - 当状态逻辑较简单且需要灵活操作时，可以选择弱封闭模块化。
    - 开发过程中快速调试或迭代时可以弱封闭，但建议在正式代码中切换为强封闭设计。

根据需求和场景，可以灵活选择两种封闭类型，某些场景下甚至可以混合使用，比如在状态初始化时允许弱封闭（便于测试），正式发布时切换为强封闭（便于维护）。
