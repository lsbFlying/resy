import type {
  AnyBoundFn, InitialState, StateWithThisType, Store,
  StoreOptions, UseMacroStore, InnerStoreOptions,
} from "./types";
import type { AnyFn, MapType, PrimitiveState, ValueOf } from "../types";
import type { ClassStoreType } from "../class-connect/types";
import type { SetStateType, SyncUpdateType } from "../updater/types";
import type { SubscribeType, UseSubscriptionType } from "../subscribe/types";
import type { RestoreType } from "../restore/types";
import type { ApplyOriginFunctionType, StatePath } from "../immutable/types";
import type { UseComputedType, ComputedType } from "../computer/types";
import { optionsErrorProcessing, stateErrorProcessing } from "./errors";
import { _RESY_BRAND_, DEFAULT_OPTIONS } from "./static";
import { hasOwnProperty } from "../utils";
import { proxyable, readAtPath } from "../immutable/utils";
import { _MAP_SET_PROTOTYPE_PROXYABLE_TARGET_ } from "../immutable";
import MetaState from "../state";
import Scheduler from "../scheduler";
import Subscriber from "../subscribe";
import Updater from "../updater";
import Restorer from "../restore";
import Computer from "../computer";

/**
 * @description Encode a state path into a cache key.
 *
 * A plain `join` cannot separate segments unambiguously: `['a\u0001b']` and
 * `['a', 'b']` would produce the same string. Each segment is therefore encoded
 * as a type prefix plus its text with the separator escaped
 * (`\u0001` becomes `\u0001\u0001`), so a single separator can only ever mark a
 * boundary between segments and distinct paths cannot collide.
 *
 * Symbol segments fall back to their description, which is a deliberate
 * approximation recorded in `design.md` (Open Questions).
 */
const SEPARATOR = "\u0001";

const encodeSegment = (key: PropertyKey): string => {
  const prefixed = typeof key === "string"
    ? `s${key}`
    : typeof key === "number"
      ? `n${key}`
      : `y${key.description ?? String(key)}`;
  return prefixed.split(SEPARATOR).join(SEPARATOR + SEPARATOR);
};

