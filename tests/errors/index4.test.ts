import { expect, test } from "vitest";
import { createStore } from "../../src";

test("setOptions-error-scene-I", async () => {

  const store = createStore({ count: 0 });

  /** 测试store类型报错 start */
  // @ts-ignore
  expect(() => store.setState(0)).toThrowError();
  // @ts-ignore
  expect(() => store.setState("")).toThrowError();
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
  expect(() => store.setState(new WeakRef())).toThrowError();
  /** 测试store类型报错 end */
});
