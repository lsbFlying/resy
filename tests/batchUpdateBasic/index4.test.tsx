import React, { useState } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";

/** Update method and batch update ( The effect of react's original update mechanism ) */
test("batchUpdateBasic-IV", async () => {
  let counter = 0;
  const App = () => {
    const [count, setCount] = useState(0);
    counter++;
    console.log("App", count);
    return (
      <>
        <p>{count}</p>
        <button onClick={() => {
          setCount(1);
          Promise.resolve().then(() => {
            setCount(2);
            setCount(3);
          });
          Promise.resolve().then(() => {
            setCount(4);
            setCount(5);
          });
          Promise.resolve().then(() => {
            setCount(6);
            setCount(7);
          });
        }}>countChange</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("countChange"));
  await waitFor(() => {
    getByText("7");
    console.log("countChange-counter", counter);
    // 🌟 Will be updated 7 times in react17
    // expect(counter === 8).toBeTruthy();
    // 🌟 Will be updated 2 times in react18
    expect(counter === 3).toBeTruthy();
  });
});
