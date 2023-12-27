import type { ConnectStoreType, ConnectType } from "./types";
import type { PrimitiveState, ValueOf } from "../types";
import type { Store } from "../store/types";
import { Component, PureComponent } from "react";
import { connectStoreCore, getThisProxy, unmountHandleCore } from "./core";
import { CONNECT_SYMBOL_KEY, STORES_KEY } from "../static";

/**
 * @class ComponentWithStore
 * @classdesc The public base class that can connect to the store
 */
export class ComponentWithStore<P = {}, S = {}, SS = any> extends Component<P, S, SS> implements ConnectStoreType {
  constructor(props: P) {
    super(props);
    return getThisProxy.bind(this)();
  }

  // Flag of whether the unloaded logic is executed or not
  private unmountExecuted = false;

  /**
   * Performs som unmount processing logic action
   */
  private unmountHandle() {
    this.unmountExecuted = true;
    unmountHandleCore.bind(this)();
  }

  componentWillUnmount() {
    // If the subclass does not override the componentWillUnmount,
    // the unloaded logic "unmountHandle" method is judged and executed normally
    if (!this.unmountExecuted) {
      this.unmountHandle();
    }
  }

  // @ts-ignore
  private [CONNECT_SYMBOL_KEY]: ValueOf<ConnectType> | undefined;
  // @ts-ignore
  private [STORES_KEY]: Set<Store<any>> = new Set();

  /**
   * Performs some action. This method should not be overridden in subclasses.
   * @method
   * @description This is an important method that is core to the functionality of this class.
   */
  connectStore<S extends PrimitiveState>(store: S) {
    return connectStoreCore.bind(this)(store);
  }
}

/**
 * @class PureComponentWithStore
 * @classdesc The public base class that can connect to the store
 */
export class PureComponentWithStore<P = {}, S = {}, SS = any> extends PureComponent<P, S, SS> implements ConnectStoreType {
  constructor(props: P) {
    super(props);
    return getThisProxy.bind(this)();
  }

  // Flag of whether the unloaded logic is executed or not
  private unmountExecuted = false;

  /**
   * Performs som unmount processing logic action
   */
  private unmountHandle() {
    this.unmountExecuted = true;
    unmountHandleCore.bind(this)();
  }

  componentWillUnmount() {
    // If the subclass does not override the componentWillUnmount,
    // the unloaded logic "unmountHandle" method is judged and executed normally
    if (!this.unmountExecuted) {
      this.unmountHandle();
    }
  }

  // @ts-ignore
  private [CONNECT_SYMBOL_KEY]: ValueOf<ConnectType> | undefined;
  // @ts-ignore
  private [STORES_KEY]: Set<Store<any>> = new Set();

  /**
   * Performs some action. This method should not be overridden in subclasses.
   * @method
   * @description This is an important method that is core to the functionality of this class.
   */
  connectStore<S extends PrimitiveState>(store: S) {
    return connectStoreCore.bind(this)(store);
  }
}
