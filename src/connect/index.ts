import type { ConnectStoreType, ConnectType } from "./types";
import type { ValueOf } from "../types";
import type { Store } from "../store/types";
import { Component, PureComponent } from "react";
import { getThisProxy, unmountHandleCore } from "./handles";
import { __CONNECT_SYMBOL_KEY__, __STORES_KEY__ } from "./static";

/**
 * @class ComponentWithStore
 * @classdesc The public base class can connect to the store
 */
export class ComponentWithStore<P = {}, S = {}, SS = any> extends Component<P, S, SS> {
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
}

export interface ComponentWithStore extends ConnectStoreType {}

/**
 * @class PureComponentWithStore
 * @classdesc The public base class can connect to the store
 */
export class PureComponentWithStore<P = {}, S = {}, SS = any> extends PureComponent<P, S, SS> {
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
}

export interface PureComponentWithStore extends ConnectStoreType {}