export const pathKey = (path: StatePath): string =>
  path.map(encodeSegment).join(SEPARATOR);

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
   * @description Proxy cache keyed by target object, then by encoded path.
   *
   * The inner key MUST be the path rather than the target alone: the same
   * object can be reachable through several paths, and a proxy can only carry
   * one path for its writable location. Caching by path also makes repeated
   * reads of an unchanged location return the very same wrapper, which is what
   * makes a nested object usable as a `useEffect` dependency.
   */
  #proxyCache = new WeakMap<object, Map<string, Store<S>>>();

  // A proxy object with the capabilities of updating and data tracking.
  readonly store: Store<S>;

  useStore: UseMacroStore<S> = () => this._metaState_.useMetaState();
  /** ============================== For Core Render Element end ============================== */

  /** Helper function for binding function properties  */
  _boundFnProcessing_(
    key: keyof S,
    value: AnyBoundFn,
    thisArg: Store<S> | ClassStoreType<S> = this.store,
  ) {
    const state = this._$state_;

    const boundFn = (
      (...args: unknown[]) => (value as AnyFn).apply(thisArg, args)
    ) as AnyBoundFn;

    boundFn._bound_ = true;
    boundFn._name_ = value.name;

    state[key] = boundFn as ValueOf<S>;

    return boundFn as ValueOf<S>;
  }

  /**
   * Create Store Proxy
   *
   * @param target - The object the proxy wraps.
   * @param path - The ordered path from the root state to `target`. The empty
   * path marks the root state object itself, so `path.length === 0` identifies
   * the first level and `path[0]` is the first-level key of any nested proxy.
   * @param applyOriginFunction - Carried along the `Map`/`Set` prototype-method
   * chain so the `apply` trap can route back into the right factory.
   */
  #createProxy(
    target: object = this._$state_,
    path: StatePath = [],
    applyOriginFunction?: ApplyOriginFunctionType,
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
    if (cached !== undefined) return cached;

    let proxy: Store<S>;
    proxy = new Proxy(target, {
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

        const sourceFromThis = hasOwnProperty.call(this, key);

        /**
         * @description Array branch (D12).
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
        /**
         * @description A repeated read of an unchanged location must return the
         * same wrapper. Commits replace the objects on the path, so a new
         * target simply has no cache entry yet — no explicit invalidation is
         * needed, and stale entries die with their objects.
         */
        if (Array.isArray(target)) {
          /**
           * @description Read from `target` once a commit has left this wrapper
           * behind, and from the live tree while it is still the current value.
           *
           * The object branch reads `target`, which is what makes a reference
           * obtained before a write a faithful snapshot of it. Reading the live
           * tree unconditionally would instead make a held array follow every
           * later commit, so arrays and objects would behave differently.
           * Comparing the live value against `target` costs one path walk and
           * keeps both branches consistent.
           */
          const live = readAtPath(this._$state_, path);
          const source = live === target ? live : target;
          if (!Array.isArray(source)) return undefined;

          const member = (source as unknown as Record<PropertyKey, unknown>)[key as PropertyKey];
          if (typeof member !== "function") {
            /**
             * @description Element reads must be wrapped like any other nested
             * read, otherwise `store.list[1].id = 99` would reach the raw
             * element object and bypass the proxy chain entirely.
             */
            if (immutable && !sourceFromThis && proxyable(member)) {
              return this.#createProxy(
                member as object,
                [...path, key],
                applyOriginFunction,
              );
            }
            return !sourceFromThis ? member : this[key as keyof MetaStore<S>];
          }

          return (...args: unknown[]) => {
            const current = readAtPath(this._$state_, path);
            if (!Array.isArray(current)) return undefined;

            const draft = current.slice();
            const result = Reflect.apply(member, draft, args);

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
              updater.updateMetaState(path, draft as ValueOf<S>, false);
            }

            // Methods that return the array itself (`push` returns a length, but
            // `sort`/`reverse`/`splice` return `this`) must hand back this very
            // proxy so that identity comparisons and chaining both hold.
            return result === draft ? proxy : result;
          };
        }

        if (!sourceFromThis && immutable && proxyable(value)) {
          return this.#createProxy(
            value as object,
            [...path, key],
            applyOriginFunction,
          );
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
          return this._boundFnProcessing_(key, value);
        }

        return !sourceFromThis ? value : this[key as keyof MetaStore<S>];
      },
      set: (_: S, key: keyof S, value: ValueOf<S>) => updater.updateMetaState(
        [...path, key], value, false,
      ),
      // Delete will also play an updating role
      deleteProperty: (_: S, key: keyof S) => updater.updateMetaState(
        [...path, key], undefined as ValueOf<S>, true,
      ),
      // TODO waiting develop
      // The `apply` here is written specifically for prototype chain functions
      // that are applicable to proxyable types such as `Map`, and `Set`.
      apply: (applyOriginFunction: any, thisArg: any, argArray: any[]) => Reflect.apply(
        _MAP_SET_PROTOTYPE_PROXYABLE_TARGET_.get(applyOriginFunction)!(
          applyOriginFunction, thisArg, this._$state_, target as (MapType<S> & Set<S>),
          /**
           * @description The recursive proxy factory is passed to the Map/Set
           * factories as a plain callback, so wrapping it in an arrow function
           * keeps the private `this` of `MetaStore` bound. Passing the method
           * itself would detach `this` and make every nested Map/Set read throw.
           */
          (
            nestedTarget: object,
            _parentTarget: object,
            nestedPath: StatePath,
            nestedApplyOriginFunction?: ApplyOriginFunctionType,
          ) => this.#createProxy(nestedTarget, nestedPath, nestedApplyOriginFunction),
          path,
          updater.updateMetaState,
        ),
        thisArg,
        argArray,
      ),
    } as ProxyHandler<S>) as Store<S>;

    const perTarget = this.#proxyCache.get(target as object);
    if (perTarget === undefined) {
      this.#proxyCache.set(target as object, new Map([[cacheKey, proxy]]));
    } else {
      perTarget.set(cacheKey, proxy);
    }

    return proxy;
  }
}
