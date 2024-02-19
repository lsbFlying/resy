import { expect, test } from "vitest";
import { createStore } from "../../src";

test("setOptions-error-scene", async () => {

  const store = createStore();
  const { setOptions } = store;

  // @ts-ignore
  expect(() => setOptions(0)).toThrowError();
  // @ts-ignore
  expect(() => setOptions(1)).toThrowError();
  // @ts-ignore
  expect(() => setOptions("")).toThrowError();
  // @ts-ignore
  expect(() => setOptions("999")).toThrowError();
  // @ts-ignore
  // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
  expect(() => setOptions(() => {})).toThrowError();
  // @ts-ignore
  expect(() => setOptions([])).toThrowError();
  // @ts-ignore
  expect(() => setOptions(undefined)).toThrowError();
  // @ts-ignore
  expect(() => setOptions()).toThrowError();
  // @ts-ignore
  expect(() => setOptions(null)).toThrowError();
  // @ts-ignore
  expect(() => setOptions({})).toThrowError();
  // @ts-ignore
  expect(() => setOptions(Symbol())).toThrowError();
  // @ts-ignore
  expect(() => setOptions(NaN)).toThrowError();
  // @ts-ignore
  expect(() => setOptions(false)).toThrowError();
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
  expect(() => setOptions(new WeakRef({}))).toThrowError();
  // @ts-ignore
  expect(() => setOptions(new RegExp())).toThrowError();
  // @ts-ignore
  expect(() => setOptions(new Date())).toThrowError();
  // @ts-ignore
  expect(() => setOptions(BigInt("8374657843678436"))).toThrowError();
  // @ts-ignore
  expect(() => setOptions(window)).toThrowError();

  // @ts-ignore
  expect(() => setOptions({ unmountRestore: 0 })).toThrowError();
  // @ts-ignore
  expect(() => setOptions({ unmountRestore: 1 })).toThrowError();
  // @ts-ignore
  expect(() => setOptions({ unmountRestore: "" })).toThrowError();
  // @ts-ignore
  expect(() => setOptions({ unmountRestore: "999" })).toThrowError();
  // @ts-ignore
  // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
  expect(() => setOptions({ unmountRestore: () => {} })).toThrowError();
  // @ts-ignore
  expect(() => setOptions({ unmountRestore: [] })).toThrowError();
  // @ts-ignore
  expect(() => setOptions({ unmountRestore: undefined })).toThrowError();
  // @ts-ignore
  expect(() => setOptions({ unmountRestore: null })).toThrowError();
  // @ts-ignore
  expect(() => setOptions({ unmountRestore: {} })).toThrowError();
  // @ts-ignore
  expect(() => setOptions({ unmountRestore: Symbol() })).toThrowError();
  // @ts-ignore
  expect(() => setOptions({ unmountRestore: NaN })).toThrowError();
  // @ts-ignore
  expect(() => setOptions({ unmountRestore: new Map() })).toThrowError();
  // @ts-ignore
  expect(() => setOptions({ unmountRestore: new Set() })).toThrowError();
  // @ts-ignore
  expect(() => setOptions({ unmountRestore: new WeakMap() })).toThrowError();
  // @ts-ignore
  expect(() => setOptions({ unmountRestore: new WeakSet() })).toThrowError();
  // @ts-ignore
  expect(() => setOptions({ unmountRestore: new WeakRef({}) })).toThrowError();
  // @ts-ignore
  expect(() => setOptions({ unmountRestore: new RegExp() })).toThrowError();
  // @ts-ignore
  expect(() => setOptions({ unmountRestore: new Date() })).toThrowError();
  // @ts-ignore
  expect(() => setOptions({ unmountRestore: BigInt("8374657843678436") })).toThrowError();
  // @ts-ignore
  expect(() => setOptions({ unmountRestore: window })).toThrowError();
});
