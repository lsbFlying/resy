# 设计特点 与 使用细节
`defineStore` 与 `createStore` API的参数和配置完全一致。所以下面的举例两者完全一致，统一适用。

## 初始化状态参数 `initialState`

1. **非必填参数：默认使用空对象填补**
- `initialState` 不是必填项。如果省略此参数，`resy` 会自动使用一个空对象来填充状态初始化。这种设计减少了开发者初始化状态的步骤，适用于简单的场景。
- 开发者可以在需要时直接添加属性和方法，无需额外预定义整个状态结构。

**示例：**
```tsx
type Model = {
  count?: number;
  text?: string;
};
// 场景较少，当所有状态属性都是非必需的场景下可以直接不写初始化状态对象参数
const store = createStore<Model>();            
console.log(store.count); // 默认输出：undefined
console.log(store.text); // 默认输出：undefined
```

2. **支持函数形式返回对象：动态状态初始化**
- `initialState` 支持传入一个函数（返回对象），以便动态生成状态。这种设计对**动态属性的场景（如与时间相关的状态）或路由切换需要重新初始化的状态**非常有用。
- 开发者可以通过这种方式确保每次实例化时状态属性会更新，解决状态与外部运行时环境（如时间、路由）的同步问题。

**示例：动态状态初始化**
```tsx
const store = createStore(() => ({
 timestamp: Date.now(), // 每次实例化都会返回当前时间
}));

console.log(store.timestamp); // 输出：当前时间戳
```

## `类型设计` 特点
**完善的 TypeScript 类型推断**
- 状态的类型会根据 `initialState` 自动推断，无论是直接传递对象还是返回函数，`resy` 都能提供智能的 TS 类型推断。
- 状态属性可以通过 `泛型` 增强类型推断，避免潜在错误。
- 还对状态属性命名进行了一定的约束（防止定义非法或冲突的属性名），进一步强化了开发体验和规范性。

**示例：类型推断的应用**
```tsx
const store = createStore({ count: 0 });

store.count += 1; // 自动推断 `count` 为 number 类型
store.count = "value"; // 报错：Type 'string' is not assignable to 'number'
```

**示例：通过泛型强化类型提示**
```tsx
type Model = {
  count: number;
  text?: number | string;
};
const store = createStore({ count: 0, text: "hello" });

store.count += 1; // 自动推断 `count` 为 number 类型
store.count = "value"; // 报错：Type 'string' is not assignable to 'number'

// 允许undefined进行赋值
store.text = undefined;
// 允许number进行赋值
store.text = 666;
// 允许string进行赋值
store.text = "world";
```

**示例：属性命名约束**
```tsx
// store是属于 `resy` 内部禁止重命名的属性名称之一
const store = createStore({
  store: "",  // Type string is not assignable to type never
});
```
**类似的禁用属性名称还有：`setState`、`syncState`、`restore`、`subscribe`、`useStore`、`useSubscription`、`getOptions`、`setOptions`**

## `层次设计` 特点
### 统一的状态设计：`state`、`Actions` 和 `计算属性（Getters）` 在同一层级
- `initialState` 的设计直接将状态（`state`）、动作方法（`Actions`）以及计算属性（`Getters`）统一在同一层级，避免进行了分层的传统方案带来的复杂性。
- 这样做的优势：
    1. **贴合 JavaScript 的直觉化编程习惯**：  
       开发者可以在同一对象中定义和操作状态、方法和计算属性，而无需担心上下文对象不同导致的错误或混乱。
    2. **适配函数性质的状态更新场景：**  
       函数式状态变化需要灵活的上下文引用，而统一层级可以方便开发者直接通过 `this` 操作状态属性。

---

### 对比分层设计的局限性：直接设计的优点
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

而直接设计避免了这些问题，所有 `Actions`、`Getters` 和 `State` 统一放置于 `initialState` 层级，简化了操作逻辑：

**示例：直接设计的优势**
```tsx
const store = defineStore({
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

store.increase();
console.log(store.doubleCount()); // 输出：2
store.change();
```

