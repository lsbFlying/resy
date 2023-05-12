import React from "react";
import { test } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { batchUpdateShimRun } from "../src/static";

test("resy-set-and-sub3", async () => {
  const store = createStore({ text: "poiu" });
  
  const App = () => {
    const { text } = useStore(store);
    
    return (
      <>
        <p>{text}</p>
        <button onClick={() => {
          batchUpdateShimRun(() => {
            store.setState({ text: "batchUpdateShimRunTestListener" })
          });
        }}>btn</button>
      </>
    );
  };
  
  const { getByText } = render(<App/>);
  
  fireEvent.click(getByText("btn"));
  await waitFor(() => {
    getByText("batchUpdateShimRunTestListener");
  });
});
