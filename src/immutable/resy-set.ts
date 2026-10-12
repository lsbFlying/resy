import type MetaStore from "../store/core";
import type { StatePath } from "./types";
import { readAtPath } from "./utils";

type WrappedSetCb<V> = (value: V, value2: V, set: Set<V>) => void;

/**
 * @description The cached path view over a native `Set` stored in an immutable
 * state tree — the `Set` mirror of `ResyMap` (see there for the handle
 * contract: read resolves the live path, mutators clone-and-commit once and
 * return `this`, the tree keeps holding the plain container).
 *
 * Set members have no keys: each member is addressed by object identity
 * through a `SetMemberMarker` whose per-store id keeps the proxy-cache key
 * encodable. Primitive members never wrap (there is nothing to write through),
 * object members get the same lazy router treatment as everywhere else.
 */
export class ResySet<V> extends Set<V> {
  #store: MetaStore<any>;
  #path: StatePath;

  constructor(store: MetaStore<any>, path: StatePath) {
    super();
    this.#store = store;
    this.#path = path;
  }

  #current(): Set<V> | undefined {
    const live = readAtPath(this.#store._$state_, this.#path);
    return live instanceof Set ? live as Set<V> : undefined;
  }

  #commit(next: Set<V>): void {
    this.#store._updater_.updateMetaState(this.#path, next as any, false);
  }

  /** Lazy-wrap an object member through the store's container router. */
  #wrap(value: V): V {
    if (typeof value !== "object" || value === null) return value;
    return this.#store._wrapContainerValue_(
      value,
      this.#store._setMemberMarker_(value),
      this.#path,
    ) as V;
  }

  has(value: V): boolean {
    const cur = this.#current();
    // Members handed out by iteration are wrappers; membership is judged on
    // the raw reference the set actually holds.
    return cur === undefined ? false : cur.has(this.#store._unwrapWrapper_(value) as V);
  }

  get size(): number {
    return this.#current()?.size ?? 0;
  }

  add(value: V): this {
    const cur = this.#current();
    if (cur === undefined) return this;
    const raw = this.#store._unwrapWrapper_(value) as V;
    if (cur.has(raw)) return this;
    const next = new Set(cur);
    next.add(raw);
    this.#commit(next);
    return this;
  }

  delete(value: V): boolean {
    const cur = this.#current();
    if (cur === undefined) return false;
    const raw = this.#store._unwrapWrapper_(value) as V;
    if (!cur.has(raw)) return false;
    const next = new Set(cur);
    const result = next.delete(raw);
    this.#commit(next);
    return result;
  }

  clear(): void {
    const cur = this.#current();
    if (cur === undefined || !cur.size) return;
    this.#commit(new Set());
  }

  forEach(callback: WrappedSetCb<V>, thisArg?: unknown): void {
    this.#current()?.forEach(value => {
      const wrapped = this.#wrap(value);
      callback.call(thisArg, wrapped, wrapped, this);
    });
  }

  keys(): SetIterator<V> {
    // Set "keys" are the members themselves — wrap them like values.
    return this.values();
  }

  values(): SetIterator<V> {
    const cur = this.#current() ?? new Set<V>();
    const iterator = cur.values();
    const wrapped = {
      next: () => {
        const step = iterator.next();
        if (step.done) return { done: true, value: undefined } as IteratorResult<V>;
        return { done: false, value: this.#wrap(step.value) };
      },
    };
    (wrapped as unknown as Record<PropertyKey, unknown>)[Symbol.iterator] = () => wrapped;
    return wrapped as unknown as SetIterator<V>;
  }

  entries(): SetIterator<[V, V]> {
    const cur = this.#current() ?? new Set<V>();
    const iterator = cur.entries();
    const wrapped = {
      next: () => {
        const step = iterator.next();
        if (step.done) return { done: true, value: undefined } as IteratorResult<[V, V]>;
        const wrappedMember = this.#wrap(step.value[0]);
        return { done: false, value: [wrappedMember, wrappedMember] as [V, V] };
      },
    };
    (wrapped as unknown as Record<PropertyKey, unknown>)[Symbol.iterator] = () => wrapped;
    return wrapped as unknown as SetIterator<[V, V]>;
  }

  override [Symbol.iterator](): SetIterator<V> {
    return this.values();
  }
}