## 配置项参数 `options`
1. **非必填参数**
- `options` 不是必填项。如果省略此参数，`resy` 会自动处理每一个配置项的默认值场景。
- 一般情况下不需要额外配置特殊的 `options` 参数项，`resy` 内部的默认配置项会覆盖大部分使用场景。

2. **配置项**
- unmountRestore: **针对整个store而言的模块化卸载重置**。
- namespace: **针对react-devtool的调试命名空间**。
- immutable: **数据不可变性**。
- enableMarcoActionStateful: **函数类型属性的状态化开启**。

### **`options` 的类型特点**

1. **是否在卸载时恢复初始状态 `unmountRestore`**
- **描述：**  
  控制是否在页面所有模块卸载时，自动将数据恢复到其初始状态。  
  当需要对全局数据（如登录信息、主题设置等）保持跨路由的全局效应时，应设置为 `false`，避免相关数据被重置，例如 `loginStore` 或 `themeStore`。
- **默认值：** `true`
- **适用场景：** 主要用于区分全局共享数据与页面模块级数据，在某些场景下需要确保模块卸载后数据一致性。
**示例：**

```tsx
import { createStore } from "resy";

const loginStore = createStore({
  userInfo: {
    username: "",
    userId: 0,
  },
}, {
  // 用户登录信息可能在全局生效，不依赖于路由的切换而产生变化，所以它的卸载重置设置项应该是false
  unmountRestore: false,
});

const themeStore = createStore({
  themeStyle: {
    size: "middle",
    style: "light",
  },
}, {
  // 同样主题风格信息也是在全局生效，不依赖于路由的切换而产生变化，所以它的卸载重置设置项应该是false
  unmountRestore: false,
});

const counterStore = createStore({
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

---

2. **调试的命名空间 `namespace`**
- **描述：**
  为存储定义一个抽象名称或命名空间，当在复杂模块中存在**不同存储的同名属性**（如同键值冲突）时，
  这一特性可以通过区分存储命名空间来标识特定存储。命名空间的存在便于开发者在调试时**快速定位组件元素及其状态数据**。
- **默认值：** `undefined`
- **适用场景：** 适用于模块化存储复杂度高的场景，帮助识别和隔离存储逻辑。

---

3. **状态树的不可变性 `immutable`**
- **描述：**  
  启用不可变状态生成机制，通过简单修改当前状态树，自动创建下一状态树，从而保持数据结构的不可变性。  
  这种不可变性可以提升状态更新的安全性及性能优化（例如快速比较状态变化）。
- **默认值：** `undefined`
- **适用场景：** 适合对状态一致性要求较高的场景，尤其是需要确保状态历史记录或避免直接数据突变时。

---

4. **支持函数属性更新与渲染 `enableMarcoActionStateful`**
- **描述：**  
  针对 `defineStore` 的配置项，允许函数属性作为状态进行更新处理。这一功能较少使用，旨在保证框架的开放性和灵活性，为开发者提供额外的业务操作支持。
- **默认值：** `undefined`
- **适用场景：** 仅在特殊场景下使用，能够扩展框架功能以应对复杂需求。

---

### 总结

`options` 是为状态存储逻辑提供配置的接口，其特点包括以下几点：
1. **支持卸载恢复初始状态**：通过 `unmountRestore` 控制模块卸载后的数据行为，适配全局数据与局部模块数据的差异需求。
2. **命名空间区分功能**：通过 `namespace` 为存储提供抽象标识，便于在复杂模块中隔离存储冲突并优化调试体验。
3. **可选不可变状态模式**：启用 `immutable` 属性可以生成新的状态树，增强状态变更的安全性和性能。
4. **开放状态操作的扩展性**：通过 `enableMarcoActionStateful` 支持 `函数属性状态` 更新与渲染，保持一定的灵活性。

这些特点使得 `options` 的配置能够适应不同场景的需求，既确保简洁与常用项，又在特殊场景中提供足够的灵活性与扩展能力。
