import type {
  AnyBoundFn, InitialState, StateWithThisType, Store,
  StoreOptions, UseMacroStore, InnerStoreOptions,
} from "./types";
import type { AnyFn, PrimitiveState, ValueOf } from "../types";
import type { ClassStoreType } from "../class-connect/types";
import type { SetStateType, SyncUpdateType } from "../updater/types";
import type { SubscribeType, UseSubscriptionType } from "../subscribe/types";
import type { RestoreType } from "../restore/types";
import type { MapMemberMarker, SetMemberMarker, StatePath, StatePathSegment } from "../immutable/types";
import type { UseComputedType, ComputedType } from "../computer/types";
import { optionsErrorProcessing, stateErrorProcessing } from "./errors";
import { _RESY_BRAND_, _WRAPPER_ORIGIN_, DEFAULT_OPTIONS } from "./static";
import { appendSegmentKey, formatPath, pathKey } from "./utils";
import { hasOwnProperty } from "../utils";
import { isSetMember, proxyable, readAtPath } from "../immutable/utils";
import { _MAP_MEMBER_, _SET_MEMBER_ } from "../immutable/static";
import { markNestedWrapperCreated, normalizeWriteValue } from "../immutable/normalize";
import { ResyMap } from "../immutable/resy-map";
import { ResySet } from "../immutable/resy-set";
import MetaState from "../state";
import Scheduler from "../scheduler";
import Subscriber from "../subscribe";
import Updater from "../updater";
import Restorer from "../restore";
import Computer from "../computer";

/**
 * @description The core meta-structure of store
 */
export default class MetaStore<S extends PrimitiveState> {
  constructor(initialState?: InitialState<S>, options?: StoreOptions) {
    this._initialState_ = initialState;

    const reducerState = typeof initialState !== "function"
      ? (initialState ?? ({} as StateWithThisType<S>))
      : initialState();

    optionsErrorProcessing(options);
    const opts = {
      ...DEFAULT_OPTIONS,
      ...(options ?? {}),
    } as InnerStoreOptions;
    this._options_ = opts;

    stateErrorProcessing({ state: reducerState, options: opts });
    /**
     * @description The initial tree is normalized like any other write: it may
     * be derived from another store (`createStore({ user: otherStore.user })`),
     * and a wrapper must not become state data just because it entered through
     * the constructor.
     */
    const normalizedState = { ...reducerState } as S;
    /**
     * Normalize symbol-keyed values too: object spread copies own enumerable
     * symbols, but `Object.keys` does not, so a wrapper stored under a symbol
     * key would silently stay a wrapper.
     */
    const normalizedKeys = [
      ...Object.keys(normalizedState),
      ...Object.getOwnPropertySymbols(normalizedState),
    ] as (keyof S)[];
    for (const key of normalizedKeys) {
      normalizedState[key] = this._normalizeWriteValue_(normalizedState[key]) as ValueOf<S>;
    }
    this._$state_ = normalizedState;

    this.store = this.#createProxy();
  }

  readonly [_RESY_BRAND_] = _RESY_BRAND_;

  // Configuration
  readonly _options_;
  // Initialize the incoming state
  readonly _initialState_?: InitialState<S>;

  /** ============================== For Core Component Element start ============================== */
  // Scheduler
  readonly _scheduler_ = new Scheduler<S>(this);

  subscribe!: SubscribeType<S>["subscribe"];
  useSubscription!: UseSubscriptionType<S>["useSubscription"];
  // Subscriber
  readonly _subscriber_ = new Subscriber(this);

  useComputed!: UseComputedType["useComputed"];
  computed!: ComputedType["computed"];
  // Computer
  readonly _computer_ = new Computer(this);

  setState!: SetStateType<S>["setState"];
  syncUpdate!: SyncUpdateType<S>["syncUpdate"];
  // Updater
  readonly _updater_ = new Updater(this);

  restore!: RestoreType["restore"];
  // Restorer
  readonly _restorer_ = new Restorer(this);

  // MetaState for driving rendering
  readonly _metaState_ = new MetaState<S>(this);

  /** ============================== For Core Component Element  end ============================== */

  /** ============================== For Core Render Element start ============================== */
  _$state_: S;

