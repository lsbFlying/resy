import React from "react";
import { expect, test } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render } from "@testing-library/react";
import { act } from "react-dom/test-utils";

let gCount = 0;

test("resy-set-and-sub4", async () => {
  const store = createStore({ count: 0, text: "poiu", text2: "qwe" });
  const App = () => {
    const { count, text, text2 } = useStore(store);
    gCount++;
    return (
      <>
        <p>{count}</p>
        <p>{text}</p>
        <p>{text2}</p>
        <button onClick={() => {
          store.text2 = "iop";
          store.setState({ text: "jkl" });
        }}>按钮1</button>
        <button onClick={() => {
          store.text2 = "zxc";
          store.setState(() => {
            store.text = "bnm";
          });
        }}>按钮2</button>
        <button onClick={() => {
          store.text2 = "fgh";
          store.setState(() => {
            store.setState({
              text: "dfg",
            });
          });
        }}>按钮3</button>
        <button onClick={() => {
          store.setState({
            text2: "<>",
          });
          store.setState({
            text: "{}",
          });
        }}>按钮4</button>
        <button onClick={() => {
          store.text2 = "~!@";
          store.text = ")_+";
        }}>按钮5</button>
      </>
    );
  };
  
  const { getByText } = render(<App/>);
  
  await act(() => {
    fireEvent.click(getByText("按钮1"));
  });
  expect(gCount === 2).toBeTruthy();
  
  await act(() => {
    fireEvent.click(getByText("按钮2"));
  });
  expect(gCount === 3).toBeTruthy();
  
  await act(() => {
    fireEvent.click(getByText("按钮3"));
  });
  expect(gCount === 4).toBeTruthy();
  
  await act(() => {
    fireEvent.click(getByText("按钮4"));
  });
  expect(gCount === 5).toBeTruthy();
  
  await act(() => {
    fireEvent.click(getByText("按钮5"));
  });
  expect(gCount === 6).toBeTruthy();
});
