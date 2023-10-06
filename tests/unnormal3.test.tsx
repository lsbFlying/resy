import React, { useEffect, useState } from "react";
import { expect, test } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

type State = {
  now: string;
};

test("unnormal3", async () => {
  const store = createStore<State>(() => ({
    now: `${Date.now()}-${Math.random().toString().substring(2)}`,
  }));

  let now1 = "";
  let now2 = "";

  const AppOrigin = () => {
    const { now } = useStore(store);

    useEffect(() => () => {
      console.log("restore");
      store.restore();
    }, []);
    console.log("now:", now);
    return (
      <>
        <p>now millisecond:{now}</p>
        <button
          onClick={() => {
            // 1
          }}
        >
          btn
        </button>
      </>
    );
  };

  const App = () => {
    const [show, setShow] = useState(false);
    return (
      <>
        <p>App-Wrap:{show ? "multiple" : "single"}</p>
        {show && <AppOrigin />}
        <button
          onClick={() => {
            setShow(!show);
          }}
        >
          app-wrap-btn
        </button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("app-wrap-btn"));   // true
  await waitFor(() => {
    now1 = store.now;
    getByText("App-Wrap:multiple");
  });

  fireEvent.click(getByText("app-wrap-btn"));   // false
  await waitFor(() => {
    now2 = store.now;
    console.log("two", now1, now2);
  });

  fireEvent.click(getByText("app-wrap-btn"));   // true
  await waitFor(() => {
    console.log("three", now1, now2);
    expect(now1 !== now2).toBeTruthy();
  });
});
