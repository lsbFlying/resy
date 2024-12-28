import React, { useState } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { PureComponentWithStore, createStore, Unsubscribe } from "../../src";
import { whatsType } from "../../src/utils";

/** Scenarios for testing the combination of class components and subscription functionality */
test("classConnect-VII", async () => {
  type Store = {
    count: number;
  };

  const store = createStore<Store>({
    count: 0,
  });

  let counter = 0;

  class Test extends PureComponentWithStore {

    store = this.connectStore(store);

    unsubscribe: Unsubscribe | null = null;

    componentDidMount() {
      this.unsubscribe = store.subscribe(({
        effectState, prevState, nextState,
      }) => {
        expect(effectState.count === nextState.count).toBeTruthy();
        expect(effectState.count === (prevState.count + 1)).toBeTruthy();
        counter += effectState.count!;
      }, ["count"]);
    }

    componentWillUnmount() {
      this.unsubscribe?.();
      expect(this !== null && this !== undefined).toBeTruthy();
      expect(whatsType(this) === "Object").toBeTruthy();
    }

    render() {
      const { count } = this.store;
      return (
        <>
          <p>count:{count}</p>
          <button onClick={() => {
            store.count++;
          }}>add</button>
        </>
      );
    }
  }

  function App() {
    const [show, setShow] = useState(true);
    return (
      <>
        {
          show
            ? <Test />
            : (
              <>
                <p>hello</p>
              </>
            )
        }
        <button onClick={() => setShow(prevState => !prevState)}>
          show-switch
        </button>
      </>
    );
  }

  const { getByText, } = render(<App />);

  fireEvent.click(getByText("add"));
  await waitFor(() => {
    getByText("count:1");
    expect(counter === 1).toBeTruthy();
  });

  fireEvent.click(getByText("show-switch"));
  await waitFor(() => {
    getByText("hello");
  });
});
