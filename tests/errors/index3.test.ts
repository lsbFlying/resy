import { expect, test } from "vitest";
import { createStore } from "../../src";

test("setOptions-error-scene-I", async () => {

  const store = createStore();
  const { setOptions } = store;

  /** 测试store类型报错 start */
  // @ts-ignore
  expect(() => setOptions(123)).toThrowError();
  // @ts-ignore
  expect(() => setOptions("123")).toThrowError();
  // @ts-ignore
  // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
  expect(() => setOptions(() => {})).toThrowError();
  // @ts-ignore
  expect(() => setOptions([])).toThrowError();
  // @ts-ignore
  expect(() => setOptions(null)).toThrowError();
  // @ts-ignore
  expect(() => setOptions(new Symbol())).toThrowError();
  // @ts-ignore
  expect(() => setOptions(NaN)).toThrowError();
  // @ts-ignore
  expect(() => setOptions(true)).toThrowError();
  // @ts-ignore
  expect(() => setOptions(new Map())).toThrowError();
  // @ts-ignore
  expect(() => setOptions(new Set())).toThrowError();
  // @ts-ignore
  expect(() => setOptions(new WeakMap())).toThrowError();
  // @ts-ignore
  expect(() => setOptions(new WeakSet())).toThrowError();
  // @ts-ignore
  expect(() => setOptions(new WeakRef())).toThrowError();
  /** 测试store类型报错 end */
});