  /**
   * @description Cache for every read-side wrapper, keyed by target object and
   * then by encoded path: nested proxies for plain objects/arrays, subclass
   * handles for `Map`/`Set`.
   *
   * The inner key MUST be the path rather than the target alone: the same
   * object can be reachable through several paths, and a wrapper can only
   * carry one path for its writable location. Caching by path also makes repeated
   * reads of an unchanged location return the very same wrapper, which is what
   * makes a nested object usable as a `useEffect` dependency. Commits replace
   * the objects on the path, so a new target has no entry yet — no explicit
   * invalidation is needed, and stale entries die together with their objects.
   */
  #proxyCache = new WeakMap<object, Map<string, unknown>>();

  /**
   * @description Development-only count of read-side wrappers created by this
   * store. Benchmarks and regression tests use it to prove that a change does
   * not add proxy allocations; the counter is not part of the public API.
   */
  _proxyCreatedCount_ = 0;

  /**
   * @description Per-store ids for symbol property keys. Two distinct symbols
   * can share a description, so the description alone is not a safe cache key;
   * the id is. Symbols cannot be `WeakMap` keys, so the map lives as long as
   * the store (which is also the lifetime of any path that can use it).
   */
  #symbolKeyIdCache = new Map<symbol, string>();
  #symbolKeyIdCounter = 0;

  /**
   * @description Resolve a symbol property key to a store-local unique id used
   * by path encoding. Public (`_underscore_` convention) because the updater
   * also encodes paths through the same store.
   */
  _symbolKeyId_ = (key: symbol): string => {
    let id = this.#symbolKeyIdCache.get(key);
    if (id === undefined) {
      id = `${++this.#symbolKeyIdCounter}`;
      this.#symbolKeyIdCache.set(key, id);
    }
    return id;
  };

  // A proxy object with the capabilities of updating and data tracking.
  readonly store: Store<S>;

  useStore: UseMacroStore<S> = () => this._metaState_.useMetaState();
  /** ============================== For Core Render Element end ============================== */

  /**
   * Cache of bound action functions: outer key is the `thisArg` the action is
   * bound to, inner key the original function. Keeping the binding out of the
   * state tree means `_$state_` is never written to just because an action was
   * read — so a snapshot taken at any moment keeps the original function — and
   * the same (thisArg, fn) pair holds one stable identity across reads and
   * commits alike.
   */
  _boundFnCache_ = new WeakMap<object, WeakMap<AnyBoundFn, AnyBoundFn>>();

  /** Helper function for binding function properties  */
  _boundFnProcessing_(
    value: AnyBoundFn,
    thisArg: Store<S> | ClassStoreType<S> = this.store,
  ) {
    let perThisArg = this._boundFnCache_.get(thisArg);
    if (perThisArg === undefined) {
      perThisArg = new WeakMap();
      this._boundFnCache_.set(thisArg, perThisArg);
    }

    const cached = perThisArg.get(value);
    if (cached !== undefined) return cached as ValueOf<S>;

    const boundFn = (
      (...args: unknown[]) => (value as AnyFn).apply(thisArg, args)
    ) as AnyBoundFn;

    boundFn._bound_ = true;
    boundFn._name_ = value.name;

    perThisArg.set(value, boundFn);

    return boundFn as ValueOf<S>;
  }

