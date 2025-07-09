import type { PrimitiveState } from "../types";
import type { AnyBoundFn } from "../store/types";
import type StoreMeta from "../store/core";
import type Subscriber from "../subscribe";
import { useDebugValue, useEffect, useRef, useState } from "react";

/** @desc class of computed */
export default class Computer<S extends PrimitiveState> {
  constructor(
    public $storeMeta: StoreMeta<S>,
    public $subscriber: Subscriber<S>,
  ) {
    $storeMeta.useComputed = this.useComputed;
    $storeMeta.computed = this.computed;
  }

  // The identifier indicating that the property function body is performing calculations.
  computing = false;

  // TODO computedDeps waiting upgrade
  // TODO 考虑computedDeps是否要移除全局设置，是否要从每一个computedFn上面进行挂在，
  //  考虑全局的共同依赖是否会对不同的computed的依赖收集逻辑有影响
  // StateKeys of computed internal subscribers, which are subscription attribute dependencies
  readonly computedDeps = new Set<keyof S>();

  // cache for computed class components
  computedCache = null;
  // computed function args for computed class components
  computedArgs: any[] | null = null;

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

  // TODO waiting upgrade
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

    fn.__unsubscribe__?.();

    const { computedDeps } = this;
    computedDeps.clear();

    this.computing = true;
    const res = fn(...args);
    this.computing = false;

    const stateKeys = Array.from(computedDeps);

    fn.__unsubscribe__ =  this.$subscriber.subscribe(() => {
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

  // TODO waiting upgrade optimize (暂时应该没有属性依赖记录收集销毁的逻辑问题)
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

    const { namespace } = this.$storeMeta._options_;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    __DEV__ && useDebugValue({
      [fn.__name__!]: result,
      ...(
        namespace
          ? { namespace }
          : null
      ),
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => this.$subscriber.subscribe(() => {
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
