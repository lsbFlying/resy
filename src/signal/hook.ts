import type { SignalsEffectCallback, UnwrapSignal, Signal, UseSignalsReturnType } from "./types";
import type { PrimitiveState } from "../types";
import type { InitialState, InnerStoreOptions } from "../store/types";
import { useEffect, useRef, useMemo, type EffectCallback } from "react";
import { signalsEffect, signalsComputed, createSignals } from "./index";

export const useSignals = <S extends PrimitiveState>(initialState: InitialState<S>): UseSignalsReturnType<S> => {
  return useMemo(() => (
    createSignals(
      initialState,
      {
        __useConciseState__: true,
      } as InnerStoreOptions
    ).signals
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), []) as any as UseSignalsReturnType<S>;
};

/** @description The hook version of signalsComputed */
export const useSignalsComputed = <T>(factory: () => T): Signal<UnwrapSignal<T>> => {
  const ref = useRef<() => T>();

  ref.current = factory;

  return useMemo(() => signalsComputed(ref.current!), []);
};

/** @description Regarding `useEffect` with signals */
export const useSignalsEffect = (effect: EffectCallback) => {
  const ref = useRef<SignalsEffectCallback>();

  ref.current = effect;

  useEffect(() => signalsEffect(ref.current!), []);
};