  /**
   * @description Wrap a container value read at `[...parentPath, indexOrKey]`.
   *
   * The one router for every nested read: `Map`/`Set` values get their cached
   * subclass handles, plain objects and arrays get the nested proxy (so writes
   * through the reference enter the commit pipeline), functions are values
   * rather than containers, and everything else is returned unchanged.
   *
   * 🌟 Public (`_underscore_` convention, like `_boundFnProcessing_`): the
   * ResyMap/ResySet handles route their member reads through this method, and
   * a `#`-private one could not be reached from another class.
   *
   * 🌟 Leaves (primitives, `Date`, class instances, frozen/sealed objects)
   * return before the `[...parentPath, key]` copy runs; primitives return
   * before even the key encoding, so the common leaf read allocates nothing.
   */
  _wrapContainerValue_(
    value: unknown,
    indexOrKey: StatePathSegment,
    parentPath: StatePath,
    parentKey?: string,
  ) {
    if (!this._options_.immutable || typeof value === "function") return value;
    if (typeof value !== "object" || value === null) return value;

    const isContainer = value instanceof Map || value instanceof Set;

    /**
     * @description Numeric indices (handed to callbacks and iterators by
     * native code) are normalized to strings so they match the property
     * keys the proxy traps produce for the same position — otherwise one
     * element would get two cache entries and two identities.
     */
    const key = typeof indexOrKey === "number" ? String(indexOrKey) : indexOrKey;
    const childKey = parentKey === undefined ? undefined : appendSegmentKey(parentKey, key, this._symbolKeyId_);

    if (childKey !== undefined) {
      const cached = this.#proxyCache.get(value)?.get(childKey);
      if (cached !== undefined) return cached;
    }

    /**
     * `proxyable` is false for `Map`/`Set` and for every leaf object (`Date`,
     * class instance, frozen/sealed object). Only plain objects and arrays
     * need a path, so leaves leave before the path is built. The cache lookup
     * stays above this line so a value that was wrapped while it was still
     * extensible keeps returning its wrapper if it is later sealed.
     */
    if (!isContainer && !proxyable(value)) return value;

    const childPath: StatePath = [...parentPath, key];
    const resolvedKey = childKey ?? pathKey(childPath, this._symbolKeyId_);

    if (!isContainer) {
      return this.#createProxy(value, childPath, resolvedKey);
    }

    /**
     * @description Fetch (or create) the subclass handle for this `Map`/`Set`.
     * Handles live in the same cache as the proxies and obey the same
     * invalidation invariant: a commit replaces the container, the new container
     * has no entry yet, and a fresh handle is created while the old one dies
     * together with its container.
     */
    const perTarget = this.#proxyCache.get(value);
    /**
     * When `childKey` is defined, the lookup above already missed, so a second
     * lookup is only needed for the `parentKey === undefined` fallback.
     */
    const cached = childKey === undefined ? perTarget?.get(resolvedKey) : undefined;
    if (cached !== undefined) return cached;

    const handle = value instanceof Map
      ? new ResyMap<unknown, unknown>(this, childPath, value as Map<unknown, unknown>, resolvedKey)
      : new ResySet<unknown>(this, childPath, value as Set<unknown>, resolvedKey);

    if (__DEV__) this._proxyCreatedCount_++;

    if (perTarget === undefined) {
      this.#proxyCache.set(value, new Map([[resolvedKey, handle]]));
    } else {
      perTarget.set(resolvedKey, handle);
    }
    markNestedWrapperCreated();
    _WRAPPER_ORIGIN_.set(handle, value);
    return handle;
  }

  /**
   * @description Per-store ids for `Set` members. The id is what makes a
   * Set-member path segment encodable inside a cache key (the member itself
   * is an object reference); the WeakMap lets ids die with their members.
   */
  #setMemberIdCache = new WeakMap<object, string>();
  #setMemberIdCounter = 0;

  /**
   * @description Build the marker that addresses a `Set` member in a state
   * path.
   */
  _setMemberMarker_(ref: object): SetMemberMarker {
    let id = this.#setMemberIdCache.get(ref);
    if (id === undefined) {
      id = `${++this.#setMemberIdCounter}`;
      this.#setMemberIdCache.set(ref, id);
    }
    return { [_SET_MEMBER_]: true, ref, id };
  }

  /**
   * @description Per-store ids for non-primitive `Map` keys. Primitive keys are
   * encoded by value; object / function keys have no stable textual form, and
   * `String(key)` would collapse them all to `[object Object]`.
   */
  #mapMemberIdCache = new WeakMap<object, string>();
  /** Symbols cannot be `WeakMap` keys, so their ids live in a regular `Map`. */
  #mapSymbolIdCache = new Map<symbol, string>();
  #mapMemberIdCounter = 0;

