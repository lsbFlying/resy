import React from "react";
import { it, expect } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { resy } from "./index";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

it("resy", () => {
  const store = resy({
    count: 0,
    inc: () => store.count++,
  });

  const App = () => {
    const { count, inc } = store;
    return (
      <>
        <p>{count}</p>
        <button onClick={inc}>add1</button>
        <button onClick={() => store.count++}>add2</button>
        <button onClick={() => (store.count = +count)}>add3</button>
      </>
    );
  };

  render(<App />);
  const error = (fn: () => void) => expect(fn).toThrow();
  const click = (btn: string) => fireEvent.click(screen.getByText(btn));

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  error(() => resy());
  click("add1");
  click("add2");
  click("add3");
});
