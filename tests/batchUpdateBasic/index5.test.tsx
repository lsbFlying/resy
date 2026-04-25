import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/** Update method and batch update */
test("batchUpdateBasic-V", async () => {
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
          /** start */
          store.count++;
          expect(store.count === 1).toBeTruthy();

          Promise.resolve().then(() => {
            // batch handle, merge into one update
            store.count++;
            expect(store.count === 8).toBeTruthy();
            store.count++;
            expect(store.count === 9).toBeTruthy();
          });
          Promise.resolve().then(() => {
            store.setState({
              count: store.count + 1,
            });
            expect(store.count === 10).toBeTruthy();

            store.setState({
              count: store.count + 1,
            });
            expect(store.count === 11).toBeTruthy();
          });
          Promise.resolve().then(() => {
            store.count++;
            expect(store.count === 12).toBeTruthy();

            store.setState({
              count: store.count + 1,
            });
            expect(store.count === 13).toBeTruthy();
          });
          /**
           * @description Starting with the sentence "store.count++", until the end of the three Promise,
           * there will be different batch processing effects in different react versions:
           * In react17, the batch update mechanism of resy is divided into two batches,
           * one for store.count++ and one for the last three Promise.
           * It can be seen that the batch update mechanism of resy can achieve the effect of react18 even in react17.
           * In react18, resy merges store.count++ with three Promise into one batch update.
           * It can be seen that the batch update mechanism of resy will be more optimized and complete
           * under the blessing of the update scheduling mechanism of react18, which is more perfect than the v17 version.
           */
          /** end */

          store.count++;
          expect(store.count === 2).toBeTruthy();

          store.count++;
          expect(store.count === 3).toBeTruthy();

          store.setState({
            count: store.count + 1,
          });
          expect(store.count === 4).toBeTruthy();

          store.setState({
            count: store.count + 1,
          });
          expect(store.count === 5).toBeTruthy();

          // Mixed updates, merge into one update
          store.count++;
          expect(store.count === 6).toBeTruthy();

          store.setState({
            count: store.count + 1,
          });
          expect(store.count === 7).toBeTruthy();
        }}>batchAdd</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("batchAdd"));
  await waitFor(() => {
    console.log("counter", counter);
    getByText("13");
    expect(counter === 2).toBeTruthy();
  });
});
