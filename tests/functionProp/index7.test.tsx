import React from "react";
import { test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { ComponentWithStore, createStore } from "../../src";

/**
 * The use of function properties
 * @description Test the scenario in which the function property is called directly
 */
test("functionProp-IV", async () => {
  type Store = {
    count: number;
    doubleCount(): number;
    word: string;
    statement(): string;
    name: string;
    fullName(): string;
  };

  const store = createStore<Store>({
    count: 0,
    doubleCount() {
      return this.count * 2;
    },
    word: "",
    statement() {
      return `${this.word}_world!`;
    },
    name: "",
    fullName() {
      return `${this.name}ShanBao`;
    }
  });

  class Count extends ComponentWithStore {
    store = this.connectStore(store);
    render() {
      // The Count and Text components mutually use each other's function properties,
      // which are fetched from this.store here. Essentially being state, they can therefore be correctly rendered.
      const { count, statement } = this.store;

      return (
        <>
          <p>count:{count}</p>
          <p>Count-statement:{statement()}</p>
          <button onClick={() => {
            store.count++;
          }}>countAdd</button>
        </>
      );
    }
  }

  class Text extends ComponentWithStore {
    store = this.connectStore(store);

    render() {
      const { word, doubleCount } = this.store;

      return (
        <>
          <p>word:{word}</p>
          <p>Text-doubleCount:{doubleCount()}</p>
          <button onClick={() => {
            store.word = "hello";
          }}>textChange</button>
        </>
      );
    }
  }

  class Name extends ComponentWithStore {
    store = this.connectStore(store);

    render() {
      const { name } = this.store;
      // If not accessed through this.store, the data used internally is considered as a mere data reference,
      // not state data, and cannot trigger a re-render effect.
      const { statement } = store;

      return (
        <>
          <p>name:{name}</p>
          <p>Name-statement:{statement()}</p>
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

  fireEvent.click(getByText("countAdd"));
  await waitFor(() => {
    getByText("count:1");
    getByText("Text-doubleCount:2");
  });

  fireEvent.click(getByText("textChange"));
  await waitFor(() => {
    getByText("word:hello");
    getByText("Count-statement:hello_world!");
    getByText("Name-statement:_world!");
  });
});
