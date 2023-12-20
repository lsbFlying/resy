import { expect, test } from "vitest";
import { createStore } from "../../src";

test("createStore-error-scene", async () => {
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
  expect(() => createStore({}, true)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, NaN)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, "")).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, "hello")).toThrowError();
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

  // @ts-ignore
  expect(() => createStore({}, { unmountRestore: 0 })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { unmountRestore: 1 })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { unmountRestore: null })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { unmountRestore: NaN })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { unmountRestore: "" })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { unmountRestore: "hello" })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { unmountRestore: [] })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { unmountRestore: Symbol("empty-symbol") })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { unmountRestore: new Set() })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { unmountRestore: new Map() })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { unmountRestore: new WeakSet() })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { unmountRestore: new WeakMap() })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { unmountRestore: new WeakRef() })).toThrowError();

  // @ts-ignore
  expect(() => createStore({}, { __useConciseStateMode__: 0 })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseStateMode__: 1 })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseStateMode__: null })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseStateMode__: NaN })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseStateMode__: "" })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseStateMode__: "hello" })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseStateMode__: [] })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseStateMode__: Symbol("empty-symbol") })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseStateMode__: new Set() })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseStateMode__: new Map() })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseStateMode__: new WeakSet() })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseStateMode__: new WeakMap() })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseStateMode__: new WeakRef() })).toThrowError();
  /** 测试初始化options入参报错 start */
});
