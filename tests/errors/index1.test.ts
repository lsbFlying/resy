import { expect, test } from "vitest";
import { createStore } from "../../src";

test("createStore-error-scene-I", async () => {
  /** 测试初始化入参报错 start */
  // @ts-ignore
  expect(() => createStore(0)).toThrowError();
  // @ts-ignore
  expect(() => createStore(1)).toThrowError();
  // @ts-ignore
  expect(() => createStore(null)).toThrowError();
  // @ts-ignore
  expect(() => createStore(false)).toThrowError();
  // @ts-ignore
  expect(() => createStore(NaN)).toThrowError();
  // @ts-ignore
  expect(() => createStore("")).toThrowError();
  // @ts-ignore
  expect(() => createStore([])).toThrowError();
  // @ts-ignore
  expect(() => createStore(Symbol("empty-symbol"))).toThrowError();
  // @ts-ignore
  expect(() => createStore(new Set())).toThrowError();
  // @ts-ignore
  expect(() => createStore(new Map())).toThrowError();
  // @ts-ignore
  expect(() => createStore(new WeakSet())).toThrowError();
  // @ts-ignore
  expect(() => createStore(new WeakMap())).toThrowError();
  // @ts-ignore
  expect(() => createStore(new WeakRef())).toThrowError();
  /** 测试初始化入参报错 end */

  /** 测试初始化options入参报错 start */
  // @ts-ignore
  expect(() => createStore({}, 0)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, 1)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, null)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, false)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, NaN)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, "")).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, [])).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, Symbol("empty-symbol"))).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, new Set())).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, new Map())).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, new WeakSet())).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, new WeakMap())).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, new WeakRef())).toThrowError();
  /** 测试初始化options入参报错 end */
});
