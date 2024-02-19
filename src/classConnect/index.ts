import type { ConnectStoreType, ClassConnectStoreType } from "./types";
import type { ValueOf } from "../types";
import type { Store } from "../store/types";
import { Component, PureComponent } from "react";
import { getThisProxy, unmountProcessingCore } from "./utils";
import { __CLASS_THIS_POINTER_STORES_KEY__, __CLASS_CONNECT_STORE_KEY__ } from "./static";

/**
 * @class ComponentWithStore
 * @classdesc The public base class can connect to the store
 */
export class ComponentWithStore<P = {}, S = {}, SS = any> extends Component<P, S, SS> {
  constructor(props: P) {
    super(props);
    return getThisProxy.bind(this as any)();
  }

  // Flag of whether the unmount logic is executed or not
  // @ts-ignore
  private unmountExecuted = false;

  /**
   * Performs unmount processing logic
   */
  // @ts-ignore
  private unmountProcessing() {
    this.unmountExecuted = true;
    unmountProcessingCore.bind(this as any)();
  }

  // @ts-ignore
  private [__CLASS_CONNECT_STORE_KEY__]: ValueOf<ClassConnectStoreType> | undefined;
  // @ts-ignore
  private [__CLASS_THIS_POINTER_STORES_KEY__]: Set<Store<any>> = new Set();
}

export interface ComponentWithStore extends ConnectStoreType {}

/**
 * @class PureComponentWithStore
 * @classdesc The public base class can connect to the store
 */
export class PureComponentWithStore<P = {}, S = {}, SS = any> extends PureComponent<P, S, SS> {
  constructor(props: P) {
    super(props);
    return getThisProxy.bind(this as any)();
  }

  // Flag of whether the unloaded logic is executed or not
  // @ts-ignore
  private unmountExecuted = false;

  /**
   * Performs unmount processing logic
   */
  // @ts-ignore
  private unmountProcessing() {
    this.unmountExecuted = true;
    unmountProcessingCore.bind(this as any)();
  }

  // @ts-ignore
  private [__CLASS_CONNECT_STORE_KEY__]: ValueOf<ClassConnectStoreType> | undefined;
  // @ts-ignore
  private [__CLASS_THIS_POINTER_STORES_KEY__]: Set<Store<any>> = new Set();
}

export interface PureComponentWithStore extends ConnectStoreType {}
