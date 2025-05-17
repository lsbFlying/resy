/**
 * @description prototype method proxies for map.
 */
import type { MapType, PrimitiveState, ValueOf } from "../types";
import type {
  KeyChainsSourceItemType, ProxyableType, CreateProxyType,
  MapPrototypeProxyableValueType, ApplyOriginFunctionType,
  IteratorsType, MapPrototypeProxyableFactoryType,
} from "./types";
import {
  createNewRefValue, iteratorProcessing, proxyable, reduceChanged,
} from "./utils";

const applyMapPrototypeFactory: MapPrototypeProxyableFactoryType = <S extends PrimitiveState>(
  applyOriginFunction: MapPrototypeProxyableValueType,
  thisArg: MapType<S>,
  state: S,
  parentTarget: MapType<S>,
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyLevel?: number,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
  stateMetaUpdate?: (
    key: keyof S,
    value: ValueOf<S>,
    isDelete: boolean,
    target: object | S,
    firstLevelKey?: keyof S,
    keyChains?: Set<KeyChainsSourceItemType<S>>,
    applyOriginFunction?: ApplyOriginFunctionType,
  ) => boolean,
) => {
  const fnName = applyOriginFunction.name;
  switch (fnName) {
    case "get":
      return (key: keyof S): ValueOf<S> | undefined => {
        const value = parentTarget.get(key);
        return proxyable(value)
          ? createProxy(
            value as ProxyableType<S>,
            parentTarget,
            firstLevelKey,
            (keyLevel ?? 0) + 1,
            new Set(keyChains).add({ key }),
            applyOriginFunction,
          ) as ValueOf<S>
          : value;
      };
    case "set":
      return (key: keyof S, value: ValueOf<S>) => {
        const oldValue = parentTarget.get(key);

        if (Object.is(oldValue, value)) return parentTarget;

        const newValue = createNewRefValue(parentTarget).set(key, value);
        const firstLevelValue = state[firstLevelKey!];
        reduceChanged(value as ValueOf<S>, new Set(keyChains).add({ key, }), firstLevelValue);

        stateMetaUpdate!(
          firstLevelKey!,
          createNewRefValue(firstLevelValue) as ValueOf<S>,
          false,
          state,
        );
        return newValue;
      };
    case "delete":
      return (key: keyof S) => {
        if (!parentTarget.has(key)) return false;

        const newValue = createNewRefValue(parentTarget);
        const result = newValue.delete(key);
        const firstLevelValue = state[firstLevelKey!];
        reduceChanged(newValue as ValueOf<S>, new Set(keyChains).add({ key, }), firstLevelValue);

        stateMetaUpdate!(
          firstLevelKey!,
          createNewRefValue(firstLevelValue) as ValueOf<S>,
          false,
          state,
        );
        return result;
      };
    case "clear":
      return () => {
        if (!parentTarget.size) return;

        const firstLevelValue = state[firstLevelKey!];
        reduceChanged(new Map() as ValueOf<S>, keyChains!, firstLevelValue);

        stateMetaUpdate!(
          firstLevelKey!,
          createNewRefValue(firstLevelValue) as ValueOf<S>,
          false,
          state,
        );
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
                  firstLevelKey,
                  (keyLevel ?? 0) + 1,
                  new Set(keyChains).add({ key }),
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
          firstLevelKey, keyLevel, keyChains, applyOriginFunction,
        );
        return iterators;
      };
    case "entries":
      return () => {
        const iterators = parentTarget.entries();
        iteratorProcessing(
          iterators as any as IteratorsType<S>, parentTarget, createProxy,
          firstLevelKey, keyLevel, keyChains, applyOriginFunction, true,
        );
        return iterators;
      };
    default:
      return applyOriginFunction as any;
  }
};

export default applyMapPrototypeFactory;
