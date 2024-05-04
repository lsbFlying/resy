import React from "react";
import { test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { ComponentWithStore, createStore } from "../../src";

/** Function returns rendering */
test("fnReturnsRender-III", async () => {
  type Store = {
    count: number;
    doubleCount(): number;
    text: string;
    getTextPro(): string;
    firstName: string;
    fullName(): string;
  };

  const store = createStore<Store>({
    count: 0,
    doubleCount() {
      const { count } = this.useStore();
      return count * 2;
    },
    text: "ok",
    getTextPro() {
      const { text } = this.useStore();
      return `${text}-world`;
    },
    firstName: "Bao",
    fullName() {
      return `Liu${this.firstName}`;
    },
  });

  class Count extends ComponentWithStore {
    store = this.connectStore(store);

    render() {
      const { doubleCount } = this.store;
      return (
        <>
          <p>doubleCount:{doubleCount()}</p>
          <button onClick={() => {
            store.count++;
          }}>count-change</button>
        </>
      );
    }
  }

  class Text extends ComponentWithStore {
    store = this.connectStore(store);

    render() {
      // Unlike the test files for index1 and index2,
      // class components still need to obtain data references from the store connected via `connectStore`.
      const { getTextPro } = this.store;
      return (
        <>
          <p>{getTextPro()}</p>
          <button onClick={() => {
            store.text = "hello";
          }}>text-change</button>
        </>
      );
    }
  }

  class Name extends ComponentWithStore {
    store = this.connectStore(store);

    render() {
      const { firstName, fullName } = this.store;
      return (
        <>
          <p>firstName:{firstName}</p>
          <p>fullName:{fullName()}</p>
          <button onClick={() => {
            store.firstName = "ShanBao";
          }}>name-change</button>
        </>
      );
    }
  }

  const App = () => (
    <>
      <Count />
      <Text />
      <Name />
    </>
  );

  const { getByText } = render(<App />);

  fireEvent.click(getByText("count-change"));
  await waitFor(() => {
    getByText("doubleCount:2");
  });

  fireEvent.click(getByText("text-change"));
  await waitFor(() => {
    getByText("hello-world");
  });

  fireEvent.click(getByText("name-change"));
  await waitFor(() => {
    getByText("fullName:LiuShanBao");
  });
});
