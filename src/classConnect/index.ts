import type { ConnectStoreType, ClassConnectStoreType, ClassStoreType } from "./types";
import type { ValueOf, PrimitiveState } from "../types";
import type { ConciseStoreCore, Store } from "../store/types";
import { Component, PureComponent } from "react";
import {
  __CLASS_THIS_POINTER_STORES_KEY__, __CLASS_CONNECT_STORE_KEY__, __CLASS_STATE_REF_SET_KEY__,
} from "./static";
import { connectStoreCore, constructorProcessing } from "./core";

/**
 * @class ComponentWithStore
 * @classdesc The public base class can connect to the store
 * @implements ConnectStoreType
 */
export class ComponentWithStore<
  P extends PrimitiveState = {},
  S extends PrimitiveState = {},
  SS = any,
> extends Component<P, S, SS> {
  constructor(props: P) {
    super(props);
    constructorProcessing.apply(this as any);
  }

  static displayName: undefined | string = undefined;

  [__CLASS_STATE_REF_SET_KEY__] = new Set<keyof S>();

  [__CLASS_CONNECT_STORE_KEY__]: ValueOf<ClassConnectStoreType> | undefined;

  [__CLASS_THIS_POINTER_STORES_KEY__]: Set<Store<any>> = new Set();

  connectStore<S extends PrimitiveState>(store: Store<S> | ConciseStoreCore<S>, __isMetaViewer__?: boolean): ClassStoreType<S> {
    return connectStoreCore.apply(this as any, [store, __isMetaViewer__]) as ClassStoreType<S>;
  }
}

/**
 * @class PureComponentWithStore
 * @classdesc The public base class can connect to the store
 * @implements ConnectStoreType
 */
export class PureComponentWithStore<
  P extends PrimitiveState = {},
  S extends PrimitiveState = {},
  SS = any,
> extends PureComponent<P, S, SS> implements ConnectStoreType {
  constructor(props: P) {
    super(props);
    constructorProcessing.apply(this as any);
  }

  static displayName: undefined | string = undefined;

  [__CLASS_STATE_REF_SET_KEY__] = new Set<keyof S>();

  [__CLASS_CONNECT_STORE_KEY__]: ValueOf<ClassConnectStoreType> | undefined;

  [__CLASS_THIS_POINTER_STORES_KEY__]: Set<Store<any>> = new Set();

  connectStore<S extends PrimitiveState>(store: Store<S> | ConciseStoreCore<S>, __isMetaViewer__?: boolean): ClassStoreType<S> {
    return connectStoreCore.apply(this as any, [store, __isMetaViewer__]) as ClassStoreType<S>;
  }
}
