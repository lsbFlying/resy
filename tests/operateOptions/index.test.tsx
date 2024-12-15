import React, { useState } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/** Scenario testing of setOptions、getOptions */
test("setOptions", async () => {
  type Store = {
    count: number;
  };

  const store = createStore<Store>({
    count: 0,
  });

  const Counter = () => {
    const { count } = useStore(store);

    return (
      <>
        <p>counter:{count}</p>
        <button onClick={() => {
          store.count++;
          const currentOptions = store.getOptions();
          console.log(currentOptions);
          expect(currentOptions.unmountRestore === true).toBeTruthy();
          store.setOptions({
            unmountRestore: false,
          });
        }}>add</button>
      </>
    );
  };

  const App = () => {
    const [show, setShow] = useState(true);

    return (
      <>
        {show ? <Counter /> : <p>counter-none</p> }
        <button onClick={() => {
          setShow(!show);
        }}>visibleChange</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("add"));
  await waitFor(() => {
    getByText("counter:1");
  });

  fireEvent.click(getByText("visibleChange"));
  await waitFor(() => {
    getByText("counter-none");
  });

  fireEvent.click(getByText("visibleChange"));
  await waitFor(() => {
    getByText("counter:1");
    expect(store.count === 1).toBeTruthy();
  });
});
