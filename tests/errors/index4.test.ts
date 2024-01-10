import { expect, test } from "vitest";
import { createStore } from "../../src";

test("setState-error-scene", async () => {

  const store = createStore({ count: 0 });

  // @ts-ignore
  expect(() => store.setState(0)).toThrowError();
  // @ts-ignore
  expect(() => store.setState(1)).toThrowError();
  // @ts-ignore
  expect(() => store.setState("")).toThrowError();
  // @ts-ignore
  expect(() => store.setState("999")).toThrowError();
  // @ts-ignore
  expect(() => store.setState(NaN)).toThrowError();
  // @ts-ignore
  expect(() => store.setState(undefined)).toThrowError();
  // @ts-ignore
  expect(() => store.setState(Symbol("not object"))).toThrowError();
  // @ts-ignore
  expect(() => store.setState(true)).toThrowError();
  // @ts-ignore
  expect(() => store.setState(false)).toThrowError();
  // @ts-ignore
  expect(() => store.setState(new Map())).toThrowError();
  // @ts-ignore
  expect(() => store.setState(new Set())).toThrowError();
  // @ts-ignore
  expect(() => store.setState(new WeakMap())).toThrowError();
  // @ts-ignore
  expect(() => store.setState(new WeakSet())).toThrowError();
  // @ts-ignore
  expect(() => store.setState([])).toThrowError();
  // @ts-ignore
  // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
  expect(() => store.setState(() => {})).toThrowError();
  // @ts-ignore
  expect(() => store.setState(new WeakRef({}))).toThrowError();

  // @ts-ignore
  expect(() => store.setState({}, 0)).toThrowError();
  // @ts-ignore
  expect(() => store.setState({}, 1)).toThrowError();
  // @ts-ignore
  expect(() => store.setState({}, "")).toThrowError();
  // @ts-ignore
  expect(() => store.setState({}, "9")).toThrowError();
  // @ts-ignore
  expect(() => store.setState({}, true)).toThrowError();
  // @ts-ignore
  expect(() => store.setState({}, false)).toThrowError();
  // @ts-ignore
  expect(() => store.setState({}, null)).toThrowError();
  // @ts-ignore
  expect(() => store.setState({}, NaN)).toThrowError();
  // @ts-ignore
  expect(() => store.setState({}, [])).toThrowError();
  // @ts-ignore
  expect(() => store.setState({}, new Map())).toThrowError();
  // @ts-ignore
  expect(() => store.setState({}, new Set())).toThrowError();
  // @ts-ignore
  expect(() => store.setState({}, new WeakMap())).toThrowError();
  // @ts-ignore
  expect(() => store.setState({}, new WeakSet())).toThrowError();
  // @ts-ignore
  expect(() => store.setState({}, new WeakRef({}))).toThrowError();
});
