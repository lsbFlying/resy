import React, { useEffect, useState } from "react";
import EventDispatcher from "../src/listener";
import { expect, test } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { batchUpdateShimRun } from "../src/static";
import { CustomEventListener } from "../src/model";

test("resy-set-and-sub3", async () => {
  const store = createStore({ text: "poiu" });
  
  const App = () => {
    const { text } = useStore(store);
    const [eventListener] = useState<CustomEventListener<any>>(new (EventDispatcher as any)());
    useEffect(() => {
      eventListener.addEventListener("testListener", (effectState) => {
        store.setState({ text: effectState.testListenerData });
      });
    }, []);
    
    return (
      <>
        <p>{text}</p>
        <button onClick={() => {
          eventListener.dispatchEvent("testListener", {testListenerData: "testListenerData"}, {}, {});
        }}>btn1</button>
        <button onClick={() => {
          batchUpdateShimRun(() => {
            store.setState({ text: "batchUpdateShimRunTestListener" })
          });
        }}>btn2</button>
      </>
    );
  };
  
  const { getByText } = render(<App/>);
  
  await act(() => {
    fireEvent.click(getByText("btn1"));
  });
  expect(getByText("testListenerData")).toBeInTheDocument();
  
  await act(() => {
    fireEvent.click(getByText("btn2"));
  });
  expect(getByText("batchUpdateShimRunTestListener")).toBeInTheDocument();
});
