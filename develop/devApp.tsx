import { ComponentWithStore, createStore } from "../src";
import React from "react";

console.time("createStore");
const store = createStore({
  count: 0,
  text: "hello world",
  doubleCount() {
    console.log("doubleCount");
    return this.count * 2;
  }
});
console.timeEnd("createStore");

class App extends ComponentWithStore {

  store = this.connectStore(store);

  render() {
    const { count, text, doubleCount } = this.store;
    return (
      <>
        <p>count:{count}</p>
        <p>doubleCount:{doubleCount()}</p>
        <p>text:{text}</p>
        <button onClick={() => {
          store.count++;
        }}>add
        </button>
        <button onClick={() => {
          store.text = "hello";
        }}>text
        </button>
      </>
    );
  }
}

export default App;
