import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/** Use mode of setState */
test("setState-IV", async () => {
  const store = createStore({
    count: 0,
  });
  let counter = 0;

  const App = () => {
    const { count } = useStore(store);
    counter++;
    console.log("App", count);
    return (
      <>
        <p>{count}</p>
        <button onClick={() => {
          console.log("start");
          store.setState({
            count: store.count + 1,
          }, () => {
            console.log("one", store.count);
            // It can be seen that the callback of setState is executed collectively and then uniformly.
            expect(store.count === 9).toBeTruthy();
            store.setState({
              count: store.count + 1,
            }, () => {
              console.log("two", store.count);
              expect(store.count === 10).toBeTruthy();
              store.setState({
                count: store.count + 1,
              }, () => {
                console.log("three", store.count);
                expect(store.count === 11).toBeTruthy();
                store.setState({
                  count: store.count + 1,
                });
                expect(store.count === 12).toBeTruthy();
              });
            });
          });
          console.log("temp");
          expect(store.count === 1).toBeTruthy();
          store.count = 3;
          expect(store.count === 3).toBeTruthy();

          store.setState({
            count: 7,
          });
          expect(store.count === 7).toBeTruthy();

          store.count = 5;
          expect(store.count === 5).toBeTruthy();

          store.setState({
            count: 9,
          });
          expect(store.count === 9).toBeTruthy();

          // The superposition of the above mixed update and embedded callback update
          // will be merged into one batch update within resy
        }}>countChange</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("countChange"));
  await waitFor(() => {
    getByText("12");
    // console.log("counter", counter, store.count);
    expect(counter === 2).toBeTruthy();
  });
});
