import { createStore } from "../../src";

/**
 * Compile-time guard for the deeply read-only state faces.
 *
 * This file is intentionally named `*.test-d.ts` so it is picked up by `tsc`
 * but not executed by Vitest. Every `@ts-expect-error` below proves that a
 * write which would silently rewrite the current tree or the history at runtime
 * is rejected by the type system.
 */

type Model = {
  user: { name: string };
  list: number[];
  map: Map<string, number>;
};

const store = createStore<Model>(
  { user: { name: "a" }, list: [], map: new Map() },
  { immutable: true },
);

store.subscribe(({ prevState, nextState, effectState }) => {
  // @ts-expect-error prevState is deeply read-only
  prevState.user.name = "b";

  // @ts-expect-error nextState is deeply read-only
  nextState.user.name = "b";

  // @ts-expect-error effectState is deeply read-only
  effectState.user!.name = "b";

  // @ts-expect-error ReadonlyArray has no push
  prevState.list.push(1);

  // @ts-expect-error ReadonlyMap has no set
  prevState.map.set("a", 1);
});

store.setState(prevState => {
  // @ts-expect-error the updater snapshot is deeply read-only
  prevState.user.name = "b";
  return {};
});

store.syncUpdate(prevState => {
  // @ts-expect-error the updater snapshot is deeply read-only
  prevState.user.name = "b";
  return {};
});
