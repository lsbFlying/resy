import React from "react";
import { defineStore } from "../src";

interface Model {
  count: number;
  increase(): void;
}

const useStore = defineStore<Model>({
  count: 0,
  increase() {
    this.count++;
  },
});

const App = () => {
  const { count, increase } = useStore();

  return (
    <>
      <p>count:{count}</p>
      <button onClick={increase}>increase</button>
    </>
  );
};

export default App;
