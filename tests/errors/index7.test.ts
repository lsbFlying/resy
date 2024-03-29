import { expect, test } from "vitest";
import { createStore } from "../../src";

test("syncUpdate-error-scene", async () => {

  const store = createStore({ count: 0 });

  // @ts-ignore
  expect(() => store.syncUpdate(0)).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(1)).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate("")).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate("999")).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(NaN)).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(undefined)).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(Symbol("not object"))).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(true)).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(false)).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(new Map())).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(new Set())).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(new WeakMap())).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(new WeakSet())).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate([])).toThrowError();
  // @ts-ignore
  // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
  expect(() => store.syncUpdate(() => {})).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(new WeakRef({}))).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(new RegExp())).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(new Date())).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(BigInt("827348436586436"))).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate(window)).toThrowError();

  // @ts-ignore
  expect(() => store.syncUpdate({}, 0)).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate({}, 1)).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate({}, "")).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate({}, "9")).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate({}, true)).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate({}, false)).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate({}, null)).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate({}, [])).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate({}, NaN)).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate({}, new Map())).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate({}, new Set())).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate({}, new WeakMap())).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate({}, new WeakSet())).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate({}, new WeakRef({}))).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate({}, new RegExp())).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate({}, new Date())).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate({}, BigInt("83475683456843658"))).toThrowError();
  // @ts-ignore
  expect(() => store.syncUpdate({}, window)).toThrowError();
});
