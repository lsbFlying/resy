import React, { useEffect } from "react";
import { test } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

test("resy-set-and-sub1", async () => {
  const store = createStore({ count: 0, text: "poiu" });
  const App = () => {
    const { count, text } = useStore(store);
    useEffect(() => {
      return store.subscribe((effectState) => {
        console.log(effectState.count);
        store.text = "Arosy";
      }, ["count"]);
    }, []);
    
    return (
      <>
        <p>{count}</p>
        <p>{text}</p>
        <button onClick={() => store.setState({ count: count + 1 })}>inc-btn</button>
      </>
    );
  };
  
  const { getByText } = render(<App/>);
  
  fireEvent.click(getByText("inc-btn"));
  getByText("1");
  await waitFor(() => {
    getByText("Arosy");
  });
});
