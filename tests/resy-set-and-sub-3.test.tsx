import React, { useEffect } from "react";
import { expect, test } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { batchUpdateShimRun } from "../src/static";

test("resy-set-and-sub3", async () => {
  const store = createStore({ text: "poiu" });

  const App = () => {
    const { text } = useStore(store);

    useEffect(() => {
      // @ts-ignore
      store["subscribe"] = null;

      expect(Object.prototype.toString.call(store.subscribe) === "[object Function]").toBeTruthy();

      // subscribe can't rewrite
      return store.subscribe(({ effectState }) => {
        console.log(effectState.text);
      }, ["text"]);
    }, []);

    return (
      <>
        <p>{text}</p>
        <button onClick={() => {
          batchUpdateShimRun(() => {
            store.setState({ text: "batchUpdateShimRunTestListener" });
          });
        }}>btn</button>
        <button onClick={() => {
          // @ts-ignore
          store["setState"] = null;
          console.log(store.setState);
          store.setState({
            text: "setState can't rewrite"
          });
        }}>btn2</button>
        <button onClick={() => {
          // @ts-ignore
          store["syncUpdate"] = null;
          console.log(store.syncUpdate);
          store.syncUpdate({
            text: "syncUpdate can't rewrite"
          });
        }}>btn3</button>
        <button onClick={() => {
          // @ts-ignore
          store["restore"] = null;
          console.log(store.restore);
          store.restore();
        }}>btn4</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("btn"));
  await waitFor(() => {
    getByText("batchUpdateShimRunTestListener");
  });

  fireEvent.click(getByText("btn2"));
  await waitFor(() => {
    getByText("setState can't rewrite");
  });

  fireEvent.click(getByText("btn3"));
  await waitFor(() => {
    getByText("syncUpdate can't rewrite");
  });

  fireEvent.click(getByText("btn4"));
  await waitFor(() => {
    getByText("poiu");
  });
});
