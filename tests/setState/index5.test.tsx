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
            console.log(4, store.count === 4);

            store.setState({
              count: store.count + 1,
            });
            console.log(5, store.count === 5);
          });

          Promise.resolve().then(() => {
            store.setState(() => ({
              count: 9,
            }));
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
          });
          console.log(2, store.count === 13);

          store.setState({
            count: 3,
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
    getByText("16");
    // in react18, plus initialization rendering, there are six rounds.
    console.log("counter", counter);
    expect(counter === 2).toBeTruthy();
  });
});
