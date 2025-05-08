import { ComponentWithStore, createStore } from "../src";
import React from "react";

type Store = {
  count: number;
  text: string;
  test(): string;
};

console.time("createStore");
const store = createStore<Store>({
  count: 0,
  text: "hello world",
  test() {
    return `${this.count}-${this.text}`;
  },
});
console.timeEnd("createStore");

export default class App extends ComponentWithStore {

  store = this.connectStore(store);

  render() {
    const { count, text, test } = this.store;
    const testStr = test();
    return (
      <>
        <p>{count}</p>
        <p>{testStr}</p>
        <button onClick={() => {
          store.count++;
        }}>add</button>
        <button onClick={() => {
          store.count++;
        }}>add2</button>
        <input
          placeholder="请输入"
          value={text}
          onChange={event => {
            store.syncUpdate({
              text: event.target.value,
            });
          }}
        />
        <button onClick={() => {
          store.count--;
        }}>subtract</button>
        <button onClick={() => {
          store.setState({
            count: 9,
          });
        }}>change</button>
        <button onClick={() => {
          store.syncUpdate({
            text: "fine",
            count: 999,
          });
        }}>change2</button>
      </>
    );
  }
}
