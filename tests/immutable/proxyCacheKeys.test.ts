import { expect, test } from "vitest";
import { appendSegmentKey, encodeSegment, pathKey, pathKeys } from "../../src/store/utils";
import { _MAP_MEMBER_, _SET_MEMBER_ } from "../../src/immutable/static";

const mapMarker = (key: unknown, id?: string) => ({
  [_MAP_MEMBER_]: true as const,
  key,
  ...(id === undefined ? {} : { id }),
});

const setMarker = (ref: unknown, id: string) => ({
  [_SET_MEMBER_]: true as const,
  ref,
  id,
});

const paths: unknown[][] = [
  [],
  ["a", "b"],
  [1],
  ["1"],
  [Symbol.for("x")],
  ["a\u0001b", "c"],
  ["map", mapMarker("k"), "value"],
  ["map", mapMarker({ id: 1 }, "7"), "value"],
  ["set", setMarker({}, "3"), "field"],
];

test("pathKeys encodes every prefix exactly like pathKey", () => {
  for (const path of paths) {
    const keys = pathKeys(path as never[]);
    expect(keys).toHaveLength(path.length + 1);
    expect(keys[0]).toBe("");

    for (let i = 1; i <= path.length; i++) {
      expect(keys[i]).toBe(pathKey(path.slice(0, i) as never[]));
      expect(keys[i]).toBe(appendSegmentKey(keys[i - 1], path[i - 1] as never));
      expect(keys[i]).toBe(
        keys[i - 1] === ""
          ? encodeSegment(path[i - 1] as never)
          : `${keys[i - 1]}\u0001${encodeSegment(path[i - 1] as never)}`,
      );
    }
  }
});

test("pathKeys keeps separator and type collisions distinct", () => {
  expect(pathKeys(["a", "sb"])[2]).not.toBe(pathKeys(["a\u0001sb"])[1]);
  expect(pathKey([1])).not.toBe(pathKey(["1"]));
  expect(pathKey([Symbol.for("x")])).toBe(pathKey([Symbol.for("x")]));
});

test("pathKeys handles Map and Set member markers", () => {
  const mapKey = pathKey(["map", mapMarker({ id: 1 }, "7"), "value"]);
  const setKey = pathKey(["set", setMarker({}, "3"), "field"]);

  expect(mapKey).toContain("M@7");
  expect(setKey).toContain("S3");
  expect(mapKey).not.toBe(pathKey(["map", mapMarker({ id: 2 }, "8"), "value"]));
});
