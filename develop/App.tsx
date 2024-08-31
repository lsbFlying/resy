import React from "react";
import { createSignals } from "../src";

const store = createSignals({
  count: 0,
  text: "hello",
});

const App = () => {
  const { count, text } = store.signals;

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
