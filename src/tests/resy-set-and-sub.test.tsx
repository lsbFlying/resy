import React, { useEffect } from "react";
import { expect, test } from "vitest";
import { createStore, useStore } from "../index";
import { fireEvent, render } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import {CustomEventListener, EventDispatcher} from "../listener";
import {batchUpdateShimRun} from "../static";

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
  
  const { getByText } = render(<App />);
  
  await act(() => {
    fireEvent.click(getByText("inc-btn"));
  });
  expect(getByText("1")).toBeInTheDocument();
  expect(getByText("Arosy")).toBeInTheDocument();
});

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
  
  const { getByText } = render(<App />);
  
  await act(() => {
    fireEvent.click(getByText("inc-btn"));
  });
  expect(getByText("1")).toBeInTheDocument();
  expect(getByText("Arosy")).toBeInTheDocument();
});

test("resy-set-and-sub3", async () => {
  const store = createStore({ text: "poiu" });
  let eventListener: CustomEventListener<any> | null = null;
  
  const App = () => {
    const { text } = useStore(store);
    useEffect(() => {
      eventListener = new (EventDispatcher as any)();
      eventListener?.addEventListener("testListener", (effectState) => {
        store.setState({ text: effectState.testListenerData });
      });
    }, []);
    
    return (
      <>
        <p>{text}</p>
        <button onClick={() => {
          eventListener?.dispatchEvent("testListener", {testListenerData: "testListenerData"}, {}, {});
        }}>btn1</button>
        <button onClick={() => {
          eventListener?.removeEventListener("testListener");
          store.setState({ text: "removeTestListener" })
        }}>btn2</button>
        <button onClick={() => {
          batchUpdateShimRun(() => {
            store.setState({ text: "batchUpdateShimRunTestListener" })
          });
        }}>btn3</button>
      </>
    );
  };
  
  const { getByText } = render(<App />);
  
  await act(() => {
    fireEvent.click(getByText("btn1"));
  });
  expect(getByText("testListenerData")).toBeInTheDocument();
  
  await act(() => {
    fireEvent.click(getByText("btn2"));
  });
  expect(getByText("removeTestListener")).toBeInTheDocument();
  
  await act(() => {
    fireEvent.click(getByText("btn1"));
  });
  expect(getByText("removeTestListener")).toBeInTheDocument();
  
  await act(() => {
    fireEvent.click(getByText("btn3"));
  });
  expect(getByText("batchUpdateShimRunTestListener")).toBeInTheDocument();
});
