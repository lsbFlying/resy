import React, { useEffect } from "react";
import { test, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { createStore, useStore } from "../src";

test("resy-basic", async () => {
  // 数据范型类型接口
  type Store = {
    count: number;
    text: string;
    testObj: { name?: string; age?: number };
    testArr: { age: number; name: string }[];
    testFun: () => void;
    sex?: "man" | "woman" | string;
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
    const { count, text, testFun, testObj, testArr, sex } = useStore(store);
    
    useEffect(() => {
      const unsubscribe = store.subscribe((effectState, prevState, nextState) => {
        if (effectState.sex === "no-sex-subscribe") {
          console.log(prevState.sex, nextState.sex);
          store.count = 999;
        }
        if (effectState.text === "text-upgrade") {
          store.count = 999666;
        }
        if (effectState.text === "qweasdzxc") {
          store.testObj = { age: 12 };
        }
      }, ["sex", "text"]);
      return unsubscribe;
    }, []);
    
    return (
      <>
        <p>{count}</p>
        <p>{text}</p>
        <p>{sex || "no-sex"}</p>
        <p>testObj-age:{testObj?.age}</p>
        <p>{testObj?.name || "batch-forEach"}</p>
        <p>{testArr[0]?.name}：{testArr[0]?.age}</p>
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
          // 无效更新
          store.testObj.name = "Forrest Gump";
          // 无效更新
          store.testArr[0] = {age: 7, name: "Forrest Gump"};
        }}>btn5</button>
        <button onClick={() => {
          store.sex = undefined;
        }}>btn6</button>
        <button onClick={() => {
          store.setState(() => {
            const updateArr = ["count", "text", "testObj", "testArr"];
            updateArr.forEach(key => {
              // @ts-ignore
              store[key] = typeof store[key] === "number"
                ? 0
                // @ts-ignore
                : typeof store[key] === "string"
                  ? "qweasdzxc"
                  // @ts-ignore
                  : typeof store[key] === "boolean"
                    ? false
                    // @ts-ignore
                    : Object.prototype.toString.call(store[key]) === "[object Array]" ? [] : {};
            });
          });
        }}>btn7</button>
        <button onClick={() => {
          store.setState({
            count: 123,
          }, (nextState) => {
            store.count = nextState.count + 1;
          });
        }}>btn8</button>
        <button onClick={() => {
          store.sex = "no-sex-subscribe";
        }}>btn9</button>
        <button onClick={() => {
          store.text = "text-upgrade";
        }}>btn10</button>
        <button onClick={() => {
          store.setState(store);
        }}>btn11</button>
      </>
    );
  };

  const { getByText, queryByText } = render(<App/>);

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
  expect(getByText("2")).toBeInTheDocument();
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
  
  await act(() => {
    fireEvent.click(getByText("btn7"));;
  });
  expect(getByText("batch-forEach")).toBeInTheDocument();
  expect(getByText("testObj-age:12")).toBeInTheDocument();
  
  await act(() => {
    fireEvent.click(getByText("btn8"));
  });
  expect(getByText("124")).toBeInTheDocument();
  
  await act(() => {
    fireEvent.click(getByText("btn9"));;
  });
  expect(getByText("999")).toBeInTheDocument();
  
  await act(() => {
    fireEvent.click(getByText("btn10"));;
  });
  expect(getByText("999666")).toBeInTheDocument();
  
  await act(() => {
    fireEvent.click(getByText("btn11"));;
  });
});
