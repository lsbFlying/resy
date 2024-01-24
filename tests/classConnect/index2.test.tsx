import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { ComponentWithStore, createStore } from "../../src";

/** Basic usage of class components */
test("classConnect-II", async () => {
  type StoreType = {
    text: string;
  };

  const store = createStore<StoreType>({
    text: "hello",
  });

  class App extends ComponentWithStore {

    store = this.connectStore(store);

    componentDidMount() {
      const unsub = store.subscribe(({ effectState }) => {
        unsub();
        if (effectState.text === "ok") {
          store.text = "fine";
        }
      }, ["text"]);
    }

    render() {
      const { text } = this.store;
      return (
        <>
          <p>{text}</p>
          <button onClick={() => {
            store.text = "ok";
          }}>change</button>
          <button onClick={() => {
            store.restore(nextState => {
              console.log(nextState);
            });
          }}>restore</button>
        </>
      );
    }
  }

  const { getByText } = render(<App />);

  fireEvent.click(getByText("change"));
  await waitFor(() => {
    getByText("fine");
  });

  fireEvent.click(getByText("restore"));
  await waitFor(() => {
    getByText("hello");
    expect(store.text === "hello");
  });
});
