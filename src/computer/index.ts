import type { PrimitiveState } from "../types";
import type { AnyBoundFn } from "../store/types";
import type MetaStore from "../store/core";
import { useDebugValue, useEffect, useRef, useState } from "react";

/** @desc class of computed */
export default class Computer<S extends PrimitiveState> {
  constructor(public $metaStore: MetaStore<S>) {
    $metaStore.computed = this.computed;
    $metaStore.useComputed = this.useComputed;
  }

  // The identifier indicating that the property function body is performing calculations.
  computing = false;

  // StateKeys of computed internal subscribers, which are subscription attribute dependencies
  readonly computedDeps = new Set<keyof S>();

  // cache for computed class components
  computedCache = null;
  // computed function args for computed class components
  computedArgs: any[] | null = null;
  stateRefsHook?(deps: Set<PropertyKey>): void;

  shallowArrayNotEqual(array1: any[], array2: any[]) {
    if (array1.length !== array2.length) {
      return true;
    } else {
      for (let i = 0; i < array1.length; i++) {
        if (!Object.is(array1[i], array2[i])) {
          return true;
        }
      }
    }
    return false;
  };

  // TODO waiting developing and upgrade
  computed = <A = any>(fn: AnyBoundFn, ...args: A[]) => {
    if (!this.computedArgs) {
      this.computedArgs = args;
    } else {
      // Compare old and new args
      if (this.shallowArrayNotEqual(args, this.computedArgs)) {
        this.computedArgs = args;
        this.computedCache = null;
      }
    }

    if (this.computedCache) {
      return this.computedCache;
    }

    fn._unsubscribe_?.();

    const { computedDeps } = this;
    computedDeps.clear();

    this.computing = true;
    const res = fn(...args);
    this.computing = false;
    this.stateRefsHook?.(computedDeps);

    const stateKeys = Array.from(computedDeps);

    fn._unsubscribe_ =  this.$metaStore._subscriber_.subscribe(() => {
      /**
       * @desc Since the `fn` function is already bound to the `this` instance of the class component,
       * and the state rendering of class components does not have
       * the same top-level Hook rules restriction as Hook components,
       * we can directly remove `fn` from `computedCache` here.
       * This allows the new computed property result to be recalculated
       * in the `render` function upon state updates.
       * Otherwise, it will continue using the initially cached result from `computedCache`.
       * Precisely because class components are not constrained
       * by the top-level Hook rules like Hook components,
       * their implementation of computed properties is much simpler.
       */
      this.computedCache = null;
    }, stateKeys);

    this.computedCache = res;

    return res;
  };

  /**
   * @desc This hook-based state update design prevents rendering issues
   * where computed properties might use hook component states
   * that weren't destructured in useStore, ensuring proper updates.
   */
  useComputed = <A = any>(fn: AnyBoundFn, ...args: A[]) => {
    const { computedDeps } = this;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const computedRef = useRef<{ fn: AnyBoundFn }>(null);
    computedRef.current = { fn };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [params, updateParams] = useState(() => args);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      // Update params by using shallow contrast of args elements within useEffect
      updateParams(args);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, args);

    const [
      { result, stateKeys }, update,
      // eslint-disable-next-line react-hooks/rules-of-hooks
    ] = useState(() => {
      // Clear the previous dirty dependencies before collecting them
      computedDeps.clear();

      this.computing = true;
      // Execute the computed function body to obtain the result and collect dependencies
      const res = computedRef.current!.fn(...params);
      this.computing = false;

      return {
        result: res,
        stateKeys: Array.from(computedDeps) as (keyof S)[],
      };
    });

    const { namespace } = this.$metaStore._options_;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    __DEV__ && useDebugValue({
      [fn._name_!]: result,
      ...(
        namespace
          ? { namespace }
          : null
      ),
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => this.$metaStore._subscriber_.subscribe(() => {
      /**
       * Perform dependency collection and processing again to
       * prevent dependency changes caused by conditional logic
       */
      computedDeps.clear();

      this.computing = true;
      /**
       * @desc This needs to be executed immediately after
       * clearing the dependency collector in order to obtain new dependencies.
       */
      const res = computedRef.current!.fn(...params);
      this.computing = false;

      const newDeps = Array.from(computedDeps);

      /**
       * Perform dependency collection and processing again to
       * prevent dependency changes caused by conditional logic.
       */
      // update computed deps
      (this.shallowArrayNotEqual(stateKeys, newDeps)) && update(prevState => ({
        ...prevState,
        stateKeys: newDeps,
      }));

      // update computed result
      update(prevState => ({
        ...prevState,
        result: res,
      }));

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, stateKeys), [stateKeys, params]);

    return result;
  };
};
