import React, { useEffect } from "react";
import { expect, test } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render } from "@testing-library/react";
import { act } from "react-dom/test-utils";

test("resy-set-and-sub4", async () => {
  const store = createStore({ count: 0, text: "poiu", text2: "qwe" });
  const App = () => {
    const { count, text, text2 } = useStore(store);
    useEffect(() => {
      if (
        (text2 === "iopasd" && text === "jkl")
        || (text2 === "zxc" && text === "bnm")
        || (text2 === "fgh" && text === "dfg")
      ) {
        store.count++;
      }
    });
    
    return (
      <>
        <p>{count}</p>
        <p>{text}</p>
        <button onClick={() => {
          setTimeout(() => {
            store.text2 = "iopasd";
            store.setState({ text: "jkl" });
          }, 0);
        }}>按钮1</button>
        <button onClick={() => {
          setTimeout(() => {
            store.text2 = "zxc";
            store.setState(() => {
              store.text = "bnm";
            });
          }, 0);
        }}>按钮2</button>
        <button onClick={() => {
          setTimeout(() => {
            store.text2 = "fgh";
            store.setState(() => {
              store.setState({
                text: "dfg",
              });
            });
          }, 0);
        }}>按钮3</button>
      </>
    );
  };
  
  const { getByText } = render(<App/>);
  
  await act(() => {
    fireEvent.click(getByText("按钮1"));
  });
  expect(getByText("1")).toBeInTheDocument();
  
  await act(() => {
    fireEvent.click(getByText("按钮2"));
  });
  expect(getByText("2")).toBeInTheDocument();
  
  await act(() => {
    fireEvent.click(getByText("按钮3"));
  });
  expect(getByText("3")).toBeInTheDocument();
});
