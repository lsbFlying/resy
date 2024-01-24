import { expect, test } from "vitest";
import { whatsType } from "../../src/utils";

/** Test whatsType method */
test("utils", () => {
  const value0 = 0,
    value1 = 1,
    value2 = "",
    value3 = "ok",
    value4 = true,
    value5 = false,
    value6 = undefined,
    value7 = null,
    value8 = Symbol("value"),
    value9 = {},
    value10 = { count: 1 },
    value11 = () => { console.log("value9-fn"); },
    value12 = function () { console.log("value10-fn"); },
    value13: any[] = [],
    value14 = [1, 2],
    value15 = new Date(),
    value16 = new Date("2024-01-24"),
    value17 = /\s*/g,
    value18 = new RegExp("\\s", "g"),
    value19 = new Map(),
    value20 = new Map().set("count", 19),
    value21 = new WeakMap(),
    value22 = new WeakMap().set({ count: 19 }, "counter-19"),
    value23 = new Set<any>(),
    value24 = new Set<number>().add(19),
    value25 = new WeakSet(),
    value26 = new WeakSet().add({ count: 19 }),
    value27 = new WeakRef({}),
    value28 = new WeakRef({ count: 19 }),
    value29 = BigInt("8374654835683476853476"),
    value30 = 8374654835683476853476n;

  expect(whatsType(value0) === "Number").toBeTruthy();
  expect(whatsType(value1) === "Number").toBeTruthy();
  expect(whatsType(value2) === "String").toBeTruthy();
  expect(whatsType(value3) === "String").toBeTruthy();
  expect(whatsType(value4) === "Boolean").toBeTruthy();
  expect(whatsType(value5) === "Boolean").toBeTruthy();
  expect(whatsType(value6) === "Undefined").toBeTruthy();
  expect(whatsType(value7) === "Null").toBeTruthy();
  expect(whatsType(value8) === "Symbol").toBeTruthy();
  expect(whatsType(value9) === "Object").toBeTruthy();
  expect(whatsType(value10) === "Object").toBeTruthy();
  expect(whatsType(value11) === "Function").toBeTruthy();
  expect(whatsType(value12) === "Function").toBeTruthy();
  expect(whatsType(value13) === "Array").toBeTruthy();
  expect(whatsType(value14) === "Array").toBeTruthy();
  expect(whatsType(value15) === "Date").toBeTruthy();
  expect(whatsType(value16) === "Date").toBeTruthy();
  expect(whatsType(value17) === "RegExp").toBeTruthy();
  expect(whatsType(value18) === "RegExp").toBeTruthy();
  expect(whatsType(value19) === "Map").toBeTruthy();
  expect(whatsType(value20) === "Map").toBeTruthy();
  expect(whatsType(value21) === "WeakMap").toBeTruthy();
  expect(whatsType(value22) === "WeakMap").toBeTruthy();
  expect(whatsType(value23) === "Set").toBeTruthy();
  expect(whatsType(value24) === "Set").toBeTruthy();
  expect(whatsType(value25) === "WeakSet").toBeTruthy();
  expect(whatsType(value26) === "WeakSet").toBeTruthy();
  expect(whatsType(value27) === "WeakRef").toBeTruthy();
  expect(whatsType(value28) === "WeakRef").toBeTruthy();
  expect(whatsType(value29) === "BigInt").toBeTruthy();
  expect(whatsType(value30) === "BigInt").toBeTruthy();
  // 🌟 The test execution here is slightly different from the test execution result of the browser,
  // and it should be related to the small changes in the global object of vitest's test environment.
  // console.log(typeof window, window.__proto__, Window.prototype, whatsType(window), whatsType(global));
  // expect(whatsType(window) === "Global").toBeTruthy();
  // expect(whatsType(window) === "Window").toBeTruthy();
  // The global object global in node, but this is not necessarily a global object in a simulated node environment
  // expect(whatsType(global) === "Global").toBeTruthy();
});
