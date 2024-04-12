import React, { useEffect } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { useConciseState } from "../../src";

/**
 * The use of function properties
 * @description 1、Validate that function properties, just like regular data properties,
 * can serve as state for updating component rendering as long as they are accessed through useConciseState.
 * 2、Validate that function properties do not have the capacity to update components as state
 * if they are accessed directly through the store instead of being fetched from useConciseState.
 */
test("functionProp-useConciseState", async () => {
  type State = {
    count: number;
    testFn?(): void;
    testFn2?(): void;
    testFn3(): string;
    testFn4(): string;
  };

  const App = () => {
    const { count, store, testFn, testFn3, testFn4 } = useConciseState<State>({
      count: 0,
      testFn3() {
        return `${this.count}_testFn3`;
      },
      testFn4() {
        return `${this.testFn3()}_testFn4`;
      }
    });
    const { testFn2 } = store;

    useEffect(() => {
      // This is not recommended, but the correct execution and return of the results are still supported,
      // and an error will be reported in the console.
      const value = testFn3();
      expect(value === "0_testFn3").toBeTruthy();
    }, []);

    useEffect(() => {
      // This is not recommended, but the correct execution and return of the results are still supported,
      // and an error will be reported in the console.
      const value = testFn4();
      expect(value === "0_testFn3_testFn4").toBeTruthy();
    }, []);

    return (
      <>
        <p>{count}</p>
        <p>{testFn ? "testFnExist" : "testFnNull"}</p>
        <p>{testFn2 ? "testFn2Exist" : "testFn2Null"}</p>
        <button onClick={() => {
          store.testFn = () => {
            store.count++;
          };
        }}>genTestFn</button>
        <button onClick={() => {
          store.testFn!();
        }}>callTestFn</button>
        <button onClick={() => {
          store.testFn = undefined;
        }}>delTestFn</button>

        <button onClick={() => {
          store.testFn2 = () => {
            store.count--;
          };
        }}>genTestFn2</button>
        <button onClick={() => {
          store.testFn2!();
        }}>callTestFn2</button>
        <button onClick={() => {
          store.testFn2!();
        }}>delTestFn2</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("genTestFn"));
  await waitFor(() => {
    getByText("testFnExist");
  });

  fireEvent.click(getByText("callTestFn"));
  await waitFor(() => {
    getByText("1");
  });

  fireEvent.click(getByText("delTestFn"));
  await waitFor(() => {
    getByText("testFnNull");
  });

  fireEvent.click(getByText("genTestFn2"));
  await waitFor(() => {
    getByText("testFn2Null");
  });

  fireEvent.click(getByText("callTestFn2"));
  await waitFor(() => {
    getByText("0");
  });

  fireEvent.click(getByText("delTestFn"));
  await waitFor(() => {
    getByText("testFn2Exist");
  });
});
