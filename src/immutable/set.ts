/**
 * @description prototype method proxies for set.
 */
import type { PrimitiveState, ValueOf } from "../types";
import type {
  ProxyableType, CreateProxyType, SetPrototypeProxyableValueType,
  KeyChainsSourceItemType, SetPrototypeProxyableFactoryType,
  ApplyOriginFunctionType, IteratorsType,
} from "./types";
import { createNewRefValue, iteratorProcessing, proxyable, reduceChanged } from "./utils";

// TODO waiting develop sure
const applySetPrototypeFactory: SetPrototypeProxyableFactoryType = <S extends PrimitiveState>(
  applyOriginFunction: SetPrototypeProxyableValueType,
  thisArg: Set<S>,
  state: S,
  parentTarget: Set<S>,
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
    case "add":
      return (value: S) => {
        if (parentTarget.has(value)) return parentTarget;

        const newValue = createNewRefValue(parentTarget).add(value);
        const firstLevelValue = state[firstLevelKey!];
        reduceChanged(newValue as ValueOf<S>, keyChains!, firstLevelValue);

        stateMetaUpdate!(
          firstLevelKey!,
          createNewRefValue(firstLevelValue) as ValueOf<S>,
          false,
          state,
        );
        return newValue;
      };
    case "delete":
      return (value: S) => {
        if (!parentTarget.has(value)) return false;

        const newValue = createNewRefValue(parentTarget);
        const result = newValue.delete(value);
        const firstLevelValue = state[firstLevelKey!];
        reduceChanged(newValue as ValueOf<S>, keyChains!, firstLevelValue);

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
        reduceChanged(new Set() as ValueOf<S>, keyChains!, firstLevelValue);

        stateMetaUpdate!(
          firstLevelKey!,
          createNewRefValue(firstLevelValue) as ValueOf<S>,
          false,
          state,
        );
      };
    case "forEach":
      return (callback: (value: S, value2: S, set: Set<S>) => void) => {
        parentTarget.forEach((value, value2) => {
          callback(
            proxyable(value)
              ? (
                createProxy(
                  value as ProxyableType<S>,
                  parentTarget,
                  firstLevelKey,
                  (keyLevel ?? 0) + 1,
                  // todo waiting modified
                  new Set(keyChains).add({ key: "?" }),
                  applyOriginFunction,
                ) as ValueOf<S>
              )
              : value,
            proxyable(value2)
              ? (
                createProxy(
                  value2 as ProxyableType<S>,
                  parentTarget,
                  firstLevelKey,
                  (keyLevel ?? 0) + 1,
                  // todo waiting modified
                  new Set(keyChains).add({ key: "?" }),
                  applyOriginFunction,
                ) as ValueOf<S>
              )
              : value2,
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
          firstLevelKey, keyLevel, keyChains, applyOriginFunction,
        );
        return iterators;
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

export default applySetPrototypeFactory;
