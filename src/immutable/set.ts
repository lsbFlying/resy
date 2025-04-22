/**
 * @description prototype method proxies for set.
 */

import type { PrimitiveState, ValueOf } from "../types";
import type {
  ProxyableType, CreateProxyType, SetPrototypeProxyableValueType,
  KeyChainsSourceItemType, SetPrototypeProxyableFactoryType,
  ApplyOriginFunctionType, IteratorsType,
} from "./types";
import { iteratorProcessing, proxyable } from "./utils";

const applySetPrototypeFactory: SetPrototypeProxyableFactoryType = <S extends PrimitiveState>(
  applyOriginFunction: SetPrototypeProxyableValueType,
  thisArg: Set<S>,
  parentTarget: Set<S>,
  createProxy: CreateProxyType<S>,
  firstLevelKey?: keyof S,
  keyChains?: Set<KeyChainsSourceItemType<S>>,
  singleUpdate?: (
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
        const curKey = Array.from(keyChains!).at(-1)?.key;

        if (parentTarget.has(value)) return parentTarget;

        // todo dev, parentTarget发生变化，不符合“不可变性设计原则”
        parentTarget.add(value);

        const result = new Set(parentTarget);

        singleUpdate?.(
          curKey!,
          result as ValueOf<S>,
          false,
          parentTarget,
          firstLevelKey,
          keyChains,
          applyOriginFunction,
        );
        return result;
      };
    case "delete":
      return (value: S) => {
        const curKey = Array.from(keyChains!).at(-1)?.key;
        if (!parentTarget.has(value)) return false;

        // todo dev, parentTarget发生变化，不符合“不可变性设计原则”
        parentTarget.delete(value);

        return singleUpdate!(
          curKey!,
          new Set(parentTarget) as ValueOf<S>,
          false,
          parentTarget,
          firstLevelKey,
          keyChains,
          applyOriginFunction,
        );
      };
    case "clear":
      return () => {
        const curKey = Array.from(keyChains!).at(-1)?.key;

        if (!parentTarget.size) return;

        singleUpdate?.(
          curKey!,
          new Set() as ValueOf<S>,
          false,
          parentTarget,
          firstLevelKey,
          keyChains,
          applyOriginFunction,
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
          firstLevelKey, keyChains, applyOriginFunction,
        );
        return iterators;
      };
    case "values":
      return () => {
        const iterators = parentTarget.values();
        iteratorProcessing(
          iterators as any as IteratorsType<S>, parentTarget, createProxy,
          firstLevelKey, keyChains, applyOriginFunction,
        );
        return iterators;
      };
    case "entries":
      return () => {
        const iterators = parentTarget.entries();
        iteratorProcessing(
          iterators as any as IteratorsType<S>, parentTarget, createProxy,
          firstLevelKey, keyChains, applyOriginFunction, true,
        );
        return iterators;
      };
    default:
      return applyOriginFunction as any;
  }
};

export default applySetPrototypeFactory;
