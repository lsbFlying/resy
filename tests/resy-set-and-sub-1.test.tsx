import React, { useEffect } from "react";
import { expect, test } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render } from "@testing-library/react";
import { act } from "react-dom/test-utils";

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
  
  await act(() => {
    fireEvent.click(getByText("inc-btn"));
  });
  expect(getByText("1")).toBeInTheDocument();
  expect(getByText("Arosy")).toBeInTheDocument();
});
