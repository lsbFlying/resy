import { expect, test } from "vitest";
import { createStore } from "../../src";
import type { InnerStoreOptions } from "../../src/store/types";

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
  expect(() => createStore(new WeakRef({}))).toThrowError();
  // @ts-ignore
  expect(() => createStore(new Date())).toThrowError();
  // @ts-ignore
  expect(() => createStore(new RegExp())).toThrowError();
  // @ts-ignore
  expect(() => createStore(BigInt("8723648264864355"))).toThrowError();
  // @ts-ignore
  expect(() => createStore(window)).toThrowError();

  // @ts-ignore
  expect(() => createStore(() => 0)).toThrowError();
  // @ts-ignore
  expect(() => createStore(() => 1)).toThrowError();
  // @ts-ignore
  expect(() => createStore(() => null)).toThrowError();
  // @ts-ignore
  expect(() => createStore(() => false)).toThrowError();
  // @ts-ignore
  expect(() => createStore(() => NaN)).toThrowError();
  // @ts-ignore
  expect(() => createStore(() => "")).toThrowError();
  // @ts-ignore
  expect(() => createStore(() => [])).toThrowError();
  // @ts-ignore
  expect(() => createStore(() => Symbol("empty-symbol"))).toThrowError();
  // @ts-ignore
  expect(() => createStore(() => new Set())).toThrowError();
  // @ts-ignore
  expect(() => createStore(() => new Map())).toThrowError();
  // @ts-ignore
  expect(() => createStore(() => new WeakSet())).toThrowError();
  // @ts-ignore
  expect(() => createStore(() => new WeakMap())).toThrowError();
  // @ts-ignore
  expect(() => createStore(() => new WeakRef({}))).toThrowError();
  // @ts-ignore
  expect(() => createStore(() => new Date())).toThrowError();
  // @ts-ignore
  expect(() => createStore(() => new RegExp())).toThrowError();
  // @ts-ignore
  expect(() => createStore(() => BigInt("8723648264864355"))).toThrowError();
  // @ts-ignore
  expect(() => createStore(() => window)).toThrowError();

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
  expect(() => createStore({}, new WeakRef({}))).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, new Date())).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, new RegExp())).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, BigInt("8723648264864355"))).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, window)).toThrowError();

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
  expect(() => createStore({}, { unmountRestore: new WeakRef({}) })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { unmountRestore: new Date() })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { unmountRestore: new RegExp() })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { unmountRestore: BigInt("8723648264864355") })).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { unmountRestore: window })).toThrowError();

  // @ts-ignore
  expect(() => createStore({}, { __useConciseState__: 0 } as InnerStoreOptions)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseState__: 1 } as InnerStoreOptions)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseState__: null } as InnerStoreOptions)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseState__: NaN } as InnerStoreOptions)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseState__: "" } as InnerStoreOptions)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseState__: "hello" } as InnerStoreOptions)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseState__: [] } as InnerStoreOptions)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseState__: Symbol("empty-symbol") } as InnerStoreOptions)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseState__: new Set() } as InnerStoreOptions)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseState__: new Map() } as InnerStoreOptions)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseState__: new WeakSet() } as InnerStoreOptions)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseState__: new WeakMap() } as InnerStoreOptions)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseState__: new WeakRef({}) } as InnerStoreOptions)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseState__: new Date() } as InnerStoreOptions)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseState__: new RegExp() } as InnerStoreOptions)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseState__: BigInt("8723648264864355") } as InnerStoreOptions)).toThrowError();
  // @ts-ignore
  expect(() => createStore({}, { __useConciseState__: window } as InnerStoreOptions)).toThrowError();
});
