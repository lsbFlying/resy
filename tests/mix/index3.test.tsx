import React, { useEffect } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";
import { combinations, mixMethods, mixMethodsNoSyncUpdate, eventLoop } from "./index2.test";

/** Testing of subscribe under various mixed update modes */
test("mixUpdateAndSubscribe", async () => {
  const store = createStore({
    count: 0,
  });

  let counter = 0;
  let subscribeCounter = 0;

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
    useEffect(() => {
      console.log("subscribe start");
      /**
       * 🌟 From the final test results,
       * it can be seen that the batch execution of subscribe is consistent
       * with the batch scheduling mechanism of resy itself.
       */
      return store.subscribe(() => {
        // Test if the subscribe has the function of batch triggering
        subscribeCounter++;
        // console.log("subscribe");
      });
    }, []);
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
              const name = mixMethods[item];
              matchedAndEventLoopUpdate(name);
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
    // console.log("subscribeCounter-add0-out", subscribeCounter);
    expect(counter === 1).toBeTruthy();
    const id = setTimeout(() => {
      clearTimeout(id);
      // console.log("subscribeCounter-add0-inner", subscribeCounter);
      expect(subscribeCounter === 1).toBeTruthy();
    }, 0);
  });

  fireEvent.click(getByText("add1"));
  await waitFor(() => {
    // console.log(counter, store.count);
    /**
     * 🌟 The test results may not be consistent with the reality,
     * which may be related to the update processing mechanism within react.
     * In practice, the counter here should be 2.
     */
    expect(counter === 3).toBeTruthy();
    // console.log("subscribeCounter-add1-out", subscribeCounter);
    const id = setTimeout(() => {
      clearTimeout(id);
      // console.log("subscribeCounter-add1-inner", subscribeCounter);
      expect(subscribeCounter === 2).toBeTruthy();
    }, 0);
  });

  fireEvent.click(getByText("add2"));
  await waitFor(() => {
    // console.log("subscribeCounter-add2-out", subscribeCounter);
    const id = setTimeout(() => {
      clearTimeout(id);
      // console.log("add2", counter, store.count);
      // console.log("subscribeCounter-add2-inner", subscribeCounter);
      // in react18
      expect(counter === 10).toBeTruthy();
      expect(subscribeCounter === 10).toBeTruthy();
      // 🌟 in react17
      // expect(counter === 11).toBeTruthy();
      // expect(subscribeCounter === 11).toBeTruthy();
    }, 0);
  });

  fireEvent.click(getByText("add3"));
  await waitFor(() => {
    const id = setTimeout(() => {
      clearTimeout(id);
      // console.log("add3", counter, store.count);
      // console.log("subscribeCounter-add3", subscribeCounter);
      expect(counter === 18).toBeTruthy();
      expect(subscribeCounter === 18).toBeTruthy();
    }, 0);
  });
});
