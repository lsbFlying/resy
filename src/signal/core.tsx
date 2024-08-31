import React, { type ReactNode } from "react";
import type { IteratorAbleType, SignalMetaMapType } from "./types";
import type { PrimitiveState, ValueOf } from "../types";
import type { Store } from "../store/types";
import { PureComponentWithStore } from "../classConnect";
import { hasOwnProperty, whatsType } from "../utils";
import {
  __DEEP_SPLICE_KEY__, __SIGNAL_MARK_AS_COMPUTING__, __SIGNAL_IDENTIFIER_KEY__,
  __CHAIN_KEY_UNIQUE_ID_PREFIX__, __DEBUGGER_UNKNOWN_STORE_NAMESPACE_PREFIX__,
  __DEBUGGER_SIGNAL_PREFIX__,
} from "./static";
import {
  callableFunctionTrap, genIterator, getComputingResult,
  retrieveValue, retrieveValueWithCollecting, uniqueIdByValue,
} from "./utils";
import { __DEV__ } from "../static";
import { __STORE_NAMESPACE__ } from "../store/static";

/** Create a signal-type meta-data of signal state */
export const createSignal = <S extends PrimitiveState>(
  keyChains: (keyof S) | string,
  signalMetaMap: SignalMetaMapType<S>,
  store: Store<S>,
  value: ValueOf<S>,
  argsMap: Map<string, unknown[]>,
  thisArg?: any,
) => {
  if (signalMetaMap.has(keyChains)) return signalMetaMap.get(keyChains);

  let signalMetaCount = 0;
  /**
   * @description class components require connecting to the store via connectStore before they can update and render.
   * Using class components offers more freedom compared to the restrictions of using hooks within functional components,
   * and it's less prone to errors related to the rules of hooks usage.
   */
  class Viewer extends PureComponentWithStore<IteratorAbleType, Partial<S>> {

    store = this.connectStore(store, true);

    componentDidMount() {
      signalMetaCount++;
    }

    componentWillUnmount() {
      signalMetaCount--;
      if (!signalMetaCount) {
        signalMetaMap.delete(keyChains);
      }
    }

    render() {
      const { iteratorAble } = this.props;
      const element = retrieveValue(keyChains as string, this.store, argsMap);
      return (iteratorAble ? Array.from(element) : element) as ReactNode;
    }
  }

  /**
   * @description In fact, you cannot predict the final data presentation outcome,
   * as the data might be of a composite type. Therefore,
   * here you can only initially assume the data is of a primitive type to facilitate direct rendering presentation.
   * Hence, here the React element object <Viewer /> is proxied by default.
   */
  const storeNameSpace = store[__STORE_NAMESPACE__ as keyof S] as string | undefined;
  if (__DEV__) {
    Viewer.displayName = `${
      storeNameSpace
        ? `${storeNameSpace}:`
        : ""
    }${__DEBUGGER_SIGNAL_PREFIX__}${
      (keyChains as string)
        .split(__DEEP_SPLICE_KEY__)
        .filter(key => !key.startsWith(__CHAIN_KEY_UNIQUE_ID_PREFIX__))
        .join(".")
    }`;
  }
  signalMetaMap.set(
    keyChains,
    new Proxy(
      typeof value === "function"
        ? value
        : {
          ...(
            <Viewer
              key={
                `${
                  storeNameSpace ||
                  uniqueIdByValue(
                    store,
                    __DEBUGGER_UNKNOWN_STORE_NAMESPACE_PREFIX__,
                  )
                }:${keyChains as string}`
              }
            />
          ),
          [__SIGNAL_IDENTIFIER_KEY__]: true,
          get value() {
            return retrieveValueWithCollecting(
              keyChains, store, argsMap,
              "Accessing the value property of signal-type data",
            );
          },
          get truthy() {
            return Boolean(
              retrieveValueWithCollecting(
                keyChains, store, argsMap,
                "Accessing the truthy property of signal-type data",
              )
            );
          },
          get falsy() {
            return !retrieveValueWithCollecting(
              keyChains, store, argsMap,
              "Accessing the falsy property of signal-type data",
            );
          },
          typeOf() {
            return whatsType(
              retrieveValueWithCollecting(
                keyChains, store, argsMap,
                "Accessing the typeOf function of signal-type data",
              )
            );
          },
          [Symbol.toPrimitive]() {
            return retrieveValueWithCollecting(
              keyChains, store, argsMap,
              "Accessing or computing the base primitive value of signal-type data, or expressions involving it,",
            );
          },
          get [Symbol.toStringTag]() {
            /**
             * @description It's important to note that the type returned
             * by the `whatsType` function will be automatically formatted as `"[object ?]"`
             * due to the combined effect of `Symbol.toStringTag` and `Object.prototype.toString.call`.
             */
            return whatsType(
              retrieveValueWithCollecting(
                keyChains, store, argsMap,
                "Calling the prototype chain method Object.prototype.toString.call on signal-type data",
              )
            );
          },
          /**
           * @description The signal data of object type cannot be intercepted
           * and executed by `Symbol.iterator` when using the spread operator.
           * Only the signal of array or iterator types (such as Set, Map, etc.) can be intercepted.
           * If object type signals wish to use the spread operator,
           * they can do so through the `value` property.
           */
          [Symbol.iterator]() {
            return genIterator(
              retrieveValueWithCollecting(
                keyChains, store, argsMap,
                "Performing spread operations or iterating over signal-type data using spread syntax or iterators",
              )
            );
          },
          toJSON() {
            return retrieveValueWithCollecting(
              keyChains, store, argsMap,
              "JSON.stringify",
            );
          },
        },
      {
        // The function type still performs proxy processing for the execution of the function
        // and the subsequent proxy processing of the returned result
        apply(target: Function, _: any, argArray: any[]): any {
          const nextValue = Reflect.apply(target, thisArg ?? store, argArray);

          // Prevent different arguments (argArray) from producing the same result when accessing the same property path.
          const nextKey = `${keyChains as string}${__DEEP_SPLICE_KEY__}${uniqueIdByValue(argArray)}`;
          argsMap.set(nextKey, argArray);

          return createSignal(nextKey, signalMetaMap, store, nextValue, argsMap, thisArg);
        },
        has(_: any, prop: string | symbol) {
          return Reflect.has(
            retrieveValueWithCollecting(
              keyChains, store, argsMap,
              "Using the 'in' operator or the 'Object.prototype.hasOwnProperty' prototype method on signal-type data",
            ),
            prop,
          );
        },
        get(target: any, prop: string | symbol, receiver: any): any {
          if (hasOwnProperty.call(target, prop)) {
            return Reflect.get(target, prop, receiver);
          }

          // This is for the acquisition of chained properties.
          if (__SIGNAL_MARK_AS_COMPUTING__.get("computing")) {
            return getComputingResult(keyChains, store, prop, argsMap);
          }

          if (prop === "apply" || prop === "call" || prop === "bind") {
            return callableFunctionTrap(store, value, prop);
          }

          /**
           * @description Both the properties on the prototype chain and its own properties can go through this return branch.
           * The value of the previous level serves
           * as the 'this' object of the property function of the next level,
           * maintaining the correctness of the' this' pointing to.
           * So when we proxy again here, the 'this' object (thisArg)
           * of the next level attribute should be the current value.
           */
          return createSignal(
            // nextKey is also used to ensure the uniqueness of attribute paths
            `${keyChains as string}${__DEEP_SPLICE_KEY__}${prop as string}`,
            signalMetaMap, store, value?.[prop], argsMap, value
          );
        }
      },
    ),
  );

  return signalMetaMap.get(keyChains);
};
