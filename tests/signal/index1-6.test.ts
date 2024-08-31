import { expect, test } from "vitest";
import { createSignals } from "../../src";

test("createSignals-error-scene", async () => {
  // @ts-ignore
  expect(() => createSignals(0)).toThrowError();
  // @ts-ignore
  expect(() => createSignals(1)).toThrowError();
  // @ts-ignore
  expect(() => createSignals(null)).toThrowError();
  // @ts-ignore
  expect(() => createSignals(false)).toThrowError();
  // @ts-ignore
  expect(() => createSignals(NaN)).toThrowError();
  // @ts-ignore
  expect(() => createSignals("")).toThrowError();
  // @ts-ignore
  expect(() => createSignals([])).toThrowError();
  // @ts-ignore
  expect(() => createSignals(Symbol("empty-symbol"))).toThrowError();
  // @ts-ignore
  expect(() => createSignals(new Set())).toThrowError();
  // @ts-ignore
  expect(() => createSignals(new Map())).toThrowError();
  // @ts-ignore
  expect(() => createSignals(new WeakSet())).toThrowError();
  // @ts-ignore
  expect(() => createSignals(new WeakMap())).toThrowError();
  // @ts-ignore
  expect(() => createSignals(new WeakRef({}))).toThrowError();
  // @ts-ignore
  expect(() => createSignals(new Date())).toThrowError();
  // @ts-ignore
  expect(() => createSignals(new RegExp())).toThrowError();
  // @ts-ignore
  expect(() => createSignals(BigInt("8723648264864355"))).toThrowError();
  // @ts-ignore
  expect(() => createSignals(window)).toThrowError();

  // @ts-ignore
  expect(() => createSignals(() => 0)).toThrowError();
  // @ts-ignore
  expect(() => createSignals(() => 1)).toThrowError();
  // @ts-ignore
  expect(() => createSignals(() => null)).toThrowError();
  // @ts-ignore
  expect(() => createSignals(() => false)).toThrowError();
  // @ts-ignore
  expect(() => createSignals(() => NaN)).toThrowError();
  // @ts-ignore
  expect(() => createSignals(() => "")).toThrowError();
  // @ts-ignore
  expect(() => createSignals(() => [])).toThrowError();
  // @ts-ignore
  expect(() => createSignals(() => Symbol("empty-symbol"))).toThrowError();
  // @ts-ignore
  expect(() => createSignals(() => new Set())).toThrowError();
  // @ts-ignore
  expect(() => createSignals(() => new Map())).toThrowError();
  // @ts-ignore
  expect(() => createSignals(() => new WeakSet())).toThrowError();
  // @ts-ignore
  expect(() => createSignals(() => new WeakMap())).toThrowError();
  // @ts-ignore
  expect(() => createSignals(() => new WeakRef({}))).toThrowError();
  // @ts-ignore
  expect(() => createSignals(() => new Date())).toThrowError();
  // @ts-ignore
  expect(() => createSignals(() => new RegExp())).toThrowError();
  // @ts-ignore
  expect(() => createSignals(() => BigInt("8723648264864355"))).toThrowError();
  // @ts-ignore
  expect(() => createSignals(() => window)).toThrowError();

  // @ts-ignore
  expect(() => createSignals(0)).toThrowError();
  // @ts-ignore
  expect(() => createSignals(1)).toThrowError();
  // @ts-ignore
  expect(() => createSignals(null)).toThrowError();
  // @ts-ignore
  expect(() => createSignals(false)).toThrowError();
  // @ts-ignore
  expect(() => createSignals(NaN)).toThrowError();
  // @ts-ignore
  expect(() => createSignals("")).toThrowError();
  // @ts-ignore
  expect(() => createSignals([])).toThrowError();
  // @ts-ignore
  expect(() => createSignals(Symbol("empty-symbol"))).toThrowError();
  // @ts-ignore
  expect(() => createSignals(new Set())).toThrowError();
  // @ts-ignore
  expect(() => createSignals(new Map())).toThrowError();
  // @ts-ignore
  expect(() => createSignals(new WeakSet())).toThrowError();
  // @ts-ignore
  expect(() => createSignals(new WeakMap())).toThrowError();
  // @ts-ignore
  expect(() => createSignals(new WeakRef({}))).toThrowError();
  // @ts-ignore
  expect(() => createSignals(new Date())).toThrowError();
  // @ts-ignore
  expect(() => createSignals(new RegExp())).toThrowError();
  // @ts-ignore
  expect(() => createSignals(BigInt("8723648264864355"))).toThrowError();
  // @ts-ignore
  expect(() => createSignals(window)).toThrowError();
});
