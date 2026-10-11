/**
 * @description prototype method proxies for set.
 */
import type { PrimitiveState, ValueOf } from "../types";
import type {
  CreateProxyType, IteratorsType, ProxyableType, SetPrototypeProxyableFactoryType,
  SetPrototypeProxyableValueType, StatePath, UpdateMetaStateType,
} from "./types";
import { commitPath, iteratorProcessing, proxyable } from "./utils";

/**
 * @description Prototype-method factories for `Set`.
 *
 * Same shape as the `Map` factories: each mutating method commits once through
 * `commitPath`, then publishes the root through `updateMetaState`, because
 * `Set.prototype.add` runs on the raw `Set` and never reaches the proxy `set`
 * trap.
 *
 * 🌟 `Set` entries have no key, so `forEach` addresses its elements by their
 * numeric position. This is an approximation (a position is not a stable
 * identity once the set is reordered), but it keeps nested reads through
 * `forEach` writable instead of routing them to a placeholder path.
 *
 * 🌟 The parameter order is dictated by the caller in `src/store/core.ts`
 * (the `apply` trap) and must be kept in sync with it.
 */
const applySetPrototypeFactory: SetPrototypeProxyableFactoryType = <S extends PrimitiveState>(
  applyOriginFunction: SetPrototypeProxyableValueType,
  thisArg: Set<S>,
  state: S,
  parentTarget: Set<S>,
  createProxy: CreateProxyType<S>,
  path: StatePath,
  updateMetaState: UpdateMetaStateType<S>,
) => {
  const firstLevelKey = path[0] as keyof S;

  /** Publish a new set on the set's own path, cloning its host objects too. */
  const commitSet = (nextSet: Set<S>, value: unknown) => {
    commitPath(state, path, nextSet);
    updateMetaState([firstLevelKey], value as ValueOf<S>, false);
  };

  switch (applyOriginFunction.name) {
    case "add":
      return (value: S) => {
        if (parentTarget.has(value)) return parentTarget;

        const newValue = new Set(parentTarget) as Set<S>;
        newValue.add(value);
        commitSet(newValue, value);
        return newValue;
      };
    case "delete":
      return (value: S) => {
        if (!parentTarget.has(value)) return false;

        const newValue = new Set(parentTarget) as Set<S>;
        const result = newValue.delete(value);
        commitSet(newValue, undefined);
        return result;
      };
    case "clear":
      return () => {
        if (!parentTarget.size) return;

        commitSet(new Set() as Set<S>, undefined);
      };
    case "forEach":
      return (callback: (value: S, value2: S, set: Set<S>) => void) => {
        let index = -1;
        parentTarget.forEach((value, value2) => {
          index++;
          callback(
            proxyable(value)
              ? (
                createProxy(
                  value as ProxyableType<S>,
                  parentTarget,
                  [...path, index],
                  applyOriginFunction,
                ) as ValueOf<S>
              )
              : value,
            proxyable(value2)
              ? (
                createProxy(
                  value2 as ProxyableType<S>,
                  parentTarget,
                  [...path, index],
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

export default applySetPrototypeFactory;
