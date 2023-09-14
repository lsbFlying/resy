import React from "react";
import { test, expect } from "vitest";
import { createStore, useStore } from "../src";
import { fireEvent, render } from "@testing-library/react";

test("resy-syncUpdate", async () => {
  const store = createStore({ text: "qwe", count: 0 });
  let textRes = "";
  const App = () => {
    const { text, count } = useStore(store);

    function inputChange(event: React.ChangeEvent<HTMLInputElement>) {
      store.syncUpdate({
        text: event.target.value,
      });
      console.log("etv", event.target.value, "store.text", store.text);
      textRes = store.text;
    }

    return (
      <div>
        <div>
          <input placeholder="请输入" value={text} onChange={inputChange} />
        </div>
        <div>
          <p>count:{count}</p>
          <div>
            <button onClick={() => {
              store.syncUpdate(() => ({
                count: count + 1,
                text: `hello-${count}`,
              }));
            }}>btn</button>
          </div>
          <button onClick={() => {
            store.syncUpdate(prevState => {
              console.log("prevState", prevState);  // prevState { text: 'qwe', count: 0 }
              if (prevState.count > 0) {
                return {
                  count: 999,
                };
              }
              return {
                count: -999,
              };
            });
          }}>btn-2</button>
          <button onClick={() => {
            store.syncUpdate(() => null);
          }}>btn-3</button>
          <button onClick={() => {
            store.syncUpdate(null);
          }}>btn-4</button>
        </div>
      </div>
    );
  };

  const { getByPlaceholderText, getByText } = render(<App />);

  fireEvent.change(getByPlaceholderText("请输入"), {
    target: {
      value: "ASDZXC",
    },
  });
  expect(textRes === store.text).toBeTruthy();
  expect("ASDZXC" === store.text).toBeTruthy();

  fireEvent.click(getByText("btn"));
  getByText("count:1");
  expect("hello-0" === store.text).toBeTruthy();

  fireEvent.click(getByText("btn-2"));
  getByText("count:-999");

  fireEvent.click(getByText("btn-3"));
  getByText("count:-999");

  fireEvent.click(getByText("btn-4"));
  getByText("count:-999");

  // @ts-ignore
  expect(() => store.syncUpdate(0)).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate("")).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(NaN)).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(Symbol("not object"))).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate([])).toThrowError();
  // @ts-ignore
  // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
  expect(() => store.syncUpdate(() => {})).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(true)).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(false)).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(new Map())).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(new Set())).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(undefined)).toThrowError();
});
