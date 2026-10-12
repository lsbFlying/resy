import type MetaStore from "../store/core";
import type { MapMemberMarker, StatePath } from "./types";
import { readAtPath } from "./utils";
import { _MAP_MEMBER_ } from "./static";

/**
 * @description The cached path view over a native `Map` stored in an immutable
 * state tree.
 *
 * A handle is created by the store's read router for a (container, path) pair
 * and is **not** the tree value — the tree keeps holding the plain `Map`, so
 * no adoption of user containers is ever needed. Every operation resolves the
 * container at the handle's path first, which makes a held handle follow
 * later commits (the documented rule for method calls), and every mutating
 * method clones the resolved container, applies the native method to the
 * clone, and commits it exactly once — so the previous container and
 * everything outside the path stay frozen. Mutators return `this`, which
 * keeps `m.set(...) === m` and native-style chaining intact.
 *
 * Member values are lazily wrapped through the store's container router with a
 * `MapMemberMarker` path segment, so writes through them enter the commit
 * pipeline like any nested read; a member that is itself a `Map`/`Set` comes
 * back as a nested handle whose own path ends with the member marker.
 */
export class ResyMap<K, V> extends Map<K, V> {
  #store: MetaStore<any>;
  #path: StatePath;

  constructor(store: MetaStore<any>, path: StatePath) {
    super();
    this.#store = store;
    this.#path = path;
  }

  /** The container currently at the handle's path, or undefined once the
   * position stopped holding a `Map` (stale handle). */
  #current(): Map<K, V> | undefined {
    const live = readAtPath(this.#store._$state_, this.#path);
    return live instanceof Map ? live as Map<K, V> : undefined;
  }

  #commit(next: Map<K, V>): void {
    this.#store._updater_.updateMetaState(this.#path, next as any, false);
  }

  /** Lazy-wrap a member value through the store's container router. */
  #wrap(value: unknown, key: K): unknown {
    return this.#store._wrapContainerValue_(
      value,
      { [_MAP_MEMBER_]: true, key } as MapMemberMarker,
      this.#path,
    );
  }

  get(key: K): V | undefined {
    const value = this.#current()?.get(key);
    return value === undefined ? undefined : this.#wrap(value, key) as V;
  }

  has(key: K): boolean {
    return this.#current()?.has(key) ?? false;
  }

  get size(): number {
    return this.#current()?.size ?? 0;
  }

  set(key: K, value: V): this {
    const cur = this.#current();
    if (cur === undefined) return this;
    // A wrapper handed out by an earlier read must not be committed into the
    // tree — method arguments resolve back to the raw value they wrap.
    const raw = this.#store._unwrapWrapper_(value) as V;
    if (Object.is(cur.get(key), raw)) return this;
    const next = new Map(cur);
    next.set(key, raw);
    this.#commit(next);
    return this;
  }

  delete(key: K): boolean {
    const cur = this.#current();
    if (cur === undefined || !cur.has(key)) return false;
    const next = new Map(cur);
    const result = next.delete(key);
    this.#commit(next);
    return result;
  }

  clear(): void {
    const cur = this.#current();
    if (cur === undefined || !cur.size) return;
    this.#commit(new Map());
  }

  forEach(
    callback: (value: V, key: K, map: Map<K, V>) => void,
    thisArg?: unknown,
  ): void {
    this.#current()?.forEach((value, key) => {
      callback.call(thisArg, this.#wrap(value, key) as V, key, this);
    });
  }

  keys(): MapIterator<K> {
    return (this.#current() ?? new Map<K, V>()).keys();
  }

  values(): MapIterator<V> {
    const cur = this.#current() ?? new Map<K, V>();
    // `values()` yields no keys, so pair it with `keys()` by position to give
    // each wrapped member its member-marker path.
    const keysIterator = cur.keys();
    const valuesIterator = cur.values();
    const wrapped = {
      next: () => {
        const step = valuesIterator.next();
        if (step.done) return { done: true, value: undefined } as IteratorResult<V>;
        const key = keysIterator.next().value as K;
        return { done: false, value: this.#wrap(step.value, key) as V };
      },
    };
    (wrapped as unknown as Record<PropertyKey, unknown>)[Symbol.iterator] = () => wrapped;
    return wrapped as unknown as MapIterator<V>;
  }

  entries(): MapIterator<[K, V]> {
    const cur = this.#current() ?? new Map<K, V>();
    const iterator = cur.entries();
    const wrapped = {
      next: () => {
        const step = iterator.next();
        if (step.done) return { done: true, value: undefined } as IteratorResult<[K, V]>;
        const [key, value] = step.value;
        return { done: false, value: [key, this.#wrap(value, key) as V] as [K, V] };
      },
    };
    (wrapped as unknown as Record<PropertyKey, unknown>)[Symbol.iterator] = () => wrapped;
    return wrapped as unknown as MapIterator<[K, V]>;
  }

  override [Symbol.iterator](): MapIterator<[K, V]> {
    return this.entries();
  }
}
