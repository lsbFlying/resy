# 使用细节
`defineStore` 与 `createStore` API的参数和配置完全一致。所以下面的举例两者完全一致，统一适用。
他们均有两个核心参数 `initialState` 与 `options`，下面我们以 `defineStore` 为例进行详细介绍：

# `initialState` 初始化状态参数
非必填参数：默认使用空对象填补
- `initialState` 不是必填项。如果省略此参数，`resy` 会自动使用一个空对象来填充状态初始化。这种设计减少了开发者初始化状态的步骤，适用于简单的场景。
- 开发者可以在需要时直接添加属性和方法，无需额外预定义整个状态结构。

## `initialState` - 对象类型

**示例：**
```tsx
import React from "react";
import { defineStore } from "resy";

type Model = {
  count: number;
  text: string;
};

const useStore = defineStore<Model>({
  count: 0,
  text: "hello",
});

function App() {
  const { count, text } = useStore();
  return (
    <div>
      <div>count: {count}</div>
      <div>text: {text}</div>
    </div>
  );
}
```

**非必填：**
```tsx
import React from "react";
import { defineStore } from "resy";

type Model = {
  count?: number;
  text?: string;
};

// 场景较少，当所有状态属性都是非必需的场景下可以直接不写初始化状态对象参数
const useStore = defineStore<Model>();

function App() {
  const { count, text } = useStore();
  return (
    <div>
      <div>count: {count ?? "none"}</div>
      <div>text: {text ?? "hello world"}</div>
    </div>
  );
}
```

## `initialState` - 函数类型
支持函数形式返回对象：动态状态初始化
- `initialState` 支持传入一个函数（返回对象），以便动态生成状态。这种设计对**动态属性的场景（如与时间相关的状态）或路由切换需要特殊逻辑执行来得到一份新的初始化状态**非常有用。
- 开发者可以通过这种方式确保每次实例化时状态属性会更新，解决状态与外部运行时环境（如时间、路由）的同步问题。

**示例：动态状态初始化**

```tsx
import React from "react";
import { defineStore } from "resy";

// 会随着 App 模块的 重载 而重新执行 `initialState` 初始化状态函数 返回当前最新时间
const useStore = defineStore(() => ({
  timestamp: Date.now(),
}));

function App() {
  const { timestamp } = useStore();
  return (
    <div>time: {timestamp}</div>
  );
}
```

# 配置项参数 `options`
非必填参数
- `options` 不是必填项。如果省略此参数，`resy` 会自动处理每一个配置项的默认值场景。
- 一般情况下不需要额外配置特殊的 `options` 参数项，`resy` 内部的默认配置项会覆盖大部分使用场景。

## options - `unmountRestore`
- **描述：**
  控制是否在页面所有模块卸载时，自动将数据恢复到其初始状态。  
  当需要对全局数据（如登录信息、主题设置等）保持跨路由的全局效应时，应设置为 `false`，避免相关数据被重置，例如 `loginStore` 或 `themeStore`。
- **默认值：** `true`
- **适用场景：** 主要用于区分全局共享数据与页面模块级数据，在某些场景下需要确保模块卸载后数据一致性。通过 unmountRestore 控制模块卸载后的数据行为，适配全局数据与局部模块数据的差异需求。

**示例：**

```tsx
import { defineStore } from "resy";

const useLoginStore = defineStore({
  userInfo: {
    username: "",
    userId: 0,
  },
}, {
  // 用户登录信息可能在全局生效，不依赖于路由的切换而产生变化，所以它的卸载重置设置项应该是false
  unmountRestore: false,
});

const useThemeStore = defineStore({
  themeStyle: {
    size: "middle",
    style: "light",
  },
}, {
  // 同样主题风格信息也是在全局生效，不依赖于路由的切换而产生变化，所以它的卸载重置设置项应该是false
  unmountRestore: false,
});

const useCounterStore = defineStore({
  count: 0,
}, {
  /**
   * @description 然而常规的以路由模块为单位的模块化store，
   * 它就是为路由模块化而生的状态容器，
   * 所以它理应依赖于路由的切换而产生变化，
   * 所以它的卸载重置设置项应该是true，
   * 而 `unmountRestore` 配置项的默认值就是true
   */
  unmountRestore: true,
});
```

