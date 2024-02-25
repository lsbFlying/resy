import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { ComponentWithStore, createStore } from "../../src";

/** Basic usage of class components */
test("classConnect-I", async () => {
  type Store = {
    count: number;
    text: string;
    test(): string;
  };

  const store = createStore<Store>({
    count: 0,
    text: "hello world",
    test() {
      return `${this.count}-${this.text}`;
    },
  });

  class App extends ComponentWithStore {

    store = this.connectStore(store);

    render() {
      const { count, text, test } = this.store;
      const testStr = test();
      return (
        <>
          <p>{count}</p>
          <p>{testStr}</p>
          <button onClick={() => {
            store.count++;
            /**
             * @description You can also use `this` to access the store,
             * which in essence is equivalent to operating directly through the store.
             * Generally, we would not perform such redundant operations.
             */
            // this.store.count++;
          }}>add</button>
          <button onClick={() => {
            this.store.count++;
          }}>add2</button>
          <input
            placeholder="请输入"
            value={text}
            onChange={event => {
              this.store.syncUpdate({
                text: event.target.value,
              });
              // or
              // store.syncUpdate({
              //   text: event.target.value,
              // });
            }}
          />
          <button onClick={() => {
            store.count--;
          }}>subtract</button>
          <button onClick={() => {
            store.setState({
              count: 9,
            });
          }}>change</button>
          <button onClick={() => {
            store.syncUpdate({
              text: "fine",
              count: 999,
            });
          }}>change2</button>
        </>
      );
    }
  }

  const { getByText, getByPlaceholderText, getByDisplayValue } = render(<App />);

  fireEvent.click(getByText("add"));
  await waitFor(() => {
    getByText("1");
    getByText("1-hello world");
  });

  fireEvent.click(getByText("add2"));
  await waitFor(() => {
    getByText("2");
  });

  fireEvent.click(getByText("subtract"));
  await waitFor(() => {
    getByText("1");
  });

  fireEvent.click(getByText("change"));
  await waitFor(() => {
    getByText("9");
  });

  fireEvent.click(getByText("change2"));
  await waitFor(() => {
    getByDisplayValue("fine");
    getByText("999");
  });

  fireEvent.change(getByPlaceholderText("请输入"), {
    target: {
      value: "okk",
    },
  });
  await waitFor(() => {
    getByDisplayValue("okk");
    getByText("999-okk");
    expect(store.text === "okk").toBeTruthy();
  });
});
