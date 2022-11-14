import React, { useEffect } from "react";
import { test } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

test("resy-set-and-sub2", async () => {
  const store = createStore({ count: 0, text: "poiu" });
  const App = () => {
    const { setState, subscribe } = store;
    const { count, text } = useStore(store);
    useEffect(() => {
      return subscribe((effectState) => {
        console.log(effectState.count);
        store.text = "Arosy";
      }, ["count"]);
    }, []);
    
    return (
      <>
        <p>{count}</p>
        <p>{text}</p>
        <button onClick={() => setState({ count: count + 1 })}>inc-btn</button>
      </>
    );
  };
  
  const { getByText } = render(<App/>);
  
  fireEvent.click(getByText("inc-btn"));
  await waitFor(() => {
    getByText("1");
    getByText("Arosy");
  });
});
