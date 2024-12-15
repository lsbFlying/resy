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
    value30 = 8374654835683476853476n,
    value31 = new Promise(function(resolve) {
      resolve("success");
    }),
    value32 = new FormData(),
    value33 = new Blob(),
    value34 = new File(["Hello"], "hello.txt", { type: "text/plain" }),
    value35 = new Error("Something went wrong"),
    value36 = new CustomEvent("my-event", { detail: { some: "data" } }),
    value37 = localStorage,
    value38 = sessionStorage,
    value39 = new WebSocket("ws://localhost:3000"),
    value40 = new ArrayBuffer(16),
    value41 = new DataView(value40),
    value42 = new Uint8Array(1024),
    value43 = new Int8Array(1024),
    value44 = new Uint8ClampedArray(1024),
    value45 = new Int16Array(1024),
    value46 = new Uint16Array(1024),
    value47 = new Int32Array(1024),
    value48 = new Uint32Array(1024),
    value49 = new Float32Array(1024),
    value50 = new Float64Array(1024),
    value51 = new BigInt64Array(1024),
    value52 = new BigUint64Array(1024),
    value53 = new XMLHttpRequest(),
    value54 = new Headers(),
    value55 = new Request("https://example.com", { method: "GET", headers: value54 }),
    value56 = new Response("body", { status: 200, statusText: "OK", headers: value54 }),
    value57 = async () => "",
    value58 = new AggregateError([new Error("some error")], "Hello"),
    value59 = [].values(),
    value60 = (new Set()).values(),
    value61 = (new Map()).values()
  ;

  /**
   * @description "arguments" is array-like object,
   * it does not have an accurate type description in JS
   * Earlier versions of node would return arguments with the type Unknown,
   * and subsequent new versions of node would identify arguments as its own special Arguments type.
   */
  function testArguments() {
    // eslint-disable-next-line prefer-rest-params
    expect(whatsType(arguments) === "Arguments").toBeTruthy();
  }
  testArguments();

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

  expect(whatsType(value31) === "Promise").toBeTruthy();
  expect(whatsType(value32) === "FormData").toBeTruthy();
  expect(whatsType(value33) === "Blob").toBeTruthy();
  expect(whatsType(value34) === "File").toBeTruthy();
  expect(whatsType(value35) === "Error").toBeTruthy();
  expect(whatsType(value36) === "CustomEvent").toBeTruthy();
  expect(whatsType(value37) === "Storage").toBeTruthy();
  expect(whatsType(value38) === "Storage").toBeTruthy();
  expect(whatsType(value39) === "WebSocket").toBeTruthy();
  expect(whatsType(value40) === "ArrayBuffer").toBeTruthy();
  expect(whatsType(value41) === "DataView").toBeTruthy();
  expect(whatsType(value42) === "Uint8Array").toBeTruthy();
  expect(whatsType(value43) === "Int8Array").toBeTruthy();
  expect(whatsType(value44) === "Uint8ClampedArray").toBeTruthy();
  expect(whatsType(value45) === "Int16Array").toBeTruthy();
  expect(whatsType(value46) === "Uint16Array").toBeTruthy();
  expect(whatsType(value47) === "Int32Array").toBeTruthy();
  expect(whatsType(value48) === "Uint32Array").toBeTruthy();
  expect(whatsType(value49) === "Float32Array").toBeTruthy();
  expect(whatsType(value50) === "Float64Array").toBeTruthy();
  expect(whatsType(value51) === "BigInt64Array").toBeTruthy();
  expect(whatsType(value52) === "BigUint64Array").toBeTruthy();
  expect(whatsType(value53) === "XMLHttpRequest").toBeTruthy();
  expect(whatsType(value54) === "Headers").toBeTruthy();
  expect(whatsType(value55) === "Request").toBeTruthy();
  expect(whatsType(value56) === "Response").toBeTruthy();
  expect(whatsType(value57) === "AsyncFunction").toBeTruthy();
  expect(whatsType(value58) === "Error").toBeTruthy();
  expect(whatsType(value59) === "ArrayIterator").toBeTruthy();
  expect(whatsType(value60) === "SetIterator").toBeTruthy();
  expect(whatsType(value61) === "MapIterator").toBeTruthy();

  // 🌟 The test execution here is slightly different from the test execution result of the browser,
  // and it should be related to the small changes in the global object of vitest's test environment.
  // console.log(typeof window, window.__proto__, Window.prototype, whatsType(window), whatsType(global));
  // console.log(window, whatsType(window) === "Global");
  // expect(whatsType(window) === "Global").toBeTruthy();
  // It's right in the browser.
  // expect(whatsType(window) === "Window").toBeTruthy();
  // The global object global in node, but this is not necessarily a global object in a simulated node environment
  // console.log(global === window);
  // expect(whatsType(global) === "Global").toBeTruthy();
});
