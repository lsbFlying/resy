import type { IteratorAbleTypeArgs, Signal } from "./types";
import type { ClassStoreType } from "../classConnect/types";
import type { PrimitiveState, ValueOf } from "../types";
import type { Store } from "../store/types";
import {
  __SIGNAL_EFFECT_STORE_KEYS_COLLECTOR_MAP__, __SIGNAL_EFFECT_STORE_KEYS_COLLECTING__,
  __DEEP_SPLICE_KEY__, __SIGNAL_IDENTIFIER_KEY__, __CHAIN_KEY_UNIQUE_ID_PREFIX__,
} from "./static";
import { signalRunScopeErrorProcessing } from "./errors";
import { hasOwnProperty, whatsType } from "../utils";

const idMap = new Map<any, string>();
let nextId = 1;
/**
 * @description Generate a unique ID based on data reference,
 * with the reference unchanged and the ID unchanged.
 */
export const uniqueIdByValue = (value: any, prefix?: string) => {
  if (!idMap.has(value)) {
    idMap.set(value, `${prefix ?? __CHAIN_KEY_UNIQUE_ID_PREFIX__}${nextId++}`);
  }
  return idMap.get(value)!;
};

/**
 * @description Obtain the final chained property value by accumulating an array of property paths
 * through string concatenation and accessing the object properties sequentially.
 */
export const retrieveValue = <S extends PrimitiveState>(
  keyChains: string,
  store: ClassStoreType<S>,
  argsMap: Map<string, unknown[]>,
) => {
  const keys = (keyChains as string).split(__DEEP_SPLICE_KEY__);

  const argsPathSet = new Set<string>();
  return keys.reduce((prevValue: any, prop: string, currentIndex, array) => {
    argsPathSet.add(prop);
    (currentIndex < (array.length - 1)) && argsPathSet.add(array[currentIndex + 1]);

    const curValue = prop.startsWith(__CHAIN_KEY_UNIQUE_ID_PREFIX__) ? prevValue : prevValue?.[prop];

    if (typeof curValue === "function") {
      const args = argsMap.get(Array.from(argsPathSet).join(__DEEP_SPLICE_KEY__))!;
      /**
       * @description "If 'curValue' here is a function belonging to a first-level property,
       * it would be the proxy function for the function property
       * within 'classEngineStore' in the 'classConnectStore' method.
       * Since the internal proxy function is already a wrapper function processed with 'apply',
       * the original function's 'this' object still essentially points to the internal object,
       * preventing rendering errors caused by incorrect 'this' binding."
       */
      return Reflect.apply(curValue, prevValue, args);
    }
    return curValue;
  }, store);
};

/**
 * @description Retrieve the original value,
 * and control whether to go through the state rendering process.
 */
export const retrieveValueWithCollecting = <S extends PrimitiveState>(
  keyChains: keyof S,
  store: Store<S>,
  argsMap: Map<string, unknown[]>,
  errorPrefixText?: string,
) => {
  signalRunScopeErrorProcessing(keyChains, errorPrefixText ?? "");

  if (__SIGNAL_EFFECT_STORE_KEYS_COLLECTING__.get("collecting")) {
    const firstLevelKey = (keyChains as string).split(__DEEP_SPLICE_KEY__)[0];
    __SIGNAL_EFFECT_STORE_KEYS_COLLECTOR_MAP__.set(
      store,
      __SIGNAL_EFFECT_STORE_KEYS_COLLECTOR_MAP__.has(store)
        ? __SIGNAL_EFFECT_STORE_KEYS_COLLECTOR_MAP__.get(store)!.add(firstLevelKey)
        : new Set<string>().add(firstLevelKey),
    );
  }

  return retrieveValue(keyChains as string, store, argsMap);
};

export const getComputedScopeValue = <T>(factory: () => T): T => {
  const result = factory() as Signal<T>;
  /**
   * @description To prevent calculations within the signal function scope
   * from involving the returns of other signal functions,
   * which may in turn return a signal data object,
   * it is necessary to use `get` to obtain the underlying data value.
   */
  return result[__SIGNAL_IDENTIFIER_KEY__] ? result.value : result;
};

// Generate iterators to handle iterative traversal of Symbol.iterator's meta methods
export const genIterator = (value: IteratorAbleTypeArgs) => {
  const valueType = whatsType(value) as "Map" | "Set" | "Array";

  const valueTemp = valueType !== "Array"
    ? Array.from(value as ArrayLike<any>)
    : (value as any[]);

  let index = -1;
  return {
    next() {
      index++;
      return index < (valueTemp as any[])?.length
        ? { done: false, value: valueTemp?.[index] }
        : { done: true };
    }
  };
};

/**
 * Prevent apply、 call or bind traps,
 * such as `proxyFunc.apply(null, [])`、 `proxyFunc.call(null, ...args)` or `proxyFunc.bind(null, ...args)()`;
 * 🌟 We are not considering extremely distorted code scenarios
 * where the 'this' object is bound and then rendered as a result.
 * Therefore, we will directly return the result of the function execution.
 * 🌟 Another consideration is that React's synthetic event object handles events internally through the 'apply' method.
 * Each 'onClick' click triggers another 'apply' call,
 * resulting in a new reference for the bound parameter 'trapArgArray' every time.
 * Following the signal's internal chained proxy mechanism,
 * this would lead to a new proxy chain being created with each click, which is unreasonable.
 * Therefore, this is another reason to dismiss the aforementioned distorted code scenarios.
 */
export const callableFunctionTrap = <S extends PrimitiveState>(
  store: Store<S>,
  value: ValueOf<S>,
  prop: keyof S,
) => {
  return prop === "apply"
    ? (trapThisArg: any, trapArgArray: any[]) => {
      return Reflect.apply(value, trapThisArg ?? store, trapArgArray);
    }
    : prop === "bind"
      ? (trapThisArg: any, ...trapArgArray: any[]) => {
        return () => Reflect.apply(value, trapThisArg ?? store, trapArgArray);
      }
      : (trapThisArg: any, ...trapArgArray: any[]) => {
        return Reflect.apply(value, trapThisArg ?? store, trapArgArray);
      };
};

export const getComputingResult = <S extends PrimitiveState>(
  keyChains: keyof S,
  store: Store<S>,
  prop: string | symbol,
  argsMap: Map<string, unknown[]>,
) => {
  const valueTemp = retrieveValueWithCollecting(keyChains, store, argsMap);
  const nextValue = valueTemp?.[prop];
  return hasOwnProperty.call(valueTemp, prop)
    ? nextValue
    : typeof nextValue === "function"
      // 🌟When invoking a method from the prototype chain,
      // it's crucial to pay attention to the calling context of this object.
      ? (...args: any[]) => nextValue?.apply?.(valueTemp, args)
      : nextValue;
};
