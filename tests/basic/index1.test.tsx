import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/** The simplest basic use */
test("simplestBasic-I", async () => {
  type Store = {
    count: number;
    text: string;
  };

  const store = createStore<Store>({
    count: 0,
    text: "hello",
  });

  const App = () => {
    const { count, text } = useStore(store);

    return (
      <>
        <p>{count}</p>
        <input
          placeholder="请输入"
          value={text}
          onChange={event => {
            store.syncUpdate({
              text: event.target.value,
            });
          }}
        />
        <button onClick={() => {
          store.count++;
        }}>add</button>
        <button onClick={() => {
          store.count--;
        }}>subtract</button>
      </>
    );
  };

  const { getByText, getByPlaceholderText, getByDisplayValue } = render(<App />);

  fireEvent.click(getByText("add"));
  await waitFor(() => {
    getByText("1");
  });

  fireEvent.click(getByText("subtract"));
  await waitFor(() => {
    getByText("0");
  });

  fireEvent.change(getByPlaceholderText("请输入"), {
    target: {
      value: "okk",
    },
  });
  await waitFor(() => {
    getByDisplayValue("okk");
    expect(store.text === "okk").toBeTruthy();
  });
});
