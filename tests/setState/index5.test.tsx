import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/** Update method and batch update and use mode of setState */
test("setState-V", async () => {
  const store = createStore({
    count: 0,
  });
  let counter = 0;

  const App = () => {
    const { count } = useStore(store);
    counter++;
    console.log("App", count, counter);
    return (
      <>
        <p>{count}</p>
        <button onClick={() => {
          /**
           * —————— Mixing Test of promise、sync code、setState`s callback —————— start
           * Test cases are tested for react18.
           * The results under react18 are only analyzed below.
           */
          store.count++;  // start
          console.log(1, store.count === 1);

          Promise.resolve().then(() => {
            store.count++;
            console.log(8, store.count === 27);

            store.setState({
              count: store.count + 1,
            }, () => {
              store.setState({
                count: store.count + 1,
              }, () => {
                console.log(17, store.count === 0);
                store.count++;
                console.log(18, store.count === 1);
              });
              console.log(14, store.count === 20);
            });
            console.log(9, store.count === 28);
          });

          Promise.resolve().then(() => {
            store.setState(() => ({
              count: 9,
            }), () => {
              store.count++;
              console.log(15, store.count === 21);
            });
            console.log(10, store.count === 9);

            store.setState(prevState => {
              // console.log(prevState, prevState.count);
              // prevState and nextState are designed to address the uncertainty,
              // uncontrollably and heavy burden of updating among many event cycles.
              if (prevState.count === 9) {
                return {
                  count: 16,
                };
              }
              return null;
            }, nextState => {
              // console.log(nextState, nextState.count);

              // From this complex test case, the existence of nextState is safe.
              // In the process of complex event cycle,
              // although you can get the latest value by using store to obtain data,
              // the complexity of the event cycle will make the latest source of data unknowable
              // and uncontrollable, with strong suspicion.
              if (nextState.count === 16) {
                store.setState({
                  count: 0,
                });
                console.log(16, store.count === 0);
              }
            });
            console.log(11, store.count === 16);
          });

          store.setState(prevState => {
            if (prevState.count === 1) {
              return {
                count: 13,
              };
            }
            return null;
          }, () => {
            /**
             * @desc 由于一开始`store.count++;  // start`的执行就是异步更新产生了一个异步微任务，
             * 而在异步微任务里面会有一个执行订阅与callback的处理，所以这里的回调callback就变成了
             * 第一波同步代码执行完毕之后第一个执行的回调callback，并且是在下面`store.setState({ count: 3 })`
             * 执行完之后的state的基础之上执行的，所以这里的count打印出来是`3`。
             *
             * 而同时这个回调里面都是两个异步微任务，所以进入再打印执行的就是`store.setState({ count: 3 })`里面的回调的执行结果了。
             * 所以下面这两个异步微任务的执行就会在代码一开始的两个异步微任务之后执行。
             */
            console.log(4, store.count === 3);

            // 第一波re-render批处理更新完之后就开始执行这里的微任务回调
            Promise.resolve().then(() => {
              store.count++;
              console.log(12, store.count === 17);
            });
            Promise.resolve().then(() => {
              store.count = 19;
              console.log(13, store.count === 19);
            });
          });
          console.log(2, store.count === 13);

          store.setState({
            count: 3,
          }, () => {
            /**
             * @desc 这个回调执行完之后就开始执行代码一开始执行了的两个异步微任务回调。
             * 这里之所以会执行代码一开始产生的的两个异步微任务回调，而不是直接产生re-render更新渲染，
             * 是因为`React18+`版本的内部的批量更新的机制产生的结果。
             * 🌟在高版本的React批量更新机制里面的批处理是按事件循环的单个“tick”（即两次宏任务间的宏观执行单元）聚合的。
             * 只要setState在同一tick内，无论同步还是深层的Promise.then回调，理论上都会被合并。
             * ❤️而第一波宏任务是`store.count++;  // start`而第一个宏任务的执行就立马产生了一个微任务（resy的异步更新导致的）；
             * 紧随其后的是两个setState的宏任务的执行，
             * store.setState(prevState => {
             *     if (prevState.count === 1) {
             *         return {
             *             count: 13,
             *         };
             *     }
             *     return null;
             * })
             * 与
             * `store.setState({ count: 3 })`；
             * 那么在这两个宏任务之间的同步或者异步微任务回调的更新都会批处理合并更新。
             * 刚好在这两个宏任务之间就是第一个宏任务`store.count++;  // start`产生的微任务更新（resy内部）
             * 以及`store.count++;  // start`下方的两个微任务回调。
             * 至此，就解释完为何初始化的两个微任务回调执行完毕之后就会产生组建re-render更新渲染的原因了。
             */
            store.count++;
            store.count++;
            console.log(5, store.count === 5);

            store.setState({
              count: store.count + 4,
            });
            store.setState({
              count: store.count + 8,
            });
            console.log(6, store.count === 17);

            store.count++;
            store.setState({
              count: store.count + 8,
            });
            console.log(7, store.count === 26);
          });
          console.log(3, store.count === 3);
          /** —————— Limit mixing Test of promise、sync code、setState`s callback —————— end */
        }}>countChange</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("countChange"));
  await waitFor(() => {
    getByText("1");
    // in react18, plus initialization rendering, there are six rounds.
    console.log("counter", counter);
    expect(counter === 3).toBeTruthy();
  });
});
