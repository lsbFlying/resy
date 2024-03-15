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
           * —————— Mixing Test of promise、setTimeout、sync code、setState`s callback —————— start
           * Test cases are tested for react18.
           * The results under react18 are only analyzed below.
           */
          store.count++;
          console.log(1, store.count === 1);

          Promise.resolve().then(() => {
            store.count++;
            console.log(4, store.count === 4);

            store.setState({
              count: store.count + 1,
            }, () => {
              // third push stack
              store.setState({
                count: store.count + 1,
              }, () => {
                console.log(13, store.count === 0);
                store.count++;
                console.log(14, store.count === 1);
              });
              console.log(10, store.count === 20);
            });
            console.log(5, store.count === 5);
          });

          Promise.resolve().then(() => {
            store.setState(() => ({
              count: 9,
            }), () => {
              // forth push stack
              store.count++;
              console.log(11, store.count === 21);
            });
            console.log(6, store.count === 9);

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
              // fifth push stack
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
                console.log(12, store.count === 0);
              }
            });
            console.log(7, store.count === 16);
          });

          store.setState(prevState => {
            if (prevState.count === 1) {
              return {
                count: 13,
              };
            }
            return null;
          }, () => {
            // first push stack
            Promise.resolve().then(() => {
              store.count++;
              console.log(8, store.count === 17);
            });
            Promise.resolve().then(() => {
              store.count = 19;
              console.log(9, store.count === 19);
            });
          });
          console.log(2, store.count === 13);

          store.setState({
            count: 3,
          }, () => {
            // second push stack
            const id1 = setTimeout(() => {
              clearTimeout(id1);
              store.count++;
              store.count++;
              console.log(15, store.count === 3);
            }, 0);
            const id2 = setTimeout(() => {
              clearTimeout(id2);
              store.setState({
                count: store.count + 4,
              });
              store.setState({
                count: store.count + 8,
              });
              console.log(16, store.count === 15);
            }, 0);
            const id3 = setTimeout(() => {
              clearTimeout(id3);
              store.count++;
              store.setState({
                count: store.count + 8,
              });
              console.log(17, store.count === 24);
            }, 0);
          });
          console.log(3, store.count === 3);
          /** —————— Limit mixing Test of promise、setTimeout、sync code、setState`s callback —————— end */
        }}>countChange</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("countChange"));
  await waitFor(() => {
    getByText("24");
    // in react18, plus initialization rendering, there are six rounds.
    console.log("counter", counter);
    expect(counter === 6).toBeTruthy();

    // 🌟 in react17, plus initialization rendering, there are seven rounds.
    // expect(counter === 7).toBeTruthy();
  });
});
