import React from "react";
import { test, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { createStore, useState } from "../index";

test("resy-simple", async () => {
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
  
  // @ts-ignore
  expect(() => createStore()).toThrowError();
  
  const { getByText } = render(<App />);
  
  await act(() => {
    fireEvent.click(getByText("inc-btn"));
  });
  /**
   * 由于resy的更新是异步的
   * 所以这里需要等待后才能获取到页面的最新渲染
   */
  expect(getByText("1")).toBeInTheDocument();
});

test("resy-upgrade", async () => {
  // 数据范型类型接口
  type Store = {
    count: number;
    text: string;
    testObj: { name: string };
    testArr: { age: number; name: string }[];
    testFun: () => void;
    sex?: "man" | "woman";
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

  const App = () => {
    const { count, text, testFun, testObj, testArr, sex } = useState(store);
    return (
      <>
        <p>{count}</p>
        <p>{text}</p>
        <p>{sex || "no-sex"}</p>
        <p>{testObj.name}</p>
        <p>{testArr[0].name}：{testArr[0].age}</p>
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
            sex: "man",
            count: store.count--,
            testArr: store.testArr.map(item => ({ ...item, age: --item.age }))
          });
        }}>btn4</button>
        <button onClick={() => {
          store.testObj.name = "Forrest Gump";
          store.testArr[0] = {age: 7, name: "Forrest Gump"};
        }}>btn5</button>
        <button onClick={() => {
          store.sex = undefined;
        }}>btn6</button>
      </>
    );
  };

  const { getByText, queryByText } = render(<App />);

  await act(() => {
    fireEvent.click(getByText("btn1"));
  });
  expect(getByText("1")).toBeInTheDocument();

  await act(() => {
    fireEvent.click(getByText("btn2"));
  });
  expect(getByText("2")).toBeInTheDocument();
  expect(getByText("456asd")).toBeInTheDocument();

  await act(() => {
    fireEvent.click(getByText("btn3"));
  });
  expect(getByText("2")).toBeInTheDocument();
  expect(getByText("Jack")).toBeInTheDocument();

  await act(() => {
    fireEvent.click(getByText("btn4"));
  });
  expect(getByText("1")).toBeInTheDocument();
  expect(getByText("Alen：11")).toBeInTheDocument();
  expect(getByText("man")).toBeInTheDocument();

  await act(() => {
    fireEvent.click(getByText("btn5"));
  });
  expect(queryByText("Forrest Gump")).toBeNull();
  expect(queryByText("Forrest Gump：7")).toBeNull();
  
  await act(() => {
    fireEvent.click(getByText("btn6"));
  });
  expect(queryByText("man")).toBeNull();
  expect(getByText("no-sex")).toBeInTheDocument();
});
