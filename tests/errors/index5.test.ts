import { expect, test } from "vitest";
import { createStore } from "../../src";

test("restore-error-scene", async () => {

  const store = createStore({ count: 0 });

  // @ts-ignore
  expect(() => store.restore(0)).toThrowError();
  // @ts-ignore
  expect(() => store.restore(1)).toThrowError();
  // @ts-ignore
  expect(() => store.restore("")).toThrowError();
  // @ts-ignore
  expect(() => store.restore("hello")).toThrowError();
  // @ts-ignore
  expect(() => store.restore(NaN)).toThrowError();
  // @ts-ignore
  expect(() => store.restore(Symbol("not object"))).toThrowError();
  // @ts-ignore
  expect(() => store.restore(true)).toThrowError();
  // @ts-ignore
  expect(() => store.restore(false)).toThrowError();
  // @ts-ignore
  expect(() => store.restore(new Map())).toThrowError();
  // @ts-ignore
  expect(() => store.restore(new Set())).toThrowError();
  // @ts-ignore
  expect(() => store.restore(new WeakMap())).toThrowError();
  // @ts-ignore
  expect(() => store.restore(new WeakSet())).toThrowError();
  // @ts-ignore
  expect(() => store.restore([])).toThrowError();
  // @ts-ignore
  expect(() => store.restore(new WeakRef({}))).toThrowError();
  // @ts-ignore
  expect(() => store.restore(new RegExp())).toThrowError();
  // @ts-ignore
  expect(() => store.restore(new Date())).toThrowError();
  // @ts-ignore
  expect(() => store.restore(BigInt("837456834658437"))).toThrowError();
  // @ts-ignore
  expect(() => store.restore(window)).toThrowError();
});
