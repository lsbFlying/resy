# createStore
`createStore` 是 **resy** 早期就一直存在的版本API，而 `defineStore` 是在 **11.1.0** 的 **resy** 版本中才出现的新API。

## 原生操作，灵活高效
- 直接对 `store` 的数据进行操作（如 `store.count++`），这一设计是 `createStore` 的核心优势，开发者可以快速操作状态，无需多余的封装逻辑。
- 在不需要定义 `Actions` 或复杂业务逻辑的情况下，可以通过简单变量直接更新并广播到目标视图。

**示例：**
```tsx
store.count++; // 无需 wrapper, 灵活更新状态
```

## 实时读取最新状态
`createStore` 创建的 `store` 状态对象在更新状态后可以 `立即提供最新的状态值`，不需要通过额外的回调或监听机制来获取下一个 `nextState` 或 `latestState`。
**示例：**
```tsx
const store = createStore({ count: 0 });

store.count++; // 更新状态
console.log(store.count); // 始终可以得到最新的值（输出: 1）

store.count = store.count + 10; // 再次更新
console.log(store.count); // 输出: 11
```

## 显式的状态对象，有利于动态多实例化管理
- `createStore` 方法返回的是显式的 `store` 对象，非常适合动态生成多个状态容器或具备独立生存周期的场景（例如动态集合、用户状态管理等）。
- 适合架构多实例需求复杂的大型应用（如需要单独跟踪数十个动态实例时）。

**简单示例：动态为用户创建状态实例**

假如你有一个场景，需要为多个用户分别维护独立的状态，每个用户有自己的 `store`（比如购物车或个人信息）。
系统需要根据服务端返回的不同用户的列表进行动态创建属于每一个用户的状态容器，
比如系统使用者用户当前系统的好几个用户，并且系统可以根据使用者切换不同的用户角色，
使用 `createStore` 就可以根据用户数量动态创建多个状态实例：

```tsx
// 服务返回的用户列表
const users = [
  { id: 1, username: "Alice" },
  { id: 2, username: "Bob" }
];

// 动态创建多个独立状态
// 实际应用场景可以根据users应用于select选项进行user-change的触发执行不同角色store的切换
const userStores = users.map(user =>
  createStore({ username: user.username, cart: [] })
);

// 访问其中某个用户的状态
userStores[0].cart.push("Item 1");
console.log(userStores[0].username); // Alice
console.log(userStores[0].cart);     // ["Item 1"]
```
