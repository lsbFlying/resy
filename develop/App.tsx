import React from "react";
import { createStore } from "../src";

const store = createStore({
  count: 0,
  text: "hello",
});

const App = () => {
  const { count, text } = store.useStore();

  return (
    <>
      <p>count:{count}</p>
      <p>text:{text}</p>
      <button
        onClick={() => {
          store.count++;
        }}
      >
        change1
      </button>
    </>
  );
};

export default App;
