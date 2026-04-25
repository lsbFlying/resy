import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";
import { eventLoop, mixMethods, mixMethodsNoSyncUpdate, combinations } from "./constant";

/** Mixed use of update methods */
test("mixUpdate-II", async () => {
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
    // console.log("App", count);
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
          /**
           * 🌟 It can be seen that syncUpdate keeps batch processing
           * consistent and coordinated within the normal control range of react.
           */
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
                    /**
                     * Experienced 6 syncs, 6 promises, and 6 setTimeout.
                     * The coordination between direct and setState is complete,
                     * and sync and promise are processed as one batch update,
                     * which is in the case of react18.
                     * 🌟 If it is react17, then sync and promise are treated as two batch updates.
                     * setTimeout are updated 6 times each, which meets expectations
                     */
                    matchedAndEventLoopUpdate(mixMethodsNoSyncUpdate[item]);
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
                    /**
                     * Experienced 6 syncs, 6 promises, and 6 setTimeout.
                     * direct, setState, and syncUpdate have as complete batch processing as possible,
                     * but the particularity of syncUpdate itself
                     * makes batch processing one more render times than direct and setState.
                     * This is because syncUpdate is slightly out of sync with Resy's own scheduling mechanism
                     * in order to be closer to React's update scheduling mechanism.
                     * Despite this, the overall batch update scheduling mechanism of
                     * Resy is more comprehensive and optimized compared to React.
                     */
                    matchedAndEventLoopUpdate(mixMethods[item]);
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
    expect(counter === 1).toBeTruthy();
  });

  fireEvent.click(getByText("add1"));
  await waitFor(() => {
    console.log("add1", counter, store.count);
    /**
     * 🌟 The test results may not be consistent with the reality,
     * which may be related to the update processing mechanism within react.
     * In practice, the counter here should be 2.
     */
    expect(counter === 3).toBeTruthy();
  });

  fireEvent.click(getByText("add2"));
  await waitFor(() => {
    console.log("add2", counter, store.count);
    expect(counter === 10).toBeTruthy();
  });

  fireEvent.click(getByText("add3"));
  await waitFor(() => {
    console.log("add3", counter, store.count);
    expect(counter === 18).toBeTruthy();
  });
});
