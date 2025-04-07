import React from "react";
import { defineStore } from "../src";

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
        // 更新 increase 的时候也会产生 re-render App 组件的效果
        onClick={createIncrease}
      >
        create-increase-action
      </button>
      <button onClick={increase}>
        increase
      </button>
    </div>
  );
}

export default App;