  /**
   * @description Build the marker that addresses a `Map` member in a state
   * path.
   */
  _mapMemberMarker_(key: unknown): MapMemberMarker {
    if (
      (typeof key === "object" && key !== null)
      || typeof key === "function"
    ) {
      let id = this.#mapMemberIdCache.get(key as object);
      if (id === undefined) {
        id = `${++this.#mapMemberIdCounter}`;
        this.#mapMemberIdCache.set(key as object, id);
      }
      return { [_MAP_MEMBER_]: true, key, id };
    }

    if (typeof key === "symbol") {
      let id = this.#mapSymbolIdCache.get(key);
      if (id === undefined) {
        id = `${++this.#mapMemberIdCounter}`;
        this.#mapSymbolIdCache.set(key, id);
      }
      return { [_MAP_MEMBER_]: true, key, id };
    }

    return { [_MAP_MEMBER_]: true, key };
  }

  /**
   * @description Resolve a wrapper reference back to the raw value it wraps —
   * the container handles normalize their method arguments through this;
   * anything else is returned unchanged.
   */
  _unwrapWrapper_(value: unknown): unknown {
    return typeof value === "object" && value !== null
      ? _WRAPPER_ORIGIN_.get(value) ?? value
      : value;
  }

  /** @description Normalize a write value; see `normalizeWriteValue`. */
  _normalizeWriteValue_(value: unknown, deep = true): unknown {
    return normalizeWriteValue(value, deep);
  }

  /**
   * @description Read-side lineage: for a path, the `old → next` links every
   * commit of that path produced. A handle resolves through them to decide
   * whether it still denotes the live location (see `_isActiveHandle_`).
   *
   * Keyed by path so a shared object at `a.s` and `b.s` cannot cross-talk, and
   * values are `WeakMap`s so links die with the objects while snapshots still
   * hold them.
   */
  #lineage = new Map<string, WeakMap<object, object>>();

  #warnedDetachedPaths = new Set<string>();

  /**
   * @description Record that a commit replaced `previous` with `next` at
   * `path` by cloning it. `force` is used for container self-commits (array
   * methods, `Map`/`Set` mutators), whose old container may not be in the
   * proxy cache even though a handle is following the path.
   */
  _linkClone_(
    path: StatePath,
    previous: unknown,
    next: unknown,
    force = false,
    cacheKey?: string,
  ): void {
    if (path.length === 0) return;
    if (typeof previous !== "object" || previous === null) return;
    if (typeof next !== "object" || next === null) return;
    if (previous === next) return;

    const key = cacheKey ?? pathKey(path, this._symbolKeyId_);
    let lineage = this.#lineage.get(key);
    if (lineage === undefined) {
      if (!force && !this.#proxyCache.has(previous)) return;
      lineage = new WeakMap();
      this.#lineage.set(key, lineage);
    }
    lineage.set(previous, next);
  }

  /** Record every level a `commitPath` call cloned. */
  _linkReplaced_(
    replaced: Array<[StatePath, object, object]>,
    keys?: string[],
  ): void {
    for (const [path, previous, next] of replaced) {
      this._linkClone_(path, previous, next, false, keys?.[path.length]);
    }
  }

  /**
   * @description Whether a handle created for `target` at `path` may still
   * write there.
   *
   * A handle stays active while the path resolves to the very object it wraps,
   * or to an object this store produced by cloning that one (destructuring then
   * updating, or a parent handle surviving a child write). Anything else —
   * removal, whole-value replacement, an element moved to another index — means
   * the handle is detached and its writes are ignored.
   *
   * 🌟 `Set` members are addressed by object identity, and a commit replaces
   * the member object itself. The old marker's ref is then no longer in the
   * set, so a plain path walk would report "missing" even though the lineage
   * says this very member became its clone. The path is therefore rewritten
   * through the lineage before it is read.
   */
  _isActiveHandle_(target: object, path: StatePath, cacheKey?: string): boolean {
    if (path.length === 0) return true;

    const resolvedPath = this._resolveSetMarkers_(path);
    const live = readAtPath(this._$state_, resolvedPath);
    // The fast path also covers a whole-value replacement that put the original
    // object back at the path: `live` is the handle's own target again.
    if (live === target) return true;
    return live === this.#resolveLineage(path, target, cacheKey);
  }

  /**
   * @description Follow the `old → next` clone chain recorded for one path and
   * return the latest object. Path compression keeps repeated writes through a
   * long-lived handle O(1) instead of O(writes).
   */
  #resolveLineage(path: StatePath, target: object, cacheKey?: string): object {
    const lineage = this.#lineage.get(cacheKey ?? pathKey(path, this._symbolKeyId_));
    if (lineage === undefined) return target;

    let current = target;
    const visited: object[] = [];
    for (let steps = 0; steps < 10000; steps++) {
      const next = lineage.get(current);
      if (next === undefined) break;
      visited.push(current);
      current = next;
    }
    // Path compression keeps long write chains cheap to resolve.
    visited.forEach(node => lineage.set(node, current));
    return current;
  }

