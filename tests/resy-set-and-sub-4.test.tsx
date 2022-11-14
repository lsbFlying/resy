import React from "react";
import { expect, test } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

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
        }}>btn-1</button>
        <button onClick={() => {
          store.text2 = "zxc";
          store.setState(() => {
            store.text = "bnm";
          });
        }}>btn-2</button>
        <button onClick={() => {
          store.text2 = "fgh";
          store.setState(() => {
            store.setState({
              text: "dfg",
            });
          });
        }}>btn-3</button>
        <button onClick={() => {
          store.setState({
            text2: "<>",
          });
          store.setState({
            text: "{}",
          });
        }}>btn-4</button>
        <button onClick={() => {
          store.text2 = "~!@";
          store.text = ")_+";
        }}>btn-5</button>
      </>
    );
  };
  
  const { getByText } = render(<App/>);
  
  fireEvent.click(getByText("btn-1"));
  await waitFor(() => {
    expect(gCount === 2).toBeTruthy();
  });
  
  fireEvent.click(getByText("btn-2"));
  await waitFor(() => {
    expect(gCount === 3).toBeTruthy();
  });
  
  fireEvent.click(getByText("btn-3"));
  await waitFor(() => {
    expect(gCount === 4).toBeTruthy();
  });
  
  fireEvent.click(getByText("btn-4"));
  await waitFor(() => {
    expect(gCount === 5).toBeTruthy();
  });
  
  fireEvent.click(getByText("btn-5"));
  console.log(gCount);
  await waitFor(() => {
    console.log("waitFor", gCount, gCount === 6);
    expect(gCount === 6).toBeTruthy();
  });
});
