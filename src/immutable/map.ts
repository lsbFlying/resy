/**
 * @description prototype method proxies for map.
 */
import type { MapType, PrimitiveState, ValueOf } from "../types";
import type {
  CreateProxyType, IteratorsType,
  MapPrototypeProxyableFactoryType, MapPrototypeProxyableValueType,
  ProxyableType, StatePath, UpdateMetaStateType,
} from "./types";
import { commitPath, iteratorProcessing, proxyable } from "./utils";

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
  const firstLevelKey = path[0] as keyof S;

  /**
   * @description Publish a new map on the map's own path.
   *
   * `commitPath` clones the whole path, so the map's host object is replaced
   * too and any previously held snapshot stays frozen.
   */
  const commitMap = (nextMap: MapType<S>, value: unknown) => {
    commitPath(state, path, nextMap);
    updateMetaState([firstLevelKey], value as ValueOf<S>, false);
  };

  switch (applyOriginFunction.name) {
    case "get":
      return (key: keyof S): ValueOf<S> | undefined => {
        const value = parentTarget.get(key);
        return proxyable(value)
          ? createProxy(
            value as ProxyableType<S>,
            parentTarget,
            [...path, key],
            applyOriginFunction,
          ) as ValueOf<S>
          : value;
      };
    case "set":
      return (key: keyof S, value: ValueOf<S>) => {
        const oldValue = parentTarget.get(key);
        if (Object.is(oldValue, value)) return parentTarget;

        const newValue = new Map(parentTarget) as MapType<S>;
        newValue.set(key, value);
        commitMap(newValue, value);
        return newValue;
      };
    case "delete":
      return (key: keyof S) => {
        if (!parentTarget.has(key)) return false;

        const newValue = new Map(parentTarget) as MapType<S>;
        const result = newValue.delete(key);
        commitMap(newValue, undefined);
        return result;
      };
    case "clear":
      return () => {
        if (!parentTarget.size) return;

        commitMap(new Map() as MapType<S>, undefined);
      };
    case "forEach":
      return (callback: (value: ValueOf<S>, key: keyof S, map: Map<keyof S, ValueOf<S>>) => void) => {
        parentTarget.forEach((value, key) => {
          callback(
            proxyable(value)
              ? (
                createProxy(
                  value as ProxyableType<S>,
                  parentTarget,
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
