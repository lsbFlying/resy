import React, { useEffect } from "react";
import { defineStore } from "../src";

interface Model {
  count: number;
  info: {
    nameInfo: {
      name: string;
    };
  };
  increase(): void;
  updateInfo(): void;
}

const useStore = defineStore<Model>({
  count: 0,
  info: {
    nameInfo: {
      name: "Jack",
    },
  },
  increase() {
    this.count++;
  },
  updateInfo() {
    this.info.nameInfo.name = "Bob";
    // const { info } = this;
    // const { nameInfo } = info;
    // const { name } = nameInfo;
    // console.log("this(store)", info, nameInfo, name);
    // const value = this.info;
    // this.setState({
    //   info: {
    //     ...value,
    //     nameInfo: {
    //       name: "Bob"
    //     },
    //   },
    // });
  },
}, { immutable: true });

const App = () => {
  const { count, info, increase, updateInfo } = useStore();
  const { nameInfo } = info;
  const { name } = nameInfo;
  console.log("render(engine)", info, nameInfo, name);

  useEffect(() => {
    console.log(123123);
  }, [nameInfo]);

  return (
    <>
      <p>count:{count}</p>
      <button onClick={increase}>increase</button>
      <p>info-name:{name}</p>
      <button onClick={updateInfo}>updateInfo</button>
    </>
  );
};

export default App;
