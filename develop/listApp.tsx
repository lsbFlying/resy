import React from "react";
import { defineStore } from "../src";

let test: any;

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
    this.list[2].name = `${Math.floor(Math.random() * 1000)}`;
    // this.list.push({ name: `${Math.floor(Math.random() * 1000)}`, age: Math.floor(Math.random() * 100) });
    // this.list.forEach((item, index, array) => {
    //   if (index === array.length - 1) {
    //     item.name = `${Math.floor(Math.random() * 1000)}`;
    //   }
    // });
  },
  updateList2() {
    this.list.push({ name: `${Math.floor(Math.random() * 1000)}`, age: Math.floor(Math.random() * 100) });
  },
  updateList3() {
    // this.list.pop();
    const item = { name: `${Math.floor(Math.random() * 1000)}`, age: Math.floor(Math.random() * 100) };
    // const temp = this.list;
    // temp.fill(item);
    // // temp[1].name = `${Math.floor(Math.random() * 1000)}`;
    // // todo 这样会导致属性链出现问题
    // temp[0].name = "asdasdas";
    test = this.list.fill(item);
    // this.list[0].name = "asdasdas";
    test[0].name = "asdasdas";
    test.push(item);
    console.log("test:", test);
  },
}, {
  immutable: true,
});

const App = () => {
  const { list, updateList, updateList2, updateList3 } = useStore();
  // console.log(test, list, test === list);
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
