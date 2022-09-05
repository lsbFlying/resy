import React from "react";
import { test, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { createStore, useState } from "../index";

test("resy-simple", () => {
  const store = createStore({ count: 0 });
  
  const App = () => {
    const state = useState(store);
    
    return (
      <>
        <p>{state.count}</p>
        <button onClick={() => store.count++}>inc-btn</button>
      </>
    );
  };
  
  const { getByText } = render(<App />);
  
  /**
   * resy的更新是异步的，所以需要等一下才会得到新的更新页面
   * 这也是jsdom或者test库等一些测试库的限制
   * 本质上还是建议写原生的真实的测试场景代码来替代测试覆盖率
   */
  setTimeout(() => {
    fireEvent.click(getByText("inc-btn"));
    expect(getByText("1")).toBeInTheDocument();
  }, 1000);
});

// 数据范型类型接口
type Store = {
  count: number;
  text: string;
  testObj: { name: string };
  testArr: { age: number; name: string }[];
  testFun: () => void;
};

// 生成的这个store可以全局共享，直接引入store即可
const store = createStore<Store>(
  {
    count: 0,
    text: "123qwe",
    testObj: { name: "Paul" },
    testArr: [{age: 12, name: "Alen"}, { age: 16, name: "Frac" }],
    testFun: () => {
      store.count++;
      console.log("testFun");
    },
  },
  /**
   * 默认为true
   * true：默认模块卸载时自动恢复初始化数据状态
   * false：模块卸载时也不恢复初始化数据，保持数据状态
   * 常规使用场景设置为true即可
   * 特殊使用场景如login登录信息数据
   * 或theme主题数据属于全局状态数据可以设置为false
   */
  // false,
);

test("resy-upgrade", () => {
  const App = () => {
    const { count, text, testFun, testObj, testArr } = useState(store);
    return (
      <>
        <p>{count}</p>
        <p>{text}</p>
        <p>{testObj.name}</p>
        <p>{testArr.map(item => `${item.name}：${item.age}`)}</p>
        <button onClick={testFun}>btn1</button>
        <button onClick={() => {
          store.count++;
          store.text = "456asd";
        }}>btn2</button>
        <button onClick={() => {
          store.count = count;
          store.testObj = {
            name: "Jack",
          };
        }}>btn3</button>
        <button onClick={() => {
          store.setState({
            count: store.count--,
            testArr: store.testArr.map(item => ({ ...item, age: item.age-- }))
          });
        }}>btn4</button>
      </>
    );
  };
  
  const { getByText } = render(<App />);
  
  // @ts-ignore
  expect(() => createStore()).toThrow();
  
  setTimeout(() => {
    fireEvent.click(getByText("btn1"));
    expect(getByText("1")).toBeInTheDocument();
  
    fireEvent.click(getByText("btn2"));
    expect(getByText("2")).toBeInTheDocument();
    expect(getByText("456asd")).toBeInTheDocument();
  
    fireEvent.click(getByText("btn3"));
    expect(getByText("2")).toBeInTheDocument();
    expect(getByText("Jack")).toBeInTheDocument();
  
    fireEvent.click(getByText("btn4"));
    expect(getByText("1")).toBeInTheDocument();
    expect(getByText("Alen：11")).toBeInTheDocument();
  }, 1000);
});
