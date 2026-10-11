/**
 * @description prototype method proxies for map.
 */
import type { MapType, PrimitiveState, ValueOf } from "../types";
import type {
  CreateProxyType, IteratorsType,
  MapPrototypeProxyableFactoryType, MapPrototypeProxyableValueType,
  ProxyableType, StatePath, UpdateMetaStateType,
} from "./types";
import { iteratorProcessing, proxyable, readAtPath } from "./utils";

/**
 * @description Prototype-method factories for `Map`.
 *
 * Every mutating method commits once through `commitPath` and then records the
 * resulting root through `updateMetaState`. Recording is required because
 * `Map.prototype.set` runs on the raw `Map` and therefore never reaches the
 * proxy `set` trap, so nothing else would publish the new root or the
 * changed-key payload for subscribers.
 *
 * 🌟 The parameter order is dictated by the caller in `src/store/core.ts`
 * (the `apply` trap) and must be kept in sync with it.
 */
const applyMapPrototypeFactory: MapPrototypeProxyableFactoryType = <S extends PrimitiveState>(
  applyOriginFunction: MapPrototypeProxyableValueType,
  thisArg: MapType<S>,
  state: S,
  parentTarget: MapType<S>,
  createProxy: CreateProxyType<S>,
  path: StatePath,
  updateMetaState: UpdateMetaStateType<S>,
) => {
  /**
   * @description Publish a new map on the map's own path.
   *
   * This delegates to `updateMetaState` instead of committing twice: an earlier
   * version called `commitPath` here *and* then `updateMetaState([path[0]], …)`,
   * and the second call overwrote the whole first-level entry with the map
   * object — `store.deep.m.set(x, y)` left `state.deep` as a `Map` and
   * `state.deep.m` as `undefined`.
   */
  const commitMap = (nextMap: MapType<S>) => {
    updateMetaState(path, nextMap as unknown as ValueOf<S>, false);
  };

  switch (applyOriginFunction.name) {
    case "get":
      return (key: keyof S): ValueOf<S> | undefined => {
        const value = parentTarget.get(key);
        return proxyable(value)
          ? createProxy(
            value as ProxyableType<S>,
            [...path, key],
            applyOriginFunction,
          ) as ValueOf<S>
          : value;
      };
    case "has":
      return (key: keyof S): boolean => {
        /**
         * @description `parentTarget` is the container *proxy*, so the built-in
         * `Map.prototype.has` cannot run on it (`incompatible receiver`). The
         * raw source is the right receiver for a membership test.
         */
        const source = readAtPath(state, path);
        return source instanceof Map ? source.has(key) : false;
      };
    case "set":
      return (key: keyof S, value: ValueOf<S>) => {
        const oldValue = parentTarget.get(key);
        if (Object.is(oldValue, value)) return parentTarget;

        const newValue = new Map(parentTarget) as MapType<S>;
        newValue.set(key, value);
        commitMap(newValue);
        return newValue;
      };
    case "delete":
      return (key: keyof S) => {
        /**
         * @description `parentTarget` is the container *proxy*, so its own
         * `Map` methods cannot be called on it (`incompatible receiver`). The
         * clone into a real `Map` is both the receiver and the value that gets
         * committed, so it is used for the membership test as well.
         */
        const newValue = new Map(parentTarget) as MapType<S>;
        if (!newValue.has(key)) return false;

        const result = newValue.delete(key);
        commitMap(newValue);
        return result;
      };
    case "clear":
      return () => {
        if (!new Map(parentTarget).size) return;

        commitMap(new Map() as MapType<S>);
      };
    case "forEach":
      return (callback: (value: ValueOf<S>, key: keyof S, map: Map<keyof S, ValueOf<S>>) => void) => {
        parentTarget.forEach((value, key) => {
          callback(
            proxyable(value)
              ? (
                createProxy(
                  value as ProxyableType<S>,
                  [...path, key],
                  applyOriginFunction,
                ) as ValueOf<S>
              )
              : value,
            /**
             * @description There is no need to proxy the `key`.
             * Even if the keys are reference types and the internal data of the referenced objects changes,
             * it should not trigger changes in the `Map`,
             * as the state of the `Map` depends on the key's reference rather than the key's content.
             */
            key,
            // TODO waiting test
            thisArg,
          );
        });
      };
    case "keys":
      return () => {
        const iterators = parentTarget.keys();
        iteratorProcessing(
          iterators as any as IteratorsType<S>, parentTarget, createProxy,
          path, applyOriginFunction,
        );
        return iterators;
      };
    case "values":
      return () => {
        const iterators = parentTarget.values();
        iteratorProcessing(
          iterators as any as IteratorsType<S>, parentTarget, createProxy,
          path, applyOriginFunction,
        );
        return iterators;
      };
    case "entries":
      return () => {
        const iterators = parentTarget.entries();
        iteratorProcessing(
          iterators as any as IteratorsType<S>, parentTarget, createProxy,
          path, applyOriginFunction, true,
        );
        return iterators;
      };
    default:
      return applyOriginFunction as any;
  }
};

export default applyMapPrototypeFactory;
