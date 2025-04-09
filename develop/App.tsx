import React, { useEffect } from "react";
import { defineStore } from "../src";

const useStore = defineStore({
  count: 0,
  text: "hello",
  doubleCount() {
    console.log("doubleCount");
    return this.count * 2;
  },
  $doubleCount() {
    console.log("$doubleCount");
    return this.count * 2;
  },
  useTest() {
    useEffect(() => {
      console.log("useTest");
    }, []);
    if (this.count === 1) {
      console.log("useTest-2");
    }
  },
  increase() {
    const $dc = this.$doubleCount();
    console.log("$dc:", $dc);
    this.count++;
  },
  updateText() {
    this.text = `world_${Math.floor(Math.random() * 10000)}`;
  },
});

function App() {
  const { count, text, doubleCount, $doubleCount, useTest, increase, updateText } = useStore();
  useTest();
  console.log("renderApp");
  return (
    <div>
      <div>count: {count}</div>
      <div>doubleCount: {doubleCount()}</div>
      <div>$doubleCount: {$doubleCount()}</div>
      <div>text: {text}</div>
      <button onClick={increase}>
        increase
      </button>
      <button onClick={updateText}>
        updateText
      </button>
    </div>
  );
}

// import React from "react";
// import { ComponentWithStore, createStore } from "../src";
//
// const store = createStore({
//   count: 0,
// });
//
// class App extends ComponentWithStore {
//   store = this.connectStore(store);
//   render() {
//     const { count } = this.store;
//     return (
//       <div>
//         <p>{count}</p>
//         <button
//           onClick={() => {
//             store.count++;
//           }}
//         >
//           increase
//         </button>
//       </div>
//     );
//   }
// }

export default App;
