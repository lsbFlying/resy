import type { Callback, PrimitiveState } from "../types";
import type { AnyBoundFn, MacroStore } from "../store/types";
import type { SubscriberRefType } from "./types";
import type MetaStore from "../store/core";
import { useCallback, useDebugValue, useLayoutEffect, useRef, useState } from "react";
import { _COMPUTED_PREFIX_ } from "../store/static";
import useSyncExternalStoreExports from "use-sync-external-store/shim";

/**
 * @description Additional references are utilized to ensure the compatibility
 * of the package in ESM since 'use-sync-external-store' only exports in CJS format.
 */
const { useSyncExternalStore } = useSyncExternalStoreExports;

/**
 * @description The core meta-structure of state
 */
export default class MetaState<S extends PrimitiveState> {
  // eslint-disable-next-line no-empty-function
  constructor(public $metaStore: MetaStore<S>) {}

  isRendering?: boolean;

  getSnapshot = () => {
    return this.$metaStore._$state_;
  };

  useMetaState() {
    this.isRendering = true;

    const { getSnapshot, $metaStore } = this;

    const {
      _options_: { namespace }, _$state_,
      _restorer_, _subscriber_, store,
    } = $metaStore;

    // Perform refresh recovery logic if initialState is a function
    _restorer_.initialStateRetrieve();

    // eslint-disable-next-line react-hooks/rules-of-hooks
    __DEV__ && useDebugValue({
      state: _$state_,
      ...(
        namespace
          ? { namespace }
          : null
      ),
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const subscriberRef = useRef<SubscriberRefType<S>>({
      stateKeys: { oldKeys: new Set<keyof S>(), newKeys: new Set<keyof S>() },
      resubscriber: null,
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const subscribe = useCallback((onStateChange: Callback) => {
      const unsub = subscriberRef.current.stateKeys.newKeys.size
        ? _subscriber_.subscribe(onStateChange, subscriberRef.current.stateKeys.newKeys)
        : undefined;

      subscriberRef.current.resubscriber = {
        resubscribe() {
          // todo 先接触订阅
          unsub?.();
          // todo 再重新订阅
          subscriberRef.current.resubscriber!.newUnsub = _subscriber_.subscribe(
            onStateChange,
            subscriberRef.current.stateKeys.newKeys,
          );
        },
      };

      // Increment the reference count by 1 if the component is referenced
      _restorer_.metaStateRefCounter++;

      return () => {
        unsub?.();
        subscriberRef.current.resubscriber?.newUnsub?.();

        _restorer_.metaStateRefCounter--;
        _restorer_.deferRestoreProcessing();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useLayoutEffect(() => {
      this.isRendering = false;
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useState(() => new Proxy({} as S, {
      get: (_: S, key: keyof S) => {
        try {
          // get latest _$state_
          const state = this.$metaStore._$state_;

          // Get the latest value
          const value = state[key];

          const sourceFromStore = Reflect.has($metaStore, key);

          if (!sourceFromStore && typeof value !== "function") {
            this.isRendering && subscriberRef.current.stateKeys.newKeys.add(key);
            // todo 借用store本身具备的链式更新能力
            return store[key];
          }

          if (!sourceFromStore && typeof value === "function") {
            // Avoid memory redundancy waste caused by repeated bindings and maintain the function reference address unchanged.
            !(value as AnyBoundFn)._bound_ && $metaStore._boundFnProcessing_(key, value);

            const boundFnValue = state[key];

            return !key.toString().startsWith(_COMPUTED_PREFIX_)
              ? boundFnValue
              // TODO bind产生新的引用，待优化
              : $metaStore.useComputed.bind(null, boundFnValue);
          }

          return $metaStore[key as keyof MetaStore<S>];
        } finally {
          /**
           * @desc
           * todo 检查新的订阅属性是否有增多，有则解除之前的订阅，重新订阅新属性，
           *  旧的属性集必然是新的属性集的子集，因为新的属性集的产生必然是要执行旧的属性集产生的逻辑代码，
           *  而这个逻辑代码的执行必然是拥有所有的旧属性的。
           */
          const { stateKeys, resubscriber } = subscriberRef.current;
          const { oldKeys, newKeys } = stateKeys;
          if (newKeys.size > oldKeys.size) {
            // todo 更新一下oldKeys
            stateKeys.oldKeys = new Set(newKeys);
            // todo 解除之前的订阅，重新订阅新的属性
            resubscriber?.resubscribe?.();
          }
        }
      },
    }) as MacroStore<S>)[0];
  }
}
