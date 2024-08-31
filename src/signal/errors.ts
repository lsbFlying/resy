import type { AnyFn, PrimitiveState } from "../types";
import {
  __DEEP_SPLICE_KEY__, __SIGNAL_MARK_AS_COMPUTING__,
  __SIGNAL_EFFECT_STORE_KEYS_COLLECTING__, __CHAIN_KEY_UNIQUE_ID_PREFIX__,
} from "./static";
import { __DEV__ } from "../static";
import { whatsType } from "../utils";

/**
 * @description In the future,
 * we will consider writing a babel plugin to automatically compile code
 * that wraps the calculation and expression of signals through the signalsComputed function,
 * achieving complete signalization. Currently, we are using error alerts to remind developers.
 * 🌟 Since signal-type data cannot be freely operated upon and primarily carries the responsibility of rendering,
 * its rendering-related operations are also confined within the `signalsComputed` function.
 * Due to this limited computational ability, when performing updates or actual logical operations,
 * it's often necessary to utilize the `store` returned by `createSignals` to retrieve the data
 * and perform the desired actions.
 */
export const signalRunScopeErrorProcessing = <S extends PrimitiveState>(
  keyChains: keyof S,
  errorPrefixText: string,
) => {
  if (
    __DEV__
    && !(
      __SIGNAL_MARK_AS_COMPUTING__.get("computing")
      || __SIGNAL_EFFECT_STORE_KEYS_COLLECTING__.get("collecting")
    )
  ) {
    // "Due to the complex usage scenarios of signal-type data,
    // we won't throw an error here. Instead, we will print an error message as a reminder."
    console.error(
      `The signal-type data property currently experiencing an error is '${
        (keyChains as string)
          .split(__DEEP_SPLICE_KEY__)
          .filter(key => !key.startsWith(__CHAIN_KEY_UNIQUE_ID_PREFIX__))
          .join(".")
      }'. \n`
      + errorPrefixText
      + " must be done within functions like 'signalsComputed', 'useSignalsComputed', 'signalsEffect', or 'useSignalsEffect'. "
      + " Otherwise, updates or effects may not work as expected. \n"
      + " \n"
      + "Summary: In conclusion, calculations and expression evaluations involving signal-type data within components"
      + " must be performed inside functions like 'signalsComputed',"
      + " 'useSignalsComputed', 'signalsEffect', or 'useSignalsEffect'."
      + " Additionally, such computations and expression evaluations are only meaningful within the context of a component."
      + " Signal-type data should not be accessed outside of components."
      + " And data access or operations for actions outside of components are carried out through the store."
    );
  }
};

export const signalApiParamsErrorProcessing = (
  fn: AnyFn,
  paramName: "factory" | "effect",
  fnName: "signalsComputed、useSignalsComputed" | "signalsEffect、useSignalsEffect",
  __result__?: boolean,
) => {
  if (__DEV__ && typeof fn !== "function") {
    throw new Error(
      `resy's ${fnName}(...): Expected the first optional ${paramName} argument to be a function. `
      + `Instead received: ${whatsType(fn).toLocaleLowerCase()}`
    );
  }
  if (__DEV__ && (typeof __result__ !== "boolean" && typeof __result__ !== "undefined")) {
    throw new Error(
      "resy's signalsEffect(...): Expected the second optional '__result__' argument to be a boolean or undefined."
      + `Instead received: ${whatsType(__result__).toLocaleLowerCase()}`
    );
  }
};
