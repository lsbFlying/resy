import React from "react";
import { defineStore } from "../src";

const useStore = defineStore({
  list: [
    { name: `${Math.floor(Math.random() * 1000)}`, age: Math.floor(Math.random() * 100) },
    { name: `${Math.floor(Math.random() * 1000)}`, age: Math.floor(Math.random() * 100) },
    { name: `${Math.floor(Math.random() * 1000)}`, age: Math.floor(Math.random() * 100) },
    { name: `${Math.floor(Math.random() * 1000)}`, age: Math.floor(Math.random() * 100) },
    { name: `${Math.floor(Math.random() * 1000)}`, age: Math.floor(Math.random() * 100) },
    { name: `${Math.floor(Math.random() * 1000)}`, age: Math.floor(Math.random() * 100) },
  ],
  updateList() {
    // this.list[2].name = `${Math.floor(Math.random() * 1000)}`;
    // this.list.push({ name: `${Math.floor(Math.random() * 1000)}`, age: Math.floor(Math.random() * 100) });
    this.list.forEach((item, index, array) => {
      if (index === array.length - 1) {
        item.name = `${Math.floor(Math.random() * 1000)}`;
      }
    });
  },
  updateList2() {
    this.list.push({ name: `${Math.floor(Math.random() * 1000)}`, age: Math.floor(Math.random() * 100) });
  },
  updateList3() {
    this.list.pop();
  },
}, {
  immutable: true,
});

const App = () => {
  const { list, updateList, updateList2, updateList3 } = useStore();

  return (
    <>
      <button onClick={updateList}>updateList</button>
      <button onClick={updateList2}>updateList2</button>
      <button onClick={updateList3}>updateList3</button>
      <div>
        {
          list.map((item, index) => {
            return (
              <div key={`${item.name}${item.age}${index}`}>name:{item.name}; age:{item.age}</div>
            );
          })
        }
      </div>
    </>
  );
};

export default App;