## options - `namespace` <Badge type="tip" text="^11.0.3" />
- **描述：**
  为存储定义一个抽象名称或命名空间，当在复杂模块中存在**不同存储的同名属性**（如同键值冲突）时，
  这一特性可以通过区分存储命名空间来标识特定存储。命名空间的存在便于开发者在调试时**快速定位组件元素及其状态数据**。
- **默认值：** `undefined`
- **适用场景：** 适用于模块化存储复杂度高的场景，帮助识别和隔离存储逻辑。通过 namespace 为存储提供抽象标识，便于在复杂模块中隔离存储冲突并优化调试体验。

**示例：**
```tsx
import React from "react";
import { defineStore } from "resy";

const useCounter1Store = defineStore({
  count: 0,
  increase() {
    this.count++;
  },
}, {
  namespace: "counter1",
});

const useCounter2Store = defineStore({
  count: 0,
  increase() {
    this.count++;
  },
}, {
  namespace: "counter2",
});

function App() {
  const { count: count1, increase: increase1 } = useCounter1Store();
  const { count: count2, increase: increase2 } = useCounter2Store();
  return (
    <div>
      <div>
        <div>count1: {count1}</div>
        <button onClick={increase1}>count1-add</button>
      </div>
      <div>
        <div>count2: {count2}</div>
        <button onClick={increase2}>count2-add</button>
      </div>
    </div>
  );
}
```

---

![An image](/dev-tools-app.png)

![An image](/dev-tools.png)

## options - `immutable` <Badge type="tip" text="^11.2.0" />
- **描述：**
  启用不可变状态生成机制，通过简单修改当前状态树，自动创建下一状态树，从而保持数据结构的不可变性。  
  这种不可变性可以提升状态更新的安全性及性能优化（例如快速比较状态变化）。
- **默认值：** `undefined`
- **适用场景：** 适合对状态一致性要求较高的场景，尤其是需要确保状态历史记录或避免直接数据突变时。启用 immutable 属性可以生成新的状态树，增强状态变更的安全性和性能。

## options - `enableMarcoActionStateful` <Badge type="tip" text="^11.1.0" />
- **描述：**
  针对 `defineStore` 的配置项，允许函数属性作为状态进行更新处理。这一功能较少使用，旨在保证框架的开放性和灵活性，为开发者提供额外的业务操作支持。
- **默认值：** `undefined`
- **适用场景：** 仅在特殊场景下使用，能够扩展框架功能以应对复杂需求。开放状态操作的扩展性，通过 enableMarcoActionStateful 支持 函数属性状态 更新与渲染，保持一定的灵活性。
- **注意：**
  在 <Badge type="tip" text="^11.1.0" /> 版本之前，`actions` 函数属性也是与 `state` 一样具备可更新效应；
  之后就将 `actions` 单纯作为逻辑操作函数处理，不具备更新效应，但是仍然可以通过 `enableMarcoActionStateful` 配置项进行设置，让其具备渲染更新效应。

**示例：**

```tsx
import React from "react";
import { defineStore } from "resy";

type Model = {
  count: number;
  increase?(): void;
  createIncrease(): void;
};

const useStore = defineStore<Model>({
  count: 0,
  createIncrease() {
    this.increase = () => {
      this.count++;
    }
  },
}, {
  enableMarcoActionStateful: true,
});

function App() {
  const { count, createIncrease, increase } = useStore();
  console.log("renderApp");
  return (
    <div>
      <div>count: {count}</div>
      <button
        // 更新 increase 的时候也会产生 re-render App 组件的效果，点击后会打印 renderApp
        onClick={createIncrease}
      >
        create-increase-action
      </button>
      <button
        // 只有在先点击了 create-increase-action 按钮之后再点击 increase 按钮，才会打印 renderApp
        onClick={increase}
      >
        increase
      </button>
    </div>
  );
}
```
