import React, { useEffect } from "react";
import { expect, test } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { createStore, defineStore } from "../../src";
import { rawState } from "../__utils__";

/**
 * @description Executable copy of the examples published in
 * `docs/pages/immutable.md` and the `immutable` option section of
 * `docs/pages/using-detail.md`.
 *
 * Task 7.4 requires that documented examples produce the described result, so
 * this file is the guard for that claim: if the docs and the implementation
 * drift apart, this test fails.
 */

type Model = {
  userInfo: {
    name: string;
    address: { city: string };
  };
  tags: string[];
  rename(): void;
  moveCity(): void;
  addTag(tag: string): void;
};

const createModelStore = () => defineStore<Model>(
  {
    userInfo: {
      name: "Liu-Shan-Bao",
      address: { city: "bj" },
    },
    tags: ["a"],
    rename() {
      this.userInfo.name = "LSB";
    },
    moveCity() {
      this.userInfo.address.city = "sh";
    },
    addTag(tag) {
      this.tags.push(tag);
    },
  },
  { immutable: true },
);

test("docs example: immutable option produces the documented result", async () => {
  const useStore = createModelStore();
  const addressEffectRuns: string[] = [];

  const App = () => {
    const { userInfo, tags, rename, moveCity, addTag } = useStore();
    const { address } = userInfo;

    useEffect(() => {
      addressEffectRuns.push(address.city);
    }, [address]);

    return (
      <>
        <p>name:{userInfo.name}</p>
        <p>city:{address.city}</p>
        <p>tags:{tags.join(",")}</p>
        <button onClick={rename}>rename</button>
        <button onClick={moveCity}>moveCity</button>
        <button onClick={() => addTag("b")}>addTag</button>
      </>
    );
  };

  const { getByText } = render(<App />);
  await waitFor(() => getByText("name:Liu-Shan-Bao"));
  await waitFor(() => getByText("tags:a"));
  const baseline = addressEffectRuns.length;

  // rename changes `userInfo.name` only: the address reference is untouched, so
  // the effect documented as "only runs when address really changes" must not
  // run again.
  fireEvent.click(getByText("rename"));
  await waitFor(() => getByText("name:LSB"));
  expect(addressEffectRuns.length).toBe(baseline);

  // moveCity changes the address itself, so the effect does run.
  fireEvent.click(getByText("moveCity"));
  await waitFor(() => getByText("city:sh"));
  expect(addressEffectRuns.length).toBe(baseline + 1);

  // The array mutator appends through a copy and refreshes the view.
  fireEvent.click(getByText("addTag"));
  await waitFor(() => getByText("tags:a,b"));
});

test("docs example: chained writes freeze the snapshot taken before them", () => {
  const store = createStoreLike();
  // The snapshot guarantee applies to objects in the state tree. A reference
  // read through the proxy intentionally tracks the live state instead.
  const before = rawState<Model>(store);
  const beforeUserInfo = before.userInfo;

  store.rename();

  // Documented guarantee: the tree from before the write is unchanged.
  expect(beforeUserInfo.name).toBe("Liu-Shan-Bao");
  expect(store.userInfo.name).toBe("LSB");
  // Path-external sharing is preserved.
  expect(rawState<Model>(store).tags).toBe(before.tags);
});

test("docs example: a reference obtained through the proxy is a usable snapshot", () => {
  const store = createStoreLike();
  const viaProxy = store.userInfo;

  store.rename();

  // Reads through the proxy point at the object that was in the tree at that
  // moment, so they snapshot just as well as a raw read does.
  expect(viaProxy.name).toBe("Liu-Shan-Bao");
  expect(store.userInfo.name).toBe("LSB");
});

test("docs example: the same nested path reads back as one object", () => {
  const store = createStoreLike();
  // Documented guarantee: usable as a dependency because the identity is stable.
  expect(store.userInfo.address).toBe(store.userInfo.address);
});

/** The same model, built through `createStore` for the non-React assertions. */
function createStoreLike() {
  return createStore<Model>(
    {
      userInfo: { name: "Liu-Shan-Bao", address: { city: "bj" } },
      tags: ["a"],
      rename() { this.userInfo.name = "LSB"; },
      moveCity() { this.userInfo.address.city = "sh"; },
      addTag(tag: string) { this.tags.push(tag); },
    },
    { immutable: true },
  );
}

test("docs example: array mutation leaves the previously read array untouched", () => {
  const store = createStore<{ tags: string[] }>({ tags: ["a"] }, { immutable: true });

  const before = store.tags;
  store.tags.push("b");

  // Documented guarantee: the array read before the mutation keeps its contents.
  expect(before).toEqual(["a"]);
  expect(store.tags).toEqual(["a", "b"]);

  // Documented guarantee: read-only methods return native results.
  expect(store.tags.slice(0, 1)).toEqual(["a"]);
  expect(store.tags.map((t) => t + "!")).toEqual(["a!", "b!"]);
  expect(store.tags.join(",")).toBe("a,b");
});
