import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";
import { combinations, mixMethods, mixMethodsNoSyncUpdate, eventLoop } from "./constant";

/** Testing of subscribe under various mixed update modes */
test("mixUpdateAndSubscribe", async () => {
  const store = createStore({
    count: 0,
  });

  let counter = 0;

  function matchedAndEventLoopUpdate(name: string, callback?: () => void) {
    switch (name) {
      case "direct":
        store.count = Math.round(Math.random() * 10000);
        break;
      case "setState":
        store.setState({
          count: Math.round(Math.random() * 10000),
        });
        break;
      case "syncUpdate":
        store.syncUpdate({
          count: Math.round(Math.random() * 10000),
        });
        break;
      case "sync":
        callback?.();
        break;
      case "promise":
        Promise.resolve().then(() => {
          callback?.();
        });
        break;
      case "setTimeout": {
        const id = setTimeout(() => {
          clearTimeout(id);
          callback?.();
        }, 0);
        break;
      }
      default:
        break;
    }
  }

  const App = () => {
    const { count } = useStore(store);

    counter++;
    // console.log("App");
    return (
      <>
        <p>{count}</p>
        <button onClick={() => {
          combinations.forEach(combination => {
            combination.forEach(item => {
              matchedAndEventLoopUpdate(mixMethodsNoSyncUpdate[item]);
            });
          });
        }}>add0</button>
        <button onClick={() => {
          combinations.forEach(combination => {
            combination.forEach(item => {
              matchedAndEventLoopUpdate(mixMethods[item]);
            });
          });
        }}>add1</button>
        <button onClick={() => {
          combinations.forEach(combination => {
            combination.forEach(item => {
              const eventLoopName = eventLoop[item];
              matchedAndEventLoopUpdate(eventLoopName, () => {
                combinations.forEach(combination => {
                  combination.forEach(item => {
                    const name = mixMethodsNoSyncUpdate[item];
                    matchedAndEventLoopUpdate(name);
                  });
                });
              });
            });
          });
        }}>add2</button>
        <button onClick={() => {
          combinations.forEach(combination => {
            combination.forEach(item => {
              const eventLoopName = eventLoop[item];
              matchedAndEventLoopUpdate(eventLoopName, () => {
                combinations.forEach(combination => {
                  combination.forEach(item => {
                    const name = mixMethods[item];
                    matchedAndEventLoopUpdate(name);
                  });
                });
              });
            });
          });
        }}>add3</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("add0"));
  await waitFor(() => {
    // console.log(counter, store.count);
    // console.log("subscribeCounter-add0", counter, subscribeCounter);
    expect(counter === 2).toBeTruthy();
  });

  fireEvent.click(getByText("add1"));
  await waitFor(() => {
    // console.log(counter, store.count);
    /**
     * 🌟 The test results may not be consistent with the reality,
     * which may be related to the update processing mechanism within react.
     * In practice, the counter here should be 2.
     */
    // console.log("subscribeCounter-add1", counter, subscribeCounter);
    expect(counter === 3).toBeTruthy();
  });

  fireEvent.click(getByText("add2"));
  await waitFor(() => {
    // console.log("add2", counter, store.count);
    // console.log("subscribeCounter-add2", counter, subscribeCounter);
    // 有6次setTimeout无法合并批处理更新，立即触发渲染，
    // 其他微任务与同步任务共同形成一个事件循环`tick`合并为一次更新，6 + 1 = 7，7 + 之前的3 = 10 => counter
    expect(counter === 10).toBeTruthy();
  });

  fireEvent.click(getByText("add3"));
  await waitFor(() => {
    // console.log("add3", counter, store.count);
    // console.log("subscribeCounter-add3", counter, subscribeCounter);
    expect(counter === 18).toBeTruthy();
  });
});
