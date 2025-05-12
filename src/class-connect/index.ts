import type { PrimitiveState } from "../types";
import type { Store } from "../store/types";
import type { ClassInstanceTypeOfConnectStore } from "./types";
import { Component, PureComponent } from "react";
import {
  __CLASS_THIS_POINTER_STORES_KEY__, __CLASS_STATE_REF_SET_KEY__, __CLASS_IS_MOUNTED_KEY__,
} from "./static";
import { connectStoreCore, constructorProcessing } from "./core";

/**
 * @class ComponentWithStore
 * @classdesc The public base class can connect to the store
 */
export class ComponentWithStore<
  P extends PrimitiveState = {},
  S extends PrimitiveState = {},
  SS = any,
> extends Component<P, S, SS> {
  constructor(props: P) {
    super(props);
    constructorProcessing(this as any);
  }

  static displayName?: string;

  [__CLASS_IS_MOUNTED_KEY__] = false;

  [__CLASS_STATE_REF_SET_KEY__] = new Set<keyof S>();

  [__CLASS_THIS_POINTER_STORES_KEY__]: Set<Store<S>> = new Set();

  connectStore = <S extends PrimitiveState>(store: Store<S>) => {
    return connectStoreCore(this as ClassInstanceTypeOfConnectStore<S>, store);
  };
}

/**
 * @class PureComponentWithStore
 * @classdesc The public base class can connect to the store
 */
export class PureComponentWithStore<
  P extends PrimitiveState = {},
  S extends PrimitiveState = {},
  SS = any,
> extends PureComponent<P, S, SS> {
  constructor(props: P) {
    super(props);
    constructorProcessing(this as any);
  }

  static displayName?: string;

  [__CLASS_IS_MOUNTED_KEY__] = false;

  [__CLASS_STATE_REF_SET_KEY__] = new Set<keyof S>();

  [__CLASS_THIS_POINTER_STORES_KEY__]: Set<Store<S>> = new Set();

  connectStore = <S extends PrimitiveState>(store: Store<S>) => {
    return connectStoreCore(this as ClassInstanceTypeOfConnectStore<S>, store);
  };
}
