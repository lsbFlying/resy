import React, { useEffect, useState } from "react";
import EventDispatcher from "../src/listener";
import { test } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { batchUpdateShimRun } from "../src/static";
import { CustomEventListener } from "../src/model";

test("resy-set-and-sub3", async () => {
  const store = createStore({ text: "poiu" });
  
  const App = () => {
    const { text } = useStore(store);
    const [eventListener] = useState<CustomEventListener<any>>(new EventDispatcher());
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
  
  fireEvent.click(getByText("btn1"));
  await waitFor(() => {
    getByText("testListenerData");
  });
  
  fireEvent.click(getByText("btn2"));
  await waitFor(() => {
    getByText("batchUpdateShimRunTestListener");
  });
});
