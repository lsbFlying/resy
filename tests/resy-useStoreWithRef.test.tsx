import React, { useEffect, useRef } from "react";
import { expect, test } from "vitest";
import { createStore, useStoreWithRef, useStore } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

type State = {
  count: number;
  refName?: string;
};

test("resy-useStoreWithRef", async () => {
  const store = createStore<State>({
    count: 0,
  });
  
  function RefCom() {
    const { refName } = useStore(store);
    
    useEffect(() => {
      expect(store.refName === refName).toBeTruthy();
    }, []);
    
    return (
      <p>ref-com-refName:{refName}</p>
    );
  }
  
  const App = () => {
    const refTemp = useRef({ refName: "useStoreWithRefUnitTest" });
    const { count, refName } = useStoreWithRef(store, refTemp.current);
    return (
      <>
        <RefCom/>
        <p>count:{count}</p>
        <p>refName:{refName}</p>
        <button onClick={() => {
          store.count++;
        }}>btn</button>
      </>
    );
  };
  
  const { getByText } = render(<App/>);
  
  fireEvent.click(getByText("btn"));
  await waitFor(() => {
    getByText("count:1");
  });
  
  // expect(() => store.refName = "newRefName").toThrowError();
  // expect(() => store.setState({ refName: "newRefName" })).toThrowError();
  expect(() => (() => store.syncUpdate({ refName: "newRefName" }))()).toThrowError();
});
