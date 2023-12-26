import type { ConnectStoreType, ConnectType, ClassStoreType } from "./types";
import type { ValueOf, PrimitiveState } from "../types";
import { Component, PureComponent } from "react";
import { CONNECT_SYMBOL_KEY } from "../static";
import { storeErrorHandle } from "../errors";

/**
 * @class ComponentWithStore
 * @classdesc 可以连接store的公共基础类，继承自Component
 */
export class ComponentWithStore<P = {}, S = {}> extends Component<P, S> implements ConnectStoreType {
  [CONNECT_SYMBOL_KEY]: ValueOf<ConnectType> | undefined;
  connectStore<S extends PrimitiveState>(store: S) {
    storeErrorHandle(store, "connectStore");
    this[CONNECT_SYMBOL_KEY] = store[CONNECT_SYMBOL_KEY as keyof S];
    return this[CONNECT_SYMBOL_KEY]!() as ClassStoreType<S>;
  }
}

/**
 * @class PureComponentWithStore
 * @classdesc 可以连接store的公共基础类，继承自PureComponent
 */
export class PureComponentWithStore<P = {}, S = {}> extends PureComponent<P, S> implements ConnectStoreType {
  [CONNECT_SYMBOL_KEY]: ValueOf<ConnectType> | undefined;
  connectStore<S extends PrimitiveState>(store: S) {
    storeErrorHandle(store, "connectStore");
    this[CONNECT_SYMBOL_KEY] = store[CONNECT_SYMBOL_KEY as keyof S];
    return this[CONNECT_SYMBOL_KEY]!() as ClassStoreType<S>;
  }
}
