import type { ConnectStoreType, ConnectType } from "./types";
import type { PrimitiveState, ValueOf } from "../types";
import type { Store } from "../store/types";
import { Component, PureComponent } from "react";
import { connectStoreCore, getThisProxy, unmountHandleCore } from "./core";
import { __CONNECT_SYMBOL_KEY__, __STORES_KEY__ } from "../static";

/**
 * @class ComponentWithStore
 * @classdesc The public base class can connect to the store
 */
export class ComponentWithStore<P = {}, S = {}, SS = any> extends Component<P, S, SS> implements ConnectStoreType {
  constructor(props: P) {
    super(props);
    return getThisProxy.bind(this)();
  }

  // Flag of whether the unmount logic is executed or not
  // @ts-ignore
  private unmountExecuted = false;

  /**
   * Performs unmount processing logic
   */
  // @ts-ignore
  private unmountHandle() {
    this.unmountExecuted = true;
    unmountHandleCore.bind(this)();
  }

  // @ts-ignore
  private [__CONNECT_SYMBOL_KEY__]: ValueOf<ConnectType> | undefined;
  // @ts-ignore
  private [__STORES_KEY__]: Set<Store<any>> = new Set();

  /**
   * Performs some action. This method should not be overridden in subclasses.
   * Even if you rewrite it, your rewriting method won't work.
   * @method connectStore
   * @description This is an important method that is core to the functionality of this class.
   */
  connectStore<S extends PrimitiveState>(store: S) {
    return connectStoreCore.bind(this)(store);
  }
}

/**
 * @class PureComponentWithStore
 * @classdesc The public base class can connect to the store
 */
export class PureComponentWithStore<P = {}, S = {}, SS = any> extends PureComponent<P, S, SS> implements ConnectStoreType {
  constructor(props: P) {
    super(props);
    return getThisProxy.bind(this)();
  }

  // Flag of whether the unloaded logic is executed or not
  // @ts-ignore
  private unmountExecuted = false;

  /**
   * Performs unmount processing logic
   */
  // @ts-ignore
  private unmountHandle() {
    this.unmountExecuted = true;
    unmountHandleCore.bind(this)();
  }

  // @ts-ignore
  private [__CONNECT_SYMBOL_KEY__]: ValueOf<ConnectType> | undefined;
  // @ts-ignore
  private [__STORES_KEY__]: Set<Store<any>> = new Set();

  /**
   * Performs some action. This method should not be overridden in subclasses.
   * Even if you rewrite it, your rewriting method won't work.
   * @method connectStore
   * @description This is an important method that is core to the functionality of this class.
   */
  connectStore<S extends PrimitiveState>(store: S) {
    return connectStoreCore.bind(this)(store);
  }
}
