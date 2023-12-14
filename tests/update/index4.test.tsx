import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore } from "../../src";

/** Update method and batch update */
test("batchUpdate-IV", async () => {
  const store = createStore({
    count: 0,
  });
  let counter = 0;

  const App = () => {
    const { count } = store.useData;
    counter++;
    console.log("App", count);
    return (
      <>
        <p>{count}</p>
        <button onClick={() => {
          store.count++;
          expect(store.count === 1).toBeTruthy();
          
          // The three Promise will be merged into one update process, and the previous store.count++;
          // and the three Promise will be merged into one batch update under the version of react18.
          // 🌟However, because the update schedule in react17 is not 18 perfect,
          // the update of the previous store.count++;
          // code and the three Promise will be divided into two batches of update processing.
          Promise.resolve().then(() => {
            // batch handle, merge into one update
            store.count++;
            expect(store.count === 2).toBeTruthy();
            store.count++;
            expect(store.count === 3).toBeTruthy();
          });
          Promise.resolve().then(() => {
            store.setState({
              count: store.count + 1,
            });
            expect(store.count === 4).toBeTruthy();

            store.setState({
              count: store.count + 1,
            });
            expect(store.count === 5).toBeTruthy();
          });
          Promise.resolve().then(() => {
            store.count++;
            expect(store.count === 6).toBeTruthy();

            store.setState({
              count: store.count + 1,
            });
            expect(store.count === 7).toBeTruthy();
          });

          const id = setTimeout(() => {
            clearTimeout(id);
            store.count++;
            expect(store.count === 8).toBeTruthy();

            store.count++;
            expect(store.count === 9).toBeTruthy();
          }, 0);
          const id2 = setTimeout(() => {
            clearTimeout(id2);
            store.setState({
              count: store.count + 1,
            });
            expect(store.count === 10).toBeTruthy();

            store.setState({
              count: store.count + 1,
            });
            expect(store.count === 11).toBeTruthy();
          }, 0);
          const id3 = setTimeout(() => {
            clearTimeout(id3);
            // Mixed updates, merge into one update
            store.count++;
            expect(store.count === 12).toBeTruthy();

            store.setState({
              count: store.count + 1,
            });
            expect(store.count === 13).toBeTruthy();
          }, 0);
        }}>batchAdd</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("batchAdd"));
  await waitFor(() => {
    getByText("13");
    expect(counter === 5).toBeTruthy();
  });
});
