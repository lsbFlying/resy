import { expect, test } from "vitest";
import { createStore } from "../../src";

test("subscribe-error-scene", async () => {

  const store = createStore({ count: 0 });

  // @ts-ignore
  expect(() => store.subscribe(0)).toThrowError();
  // @ts-ignore
  expect(() => store.subscribe(1)).toThrowError();
  // @ts-ignore
  expect(() => store.subscribe("")).toThrowError();
  // @ts-ignore
  expect(() => store.subscribe("hello")).toThrowError();
  // @ts-ignore
  expect(() => store.subscribe(NaN)).toThrowError();
  // @ts-ignore
  expect(() => store.subscribe(undefined)).toThrowError();
  // @ts-ignore
  expect(() => store.subscribe(Symbol("not object"))).toThrowError();
  // @ts-ignore
  expect(() => store.subscribe(true)).toThrowError();
  // @ts-ignore
  expect(() => store.subscribe(false)).toThrowError();
  // @ts-ignore
  expect(() => store.subscribe(new Map())).toThrowError();
  // @ts-ignore
  expect(() => store.subscribe(new Set())).toThrowError();
  // @ts-ignore
  expect(() => store.subscribe(new WeakMap())).toThrowError();
  // @ts-ignore
  expect(() => store.subscribe(new WeakSet())).toThrowError();
  // @ts-ignore
  expect(() => store.subscribe([])).toThrowError();
  // @ts-ignore
  expect(() => store.subscribe(new WeakRef())).toThrowError();

  // @ts-ignore
  // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
  expect(() => store.subscribe(() => {}, 0)).toThrowError();
  // @ts-ignore
  // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
  expect(() => store.subscribe(() => {}, 1)).toThrowError();
  // @ts-ignore
  // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
  expect(() => store.subscribe(() => {}, "")).toThrowError();
  // @ts-ignore
  // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
  expect(() => store.subscribe(() => {}, "hello")).toThrowError();
  // @ts-ignore
  // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
  expect(() => store.subscribe(() => {}, NaN)).toThrowError();
  // @ts-ignore
  // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
  expect(() => store.subscribe(() => {}, Symbol("not object"))).toThrowError();
  // @ts-ignore
  // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
  expect(() => store.subscribe(() => {}, true)).toThrowError();
  // @ts-ignore
  // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
  expect(() => store.subscribe(() => {}, false)).toThrowError();
  // @ts-ignore
  // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
  expect(() => store.subscribe(() => {}, new Map())).toThrowError();
  // @ts-ignore
  // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
  expect(() => store.subscribe(() => {}, new Set())).toThrowError();
  // @ts-ignore
  // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
  expect(() => store.subscribe(() => {}, new WeakMap())).toThrowError();
  // @ts-ignore
  // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
  expect(() => store.subscribe(() => {}, new WeakSet())).toThrowError();
  // @ts-ignore
  // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
  expect(() => store.subscribe(() => {}, new WeakRef())).toThrowError();
});
