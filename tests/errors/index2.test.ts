import { expect, test } from "vitest";
import { useStore } from "../../src";

test("useStore-error-scene", async () => {

  // @ts-ignore
  expect(() => useStore(0)).toThrowError();
  // @ts-ignore
  expect(() => useStore(1)).toThrowError();
  // @ts-ignore
  expect(() => useStore("")).toThrowError();
  // @ts-ignore
  expect(() => useStore("999")).toThrowError();
  // @ts-ignore
  expect(() => useStore({})).toThrowError();
  // @ts-ignore
  // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
  expect(() => useStore(() => {})).toThrowError();
  // @ts-ignore
  expect(() => useStore([])).toThrowError();
  // @ts-ignore
  expect(() => useStore(null)).toThrowError();
  // @ts-ignore
  expect(() => useStore(undefined)).toThrowError();
  // @ts-ignore
  expect(() => useStore(new Symbol())).toThrowError();
  // @ts-ignore
  expect(() => useStore(NaN)).toThrowError();
  // @ts-ignore
  expect(() => useStore(false)).toThrowError();
  // @ts-ignore
  expect(() => useStore(true)).toThrowError();
  // @ts-ignore
  expect(() => useStore(new Map())).toThrowError();
  // @ts-ignore
  expect(() => useStore(new Set())).toThrowError();
  // @ts-ignore
  expect(() => useStore(new WeakMap())).toThrowError();
  // @ts-ignore
  expect(() => useStore(new WeakSet())).toThrowError();
  // @ts-ignore
  expect(() => useStore(new WeakRef())).toThrowError();
});
