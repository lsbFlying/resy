import type { SignalsEffectStoreKeysCollectingType, SignalsHookingComputingType } from "./types";
import type { Store } from "../store/types";
import type { MapType } from "../types";

// string constants for signal internal deep stitching attributes
export const __DEEP_SPLICE_KEY__ = "_$RE¥SY$_";

// The identifier key of signal
export const __SIGNAL_IDENTIFIER_KEY__ = Symbol("signalIdentifierKey");

/**
 * @description signalsComputed function scope internal flag indicating hooking、computing
 * Prevent hook rule errors caused by the same data key.
 * It can also identify whether it is in the midst of rendering execution.
 */
export const __SIGNAL_MARK_AS_COMPUTING__: MapType<SignalsHookingComputingType> = new Map()
  .set("computing", false);

// Collection control flag for the store and key data collector in `useSignalsEffect`.
export const __SIGNAL_EFFECT_STORE_KEYS_COLLECTING__: MapType<SignalsEffectStoreKeysCollectingType> = new Map()
  .set("collecting", false);

// Data collector for store and key in `useSignalsEffect`.
export const __SIGNAL_EFFECT_STORE_KEYS_COLLECTOR_MAP__ = new Map<Store<any>, Set<string>>();

export const __CHAIN_KEY_UNIQUE_ID_PREFIX__ = "__CHAIN_KEY_UNIQUE_ID_PREFIX__";

export const __DEBUGGER_UNKNOWN_STORE_NAMESPACE_PREFIX__ = "UnknownNamespaceStore";

export const __DEBUGGER_SIGNAL_PREFIX__ = "Signal$";
