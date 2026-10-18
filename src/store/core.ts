import type {
  AnyBoundFn, InitialState, StateWithThisType, Store,
  StoreOptions, UseMacroStore, InnerStoreOptions,
} from "./types";
import type { AnyFn, PrimitiveState, ValueOf } from "../types";
import type { ClassStoreType } from "../class-connect/types";
import type { SetStateType, SyncUpdateType } from "../updater/types";
import type { SubscribeType, UseSubscriptionType } from "../subscribe/types";
import type { RestoreType } from "../restore/types";
import type { SetMemberMarker, StatePath, StatePathSegment } from "../immutable/types";
import type { UseComputedType, ComputedType } from "../computer/types";
import { optionsErrorProcessing, stateErrorProcessing } from "./errors";
import { _RESY_BRAND_, DEFAULT_OPTIONS } from "./static";
import { pathKey } from "./utils";
import { hasOwnProperty } from "../utils";
import { isPenetrable, proxyable, readAtPath } from "../immutable/utils";
import { _SET_MEMBER_ } from "../immutable/static";
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
    this._$state_ = { ...reducerState };

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

  // After unmount resetting the state (`restoreProcessing` function has been executed),
  // it is in a frozen state where updates are prohibited.
  // TODO waiting considering, the scenes it contains are a bit complex
  // #freezing: boolean | undefined;
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
   * @description Reverse map from a read-side wrapper (nested proxy or
   * container handle) back to the raw value it wraps.
   *
   * Methods must normalize their arguments through it: identity searches
   * (indexOf/includes, Set.has) compare against raw elements, and committing
   * a wrapper into the tree would store the wrapper itself as state data.
   */
  #wrapperOrigin = new WeakMap<object, unknown>();

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
   */
  _wrapContainerValue_(
    value: unknown,
    indexOrKey: StatePathSegment,
    parentPath: StatePath,
  ) {
    if (!this._options_.immutable || typeof value === "function") return value;
    if (value instanceof Map || value instanceof Set) {
      return this.#containerHandle(value as object, [...parentPath, indexOrKey]);
    }
    if (proxyable(value)) {
      /**
       * @description Numeric indices (handed to callbacks and iterators by
       * native code) are normalized to strings so they match the property
       * keys the proxy traps produce for the same position — otherwise one
       * element would get two cache entries and two identities.
       */
      const key = typeof indexOrKey === "number" ? String(indexOrKey) : indexOrKey;
      return this.#createProxy(value as object, [...parentPath, key]);
    }
    return value;
  }

  /**
   * @description Fetch (or create) the subclass handle for a `Map`/`Set` value
   * at a path. Handles live in the same cache as the proxies and obey the same
   * invalidation invariant: a commit replaces the container, the new container
   * has no entry yet, and a fresh handle is created while the old one dies
   * together with its container.
   */
  #containerHandle(container: object, path: StatePath) {
    const cacheKey = pathKey(path);
    const perTarget = this.#proxyCache.get(container);
    const cached = perTarget?.get(cacheKey);
    if (cached !== undefined) return cached;

    const handle = container instanceof Map
      ? new ResyMap<unknown, unknown>(this, path, container as Map<unknown, unknown>)
      : new ResySet<unknown>(this, path, container as Set<unknown>);

    if (perTarget === undefined) {
      this.#proxyCache.set(container, new Map([[cacheKey, handle]]));
    } else {
      perTarget.set(cacheKey, handle);
    }
    this.#wrapperOrigin.set(handle, container);
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
   * @description Resolve a wrapper reference back to the raw value it wraps —
   * the container handles normalize their method arguments through this;
   * anything else is returned unchanged.
   */
  _unwrapWrapper_(value: unknown): unknown {
    return typeof value === "object" && value !== null
      ? this.#wrapperOrigin.get(value) ?? value
      : value;
  }

  /**
   * @description Normalize a value that is about to be written into the state.
   *
   * Wrappers are read-side objects: committing one would store a proxy (or a
   * `ResyMap`/`ResySet` handle) inside `_$state_`, where it would poison
   * serialization, identity comparison and `prevState`. Array methods and the
   * container handles already normalize their arguments; the public write
   * entry points go through this method so they cannot drift.
   *
   * Only one level is normalized, which is sufficient by construction: reading
   * a nested value always produces a new wrapper, while the values *inside* a
   * wrapper are still raw until read.
   */
  _normalizeWriteValue_(value: unknown): unknown {
    const unwrap = (candidate: unknown): unknown =>
      (typeof candidate === "object" && candidate !== null
        ? this.#wrapperOrigin.get(candidate) ?? candidate
        : candidate);

    const raw = unwrap(value);
    if (raw !== value) return raw;

    if (Array.isArray(value)) {
      // Scan before copying: the common case is an array of raw values (every
      // array method commits one), and it must stay allocation-free.
      const changed = value.some(item => unwrap(item) !== item);
      return changed ? value.map(item => unwrap(item)) : value;
    }

    if (value instanceof Map) {
      let changed = false;
      value.forEach(member => {
        changed = changed || unwrap(member) !== member;
      });
      if (!changed) return value;
      const next = new Map<unknown, unknown>();
      value.forEach((member, key) => { next.set(key, unwrap(member)); });
      return next;
    }

    if (value instanceof Set) {
      let changed = false;
      value.forEach(member => {
        changed = changed || unwrap(member) !== member;
      });
      if (!changed) return value;
      const next = new Set<unknown>();
      value.forEach(member => { next.add(unwrap(member)); });
      return next;
    }

    if (isPenetrable(value)) {
      const record = value as Record<PropertyKey, unknown>;
      const keys: PropertyKey[] = [
        ...Object.keys(value as object),
        ...Object.getOwnPropertySymbols(value as object),
      ];
      const changed = keys.some(key => unwrap(record[key]) !== record[key]);
      if (!changed) return value;

      const next = Object.create(Object.getPrototypeOf(value)) as Record<PropertyKey, unknown>;
      for (const key of keys) next[key] = unwrap(record[key]);
      return next;
    }

    return value;
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
  _linkClone_(path: StatePath, previous: unknown, next: unknown, force = false): void {
    if (path.length === 0) return;
    if (typeof previous !== "object" || previous === null) return;
    if (typeof next !== "object" || next === null) return;
    if (previous === next) return;

    const key = pathKey(path);
    let lineage = this.#lineage.get(key);
    if (lineage === undefined) {
      if (!force && !this.#proxyCache.has(previous)) return;
      lineage = new WeakMap();
      this.#lineage.set(key, lineage);
    }
    lineage.set(previous, next);
  }

  /** Record every level a `commitPath` call cloned. */
  _linkReplaced_(replaced: Array<[StatePath, object, object]>): void {
    for (const [path, previous, next] of replaced) {
      this._linkClone_(path, previous, next);
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
   */
  _isActiveHandle_(target: object, path: StatePath): boolean {
    if (path.length === 0) return true;

    const live = readAtPath(this._$state_, path);
    if (live === target) return true;

    const lineage = this.#lineage.get(pathKey(path));
    if (lineage === undefined) return false;

    let current: object = target;
    const visited: object[] = [];
    for (let steps = 0; steps < 10000; steps++) {
      const next = lineage.get(current);
      if (next === undefined) break;
      visited.push(current);
      current = next;
      if (current === live) {
        // Path compression keeps long write chains cheap to resolve.
        visited.forEach(node => lineage.set(node, current));
        return true;
      }
    }
    return false;
  }

  /**
   * @description Development-only, once-per-path notice for a write that was
   * ignored because its handle was detached. Silent in production, matching
   * the "no-op, never throw" contract for detached writes.
   */
  _warnDetached_(path: StatePath): void {
    if (!__DEV__) return;
    const key = pathKey(path);
    if (this.#warnedDetachedPaths.has(key)) return;
    this.#warnedDetachedPaths.add(key);
    const text = path.map(segment => String(segment)).join(".");
    console.warn(
      `resy: ignored a write through a detached handle at path "${text}". `
      + "The element is no longer part of the current state; read it again from the store.",
    );
  }

  /**
   * @description Wrap an array iterator so the elements it yields go through
   * `_wrapContainerValue_` like any indexed read would.
   *
   * Detection at the call site is duck-typed on the returned shape (an object
   * with a callable `next`), so any method that produces an iterator is
   * covered without inspecting method names. The only shape special-cased is
   * the entries pair, identified by method identity: its `[index, value]`
   * tuples keep the index raw and wrap the value.
   */
  #wrapIteratorResult(
    iterator: { next: () => { done: boolean; value: unknown } },
    isEntries: boolean,
    parentPath: StatePath,
  ) {
    let index = -1;
    const wrapped = {
      next: () => {
        const step = iterator.next();
        if (step.done) return step;
        if (isEntries) {
          const [i, v] = step.value as [number, unknown];
          return { done: false, value: [i, this._wrapContainerValue_(v, i, parentPath)] };
        }
        index++;
        return { done: false, value: this._wrapContainerValue_(step.value, index, parentPath) };
      },
    };
    (wrapped as unknown as Record<PropertyKey, unknown>)[Symbol.iterator] = () => wrapped;
    return wrapped;
  }

  /**
   * Create Store Proxy
   *
   * @param target - The object the proxy wraps.
   * @param path - The ordered path from the root state to `target`. The empty
   * path marks the root state object itself, so `path.length === 0` identifies
   * the first level and `path[0]` is the first-level key of any nested proxy.
   */
  #createProxy(
    target: object = this._$state_,
    path: StatePath = [],
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
    const cacheKey = pathKey(path);
    const cacheForTarget = this.#proxyCache.get(target as object);
    const cached = cacheForTarget?.get(cacheKey);
    if (cached !== undefined) return cached as Store<S>;

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
              return this._wrapContainerValue_(member, key, path);
            }
            return this[key as keyof MetaStore<S>];
          }

          return (...args: unknown[]) => {
            /**
             * @description A held array handle may have been detached by a
             * whole-array replacement. Its methods must then be inert: acting
             * on the array that now occupies the path would be a write into an
             * unrelated element of the current tree.
             */
            if (path.length > 0 && !this._isActiveHandle_(target as object, path)) {
              return undefined;
            }

            const current = readAtPath(this._$state_, path);
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
              input.map(arg => this.#wrapperOrigin.get(arg as object) ?? arg);

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
                    typeof index === "number" && index >= 0 && index < draft.length
                    && draft[index] === arg
                      ? this._wrapContainerValue_(arg, index, path)
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
            if (changed) {
              /**
               * @description The commit replaces the array at `path` with the
               * draft. Linking old→draft keeps the handle (and any handle that
               * produced this one) following its own commits.
               */
              this._linkClone_(path, current, draft, true);
              updater.updateMetaState(path, draft as ValueOf<S>, false);
            }

            // Methods that return the array itself (`push` returns a length, but
            // `sort`/`reverse`/`splice` return `this`) must hand back this very
            // proxy so that identity comparisons and chaining both hold.
            if (result === draft) return proxy;

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
              return this.#wrapIteratorResult(
                result as { next: () => { done: boolean; value: unknown } },
                member === Array.prototype.entries,
                path,
              );
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
            if (immutable && foundIndex >= 0 && proxyable(result)) {
              return this._wrapContainerValue_(result, foundIndex, path);
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
          return this._wrapContainerValue_(value, key, path);
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
       * @description No `apply` trap: function-valued state members are values,
       * and `Map`/`Set` containers are served by their subclass handles, whose
       * methods are plain methods — nothing on the proxy is ever called.
       */
    } as ProxyHandler<S>) as Store<S>;

    const perTarget = this.#proxyCache.get(target as object);
    if (perTarget === undefined) {
      this.#proxyCache.set(target as object, new Map([[cacheKey, proxy]]));
    } else {
      perTarget.set(cacheKey, proxy);
    }

    this.#wrapperOrigin.set(proxy, target);

    return proxy;
  }
}