  /**
   * @description Rewrite the `Set` member markers of a path to the member
   * object the lineage currently points at. Only the marker's `ref` changes;
   * the marker's id (and therefore the proxy-cache key) stays stable.
   */
  _resolveSetMarkers_(path: StatePath): StatePath {
    let changed = false;
    const next = path.map((segment, index) => {
      if (!isSetMember(segment)) return segment;
      const resolved = this.#resolveLineage(path.slice(0, index + 1), segment.ref as object);
      if (resolved === segment.ref) return segment;

      /**
       * @description Only follow the lineage while the resolved member is
       * actually in the set. A whole-value replacement can put the *old* ref
       * back (`store.s = new Set([oldRef])`); blindly rewriting to the clone
       * would then make a still-present handle look detached.
       */
      const container = readAtPath(this._$state_, path.slice(0, index));
      if (!(container instanceof Set) || !container.has(resolved)) return segment;

      changed = true;
      return { ...segment, ref: resolved };
    });
    return changed ? next : path;
  }

  /**
   * @description Development-only, once-per-path notice for a write that was
   * ignored because its handle was detached. Silent in production, matching
   * the "no-op, never throw" contract for detached writes.
   */
  _warnDetached_(path: StatePath): void {
    if (!__DEV__) return;
    const key = pathKey(path, this._symbolKeyId_);
    if (this.#warnedDetachedPaths.has(key)) return;
    // Bound the notice memory for stores that visit many dynamic paths.
    if (this.#warnedDetachedPaths.size > 512) this.#warnedDetachedPaths.clear();
    this.#warnedDetachedPaths.add(key);
    console.warn(
      `resy: ignored a write through a detached handle at path "${formatPath(path)}". `
      + "The element is no longer part of the current state; read it again from the store.",
    );
  }

  /**
   * Create Store Proxy
   *
   * @param target - The object the proxy wraps.
   * @param path - The ordered path from the root state to `target`. The empty
   * path marks the root state object itself, so `path.length === 0` identifies
   * the first level and `path[0]` is the first-level key of any nested proxy.
   * @param inheritedKey - The encoded cache key of this proxy, already built by
   * the parent from its own key and this segment. Passing it avoids rebuilding
   * the whole path key on every nested read. Omit it for the root, where it is
   * derived from `path` — the empty path maps to the empty key.
   */
  #createProxy(
    target: object = this._$state_,
    path: StatePath = [],
    inheritedKey?: string,
  ) {
    const {
      _computer_: computer,
      _options_: { immutable },
      _updater_: updater,
    } = this;
    const { computedDeps } = computer;

    /**
     * @description A repeated read of an unchanged location must return the
     * same wrapper. Commits replace the objects on the path, so a new target
     * has no cache entry yet — no explicit invalidation is needed, and stale
     * entries die together with their objects.
     */
    const cacheKey = inheritedKey ?? pathKey(path, this._symbolKeyId_);
    const cacheForTarget = this.#proxyCache.get(target as object);
    const cached = cacheForTarget?.get(cacheKey);
    if (cached !== undefined) return cached as Store<S>;

    if (__DEV__) this._proxyCreatedCount_++;

    /**
     * @description A nested proxy wraps one immutable snapshot target, so a
     * child value it has already wrapped can never become stale for that
     * proxy. The root proxy is excluded: it reads the latest `_$state_` on
     * every get, so its children change after a commit.
     */
    const childCache = path.length === 0 ? undefined : new Map<PropertyKey, unknown>();

    const wrapChild = (value: unknown, key: PropertyKey) => {
      if (childCache !== undefined) {
        const cached = childCache.get(key);
        if (cached !== undefined) return cached;
      }
      const wrapped = this._wrapContainerValue_(value, key, path, cacheKey);
      if (childCache !== undefined && wrapped !== value) childCache.set(key, wrapped);
      return wrapped;
    };

    const proxy = new Proxy(target, {
      get: (_: S, key: keyof S) => {
        const sourceFrom$State = path.length === 0;

        computer.computing && sourceFrom$State && computedDeps.add(key);

        /**
         * @description `this._$state_` is writable, so we need to check here,
         * if the data originates from `$state`,
         * the latest value should be re-fetched from this._$state_.
         * If `target[key]` is used directly,
         * it may lead to incorrect changes due to discrepancies
         * between the initially referenced address and the updated reference address
         * of `this._$state_` after modifications.
         */
        const value = sourceFrom$State ? this._$state_[key] : (target as S)[key];

        /**
         * @description Only the root layer resolves MetaStore's own properties
         * (subscribe/setState/restore/…). Nested layers are pure user data: a
         * nested key that happens to collide with one of those names must read
         * the user's value, not a store utility.
         */
        const sourceFromThis = path.length === 0 && hasOwnProperty.call(this, key);

        /**
         * @description Array branch.
         *
         * A mutating array method performs a *sequence* of internal writes
         * (`push` writes the index and then `length`; `pop` deletes the index
         * and then writes `length`; `sort` reads and writes interleaved). If
         * those writes were committed one by one, every step would rebuild the
         * root while the method keeps operating on the previous array, so the
         * intermediate states would fight each other.
         *
         * Instead every function read from an array proxy is routed through one
         * generic wrapper: the array is copied to a detached draft, the method
         * runs on that draft with native semantics, and the draft is committed
         * exactly once. No method name is inspected, so methods added by future
         * ECMAScript versions are covered automatically; read-only methods take
         * the same path and simply commit nothing because the value is equal.
         *
         * 🌟 The commit uses this array's own path, which includes its host
         * object, so the host is cloned as well and any previously held snapshot
         * keeps sharing neither the array nor the host.
         */
        if (Array.isArray(target)) {
          /**
           * @description Property reads always come from `target`: while this
           * proxy is the current value, `target` IS the live array; once a commit
           * has replaced it, `target` is the snapshot — matching the object
           * branch exactly. Method calls resolve the live tree by path instead
           * (see the wrapper below), so the documented rule is: property reads
           * see the snapshot, method calls act on current state.
           */
          const member = (target as unknown as Record<PropertyKey, unknown>)[key as PropertyKey];
          if (typeof member !== "function") {
            /**
             * @description Element reads must be wrapped like any other nested
             * read, otherwise `store.list[1].id = 99` would reach the raw
             * element object and bypass the proxy chain entirely.
             */
            if (!sourceFromThis) {
              return wrapChild(member, key as PropertyKey);
            }
            return this[key as keyof MetaStore<S>];
          }

          return (...args: unknown[]) => {
            /**
             * @description A held array handle may have been detached by a
             * whole-array replacement. Reads (join/slice/map/…) keep working on
             * the handle's creation snapshot, but nothing may be committed:
             * acting on the array that now occupies the path would be a write
             * into an unrelated element of the current tree.
             */
            const active = path.length === 0 || this._isActiveHandle_(target as object, path, cacheKey);
            const current = active ? readAtPath(this._$state_, path) : target as unknown;
            if (!Array.isArray(current)) return undefined;

            const draft = current.slice();

            /**
             * @description Wrapper references handed back into a method must be
             * normalized to the raw values they wrap: identity searches
             * (indexOf/includes/lastIndexOf) compare against the raw draft
             * elements, and committing a wrapper — e.g. via push or splice —
             * would store the wrapper itself as state data.
             */
            const normalizeArgs = (input: unknown[]) =>
              input.map(arg => this._normalizeWriteValue_(arg));

            /**
             * @description A method that hands elements to user code through a
             * callback (forEach/map/filter/find/some/every/reduce/sort…) must
             * not hand out the raw references the draft shares with the live
             * tree: writes through them would bypass the commit pipeline and
             * mutate the tree in place. Each of the callback's first two
             * parameters is checked against the *next* parameter as an index —
             * `draft[i] === arg` proves the reference is the element at `i`,
             * so the wrapper path is correct no matter which callback signature
             * produced it. sort comparators and reduce accumulators carry no
             * usable index and simply stay raw.
             */
            const callArgs = typeof args[0] === "function"
              ? [
                (...cbArgs: unknown[]) => {
                  const wrapCbArg = (arg: unknown, index: unknown) =>
                    active
                    && typeof index === "number" && index >= 0 && index < draft.length
                    && draft[index] === arg
                      ? this._wrapContainerValue_(arg, index, path, cacheKey)
                      : arg;
                  cbArgs[0] = wrapCbArg(cbArgs[0], cbArgs[1]);
                  cbArgs.length > 2 && (cbArgs[1] = wrapCbArg(cbArgs[1], cbArgs[2]));
                  return (args[0] as AnyFn)(...cbArgs);
                },
                ...normalizeArgs(args.slice(1)),
              ]
              : normalizeArgs(args);

            const result = Reflect.apply(member, draft, callArgs);

            /**
             * @description Commit only when the contents actually changed.
             *
             * The draft is always a fresh array, so the commit step's identity
             * check would treat every call as a change — including read-only
             * methods such as `slice`/`map`/`join`, which would then needlessly
             * replace the state tree and notify subscribers. Comparing contents
             * here keeps read-only methods side-effect free while still letting
             * one generic wrapper cover every method.
             */
            let changed = draft.length !== current.length;
            if (!changed) {
              for (let i = 0; i < draft.length; i++) {
                if (!Object.is(draft[i], current[i])) {
                  changed = true;
                  break;
                }
              }
            }
            if (changed && active) {
              /**
               * @description The commit replaces the array at `path` with the
               * draft. Linking old→draft keeps the handle (and any handle that
               * produced this one) following its own commits.
               */
              this._linkClone_(path, current, draft, true, cacheKey);
              updater.updateMetaState(path, draft as ValueOf<S>, false, undefined, false);
            }

            // Methods that return the array itself (`push` returns a length, but
            // `sort`/`reverse`/`splice` return `this`) must hand back this very
            // proxy so that identity comparisons and chaining both hold. A
            // detached handle hands back the local draft instead: nothing will
            // be committed, so the result should be the array the method acted on.
            if (result === draft) return active ? proxy : draft;

            /**
             * @description An iterator handed to user code (for…of, spread,
             * Array.from, values/keys/entries) must yield wrapped elements for
             * the same reason as the callback above. Iterator-producing methods
             * never mutate, and the commit step above already found nothing to
             * do in that case.
             */
            if (
              result !== null && typeof result === "object"
              && typeof (result as { next?: unknown }).next === "function"
            ) {
              // A detached handle yields its snapshot's raw elements: wrapping
              // them would hand out paths that now point at other elements.
              if (!active) return result;

              const iterator = result as { next: () => { done: boolean; value: unknown } };
              /**
               * Compare against the array's own prototype instead of
               * `Array.prototype` so an array from another realm still
               * identifies `entries()` correctly.
               */
              const entries = (Object.getPrototypeOf(target) as { entries?: unknown } | null)?.entries;
              const isEntries = member === entries;
              let iteratorIndex = -1;
              const wrappedIterator = {
                next: () => {
                  const step = iterator.next();
                  if (step.done) return step;
                  if (isEntries) {
                    // `entries()` yields [index, value]: keep the index raw and
                    // wrap the value at that index.
                    const [i, v] = step.value as [number, unknown];
                    return {
                      done: false,
                      value: [i, this._wrapContainerValue_(v, i, path, cacheKey)],
                    };
                  }
                  iteratorIndex++;
                  return {
                    done: false,
                    value: this._wrapContainerValue_(step.value, iteratorIndex, path, cacheKey),
                  };
                },
              };
              (wrappedIterator as unknown as Record<PropertyKey, unknown>)[Symbol.iterator] = () => wrappedIterator;
              return wrappedIterator;
            }

            /**
             * @description A method that returns one of the draft's own
             * elements (`find`/`findLast` and any future lookalike) hands back
             * the wrapped reference instead of the raw object. Detection is
             * identity-based against the draft, so no method name is
             * inspected; detached results (`pop`'s removed element, `splice`'s
             * removed chunk) are no longer in the draft and stay raw.
             */
            const foundIndex = draft.indexOf(result);
            if (active && immutable && foundIndex >= 0 && proxyable(result)) {
              return this._wrapContainerValue_(result, foundIndex, path, cacheKey);
            }

            return result;
          };
        }

        /**
         * @description Container reads go through the one router: `Map`/`Set`
         * values come back as their subclass handles, plain objects/arrays as
         * the nested proxy, and everything else unchanged. Functions are
         * values rather than containers and fall through to the branches
         * below.
         */
        if (!sourceFromThis && typeof value !== "function") {
          return wrapChild(value, key as PropertyKey);
        }

        /**
         * @description Only bind functions that handle `this._$state_`,
         * Processing this-binding for functions nested beyond the second level
         * is practically unnecessary for several reasons:
         * First, such complex and unmaintainable coding patterns are uncommon in practice.
         * Second, even if such multi-level nested functions exist,
         * their this context (for non-arrow functions) should naturally reference
         * their direct host object according to JavaScript's this-binding rules.
         *
         * Most fundamentally, our this-binding processing specifically targets action-type handler functions.
         * By definition, action functions are designed to be used at the first property level,
         * so deeper nested functions are explicitly excluded from this processing.
         */
        if (
          !sourceFromThis
          && typeof value === "function"
          && sourceFrom$State
          && !(value as AnyBoundFn)._bound_
        ) {
          return this._boundFnProcessing_(value);
        }

        return !sourceFromThis ? value : this[key as keyof MetaStore<S>];
      },
      /**
       * @description Nested proxies pass themselves as the write owner so the
       * updater can verify they are still attached to their path. The root
       * proxy (empty path) is the live entry point by definition and passes
       * nothing.
       */
      set: (_: S, key: keyof S, value: ValueOf<S>) => updater.updateMetaState(
        [...path, key], value, false,
        path.length === 0 ? undefined : target as object,
      ),
      // Delete will also play an updating role
      deleteProperty: (_: S, key: keyof S) => updater.updateMetaState(
        [...path, key], undefined as ValueOf<S>, true,
        path.length === 0 ? undefined : target as object,
      ),
      /**
       * @description Only the state-property shape is representable: a plain
       * data descriptor with all attributes enabled. Attribute changes
       * (accessors, non-writable/non-enumerable/non-configurable) cannot
       * survive copy-on-write, so refusing them keeps `Object.defineProperty`
       * from silently mutating the snapshot target.
       */
      defineProperty: (_: S, key: keyof S, descriptor: PropertyDescriptor) => {
        if (
          !("value" in descriptor)
          || descriptor.get !== undefined
          || descriptor.set !== undefined
          || descriptor.writable !== true
          || descriptor.enumerable !== true
          || descriptor.configurable !== true
        ) return false;

        if (path.length === 0 && hasOwnProperty.call(this, key)) return false;

        const existing = Object.getOwnPropertyDescriptor(target, key as PropertyKey);
        if (existing !== undefined && existing.configurable === false) return false;
        if (!Object.isExtensible(target) && existing === undefined) return false;

        updater.updateMetaState(
          [...path, key],
          descriptor.value as ValueOf<S>,
          false,
          path.length === 0 ? undefined : target as object,
        );
        return true;
      },
      /**
       * @description A prototype change cannot be represented by the state
       * tree's copy-on-write clone. Allow only the no-op case; a real change
       * fails loudly instead of mutating the snapshot target.
       */
      setPrototypeOf: (_, proto) => Object.getPrototypeOf(target) === proto,
      /**
       * @description Extensibility is not tracked by the state tree, so a
       * `preventExtensions` would be lost on the next clone. Refuse it unless
       * the target is already non-extensible.
       */
      preventExtensions: () => !Object.isExtensible(target),
      /**
       * @description No `apply` trap: function-valued state members are values,
       * and `Map`/`Set` containers are served by their subclass handles, whose
       * methods are plain methods — nothing on the proxy is ever called.
       */
    } as ProxyHandler<S>) as Store<S>;

    if (cacheForTarget === undefined) {
      this.#proxyCache.set(target as object, new Map([[cacheKey, proxy]]));
    } else {
      cacheForTarget.set(cacheKey, proxy);
    }

    if (path.length > 0) markNestedWrapperCreated();
    _WRAPPER_ORIGIN_.set(proxy, target);

    return proxy;
  }
}
