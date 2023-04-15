import React, { useEffect } from "react";
import { expect, test } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

let gCount = 0;

test("resy-set-and-sub4", async () => {
  const store = createStore({ count: 0, text: "poiu", text2: "qwe" });
  const App = () => {
    const { count, text, text2 } = useStore(store);
    
    useEffect(() => {
      if (count === 570) {
        store.text = "destroy";
      }
    }, [count]);
    
    gCount++;
    return (
      <>
        <p>{count}</p>
        <p>{text}</p>
        <p>{text2}</p>
        <button onClick={() => {
          store.text2 = "iop";
        }}>btn-1</button>
        <button onClick={() => {
          store.setState(() => ({
            text: "bnm",
          }));
        }}>btn-2</button>
        <button onClick={() => {
          store.text2 = "fgh";
          store.setState(() => ({
            text: "dfg",
          }));
        }}>btn-3</button>
        <button onClick={() => {
          store.setState({
            text2: "<>",
          });
          store.setState({
            text: "{}",
          });
        }}>btn-4</button>
        <button onClick={() => {
          store.text2 = "~!@";
          store.text = ")_+";
        }}>btn-5</button>
        <button onClick={() => {
          // 回调并不会再次合并，要符合回调的使用逻辑
          store.setState({
            count: 123,
          }, () => {
            store.text = "Hello";
          });
        }}>btn-6</button>
        <button onClick={() => {
          store.setState(() => ({
            count: 234,
            text2: "yuiop",
          }), () => {
            store.setState({
              text: "Hello",
            });
          });
        }}>btn-7</button>
        <button onClick={() => {
          store.setState({
            count: 567,
            text2: "poiewq",
          }, () => {
            setTimeout(() => {
              store.setState({
                text: "ASD-Hello",
              });
            }, 0);
          });
        }}>btn-8</button>
        <button onClick={() => {
          store.setState(() => ({
            count: store.count + 1,
            text2: "阿克苏结合地方",
          }), () => {
            setTimeout(() => {
              store.setState({
                text: "ASD-Hello",
              });
              store.text2 = "QWELKJ";
            }, 0);
          });
        }}>btn-9</button>
        <button onClick={() => {
          store.setState(() => ({
            count: store.count + 1,
            text2: "离开是大概率事件",
          }), () => {
            store.setState({
              text: "哦器物俄欧哦啊就是来打卡的数据连接",
            });
            store.text2 = "快快发货快递恢复";
          });
        }}>btn-10</button>
        <button onClick={() => {
          store.setState(() => ({
            count: count + 1,
          }), () => {
            store.text2 = "科瑞围殴";
          });
        }}>btn-11</button>
      </>
    );
  };
  
  const { getByText } = render(<App/>);
  
  fireEvent.click(getByText("btn-1"));
  await waitFor(() => {
    expect(gCount === 2).toBeTruthy();
  });
  
  fireEvent.click(getByText("btn-2"));
  await waitFor(() => {
    expect(gCount === 3).toBeTruthy();
  });
  
  fireEvent.click(getByText("btn-3"));
  await waitFor(() => {
    expect(gCount === 4).toBeTruthy();
  });
  
  fireEvent.click(getByText("btn-4"));
  await waitFor(() => {
    expect(gCount === 5).toBeTruthy();
  });
  
  fireEvent.click(getByText("btn-5"));
  console.log(gCount);
  await waitFor(() => {
    console.log("btn-5", gCount, gCount === 6);
    expect(gCount === 6).toBeTruthy();
  });
  
  fireEvent.click(getByText("btn-6"));
  await waitFor(() => {
    console.log("btn-6", gCount);
    /**
     * 如果是react version V >= 18.0.0，那么它会优化批次更新处理，内部更新调度更加完备
     * 所以这里预计期望值特殊注释说明！！！
     */
    // react V >= 18.0.0
    expect(gCount === 7).toBeTruthy();
    // react V < 18.0.0
    // expect(gCount === 8).toBeTruthy();
  });
  
  fireEvent.click(getByText("btn-7"));
  await waitFor(() => {
    // react V >= 18.0.0
    console.log("btn-7", gCount); // 8
    // react V >= 18.0.0
    expect(gCount === 8).toBeTruthy();
    // react V < 18.0.0
    // console.log("btn-7", gCount); // 9
    // react V < 18.0.0
    // expect(gCount === 9).toBeTruthy();
  });
  
  fireEvent.click(getByText("btn-8"));
  await waitFor(() => {
    // react V >= 18.0.0
    console.log("btn-8", gCount); // 10
    // react V >= 18.0.0
    expect(gCount === 10).toBeTruthy();
  
    // react V < 18.0.0
    // console.log("btn-8", gCount); // 11
    // react V < 18.0.0
    // expect(gCount === 11).toBeTruthy();
  });
  
  fireEvent.click(getByText("btn-9"));
  await waitFor(() => {
    // react V >= 18.0.0
    console.log("btn-9", gCount); // 12
    // react V >= 18.0.0
    expect(gCount === 12).toBeTruthy();
  
    // react V < 18.0.0
    // console.log("btn-9", gCount);
    // react V < 18.0.0
    // expect(gCount === 13).toBeTruthy();
  });
  
  fireEvent.click(getByText("btn-10"));
  await waitFor(() => {
    // react V >= 18.0.0
    console.log("btn-10-gCount", gCount, "btn-10-count", store.count);
    // btn-10-gCount 12 btn-10-count 569
    // btn-10-gCount 13 btn-10-count 569
    expect(gCount === 13).toBeTruthy();
    expect(store.count === 569).toBeTruthy();
    
    // react V < 18.0.0
    // console.log("btn-10-gCount", gCount, "btn-10-count", store.count);
    // // btn-10-gCount 13 btn-10-count 568
    // // btn-10-gCount 14 btn-10-count 568
    // // btn-10-gCount 15 btn-10-count 569
    // expect(gCount === 15).toBeTruthy();
    // expect(store.count === 569).toBeTruthy();
  });
  
  // 按钮10可以看出，resy甚至可以合并处理useEffect中的更新
  fireEvent.click(getByText("btn-11"));
  await waitFor(() => {
    // react V >= 18.0.0
    console.log("last", gCount);  // 15
    expect(gCount === 15).toBeTruthy();
    getByText("destroy");
    
    // react V < 18.0.0
    // console.log("last", gCount);  // 17
    // expect(gCount === 17).toBeTruthy();
    // getByText("destroy");
  });
});
