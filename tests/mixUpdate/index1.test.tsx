import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/**
 * Mixed use of update methods
 * @description Verify batch update processing for several update methods
 */
test("mixUpdate-I", async () => {
  const store = createStore({
    count: 0,
  });

  let counter = 0;

  const mixMethods1 = ["direct", "setState", "syncUpdate"];
  const mixMethods2 = ["direct", "syncUpdate", "setState"];
  const mixMethods3 = ["setState", "direct", "syncUpdate"];
  const mixMethods4 = ["setState", "syncUpdate", "direct"];
  const mixMethods5 = ["syncUpdate", "direct", "setState"];
  const mixMethods6 = ["syncUpdate", "setState", "direct"];

  function matchedUpdate(updateName: string) {
    switch (updateName) {
      case "direct":
        store.count = Math.round(Math.random() * 10000);
        break;
      case "setState":
        store.setState({
          count: Math.round(Math.random() * 10000),
        });
        break;
      case "syncUpdate":
        store.syncUpdate({
          count: Math.round(Math.random() * 10000),
        });
        break;
      default:
        break;
    }
  }

  const App = () => {
    const { count } = useStore(store);
    counter++;
    console.log("App", count);
    return (
      <>
        <p>{count}</p>
        <button onClick={() => {
          mixMethods1.forEach(updateName => {
            matchedUpdate(updateName);
          });
        }}>add1</button>
        <button onClick={() => {
          mixMethods2.forEach(updateName => {
            matchedUpdate(updateName);
          });
        }}>add2</button>
        <button onClick={() => {
          mixMethods3.forEach(updateName => {
            matchedUpdate(updateName);
          });
        }}>add3</button>
        <button onClick={() => {
          mixMethods4.forEach(updateName => {
            matchedUpdate(updateName);
          });
        }}>add4</button>
        <button onClick={() => {
          mixMethods5.forEach(updateName => {
            matchedUpdate(updateName);
          });
        }}>add5</button>
        <button onClick={() => {
          mixMethods6.forEach(updateName => {
            matchedUpdate(updateName);
          });
        }}>add6</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("add1"));
  await waitFor(() => {
    console.log(counter);
    expect(counter === 2).toBeTruthy();
  });

  fireEvent.click(getByText("add2"));
  await waitFor(() => {
    console.log(counter);
    expect(counter === 3).toBeTruthy();
  });

  fireEvent.click(getByText("add3"));
  await waitFor(() => {
    console.log(counter);
    expect(counter === 4).toBeTruthy();
  });

  fireEvent.click(getByText("add4"));
  await waitFor(() => {
    console.log(counter);
    expect(counter === 5).toBeTruthy();
  });

  fireEvent.click(getByText("add5"));
  await waitFor(() => {
    console.log(counter);
    expect(counter === 6).toBeTruthy();
  });

  fireEvent.click(getByText("add6"));
  await waitFor(() => {
    console.log(counter);
    expect(counter === 7).toBeTruthy();
  });
});
