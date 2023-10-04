import React, { memo, useEffect, useState } from "react";
import { REGENERATIVE_SYSTEM_KEY } from "./static";
import { mapToObject } from "./utils";
import {
  getLatestStateMap, viewStoresToLatestState, initialStateHandle, mountedHandle,
} from "./viewReduce";
import type {
  PrimitiveState, MapStateToProps, Store, Stores, ViewOptionsType,
} from "./model";

/**
 * 自动memo与SCU的高阶HOC
 * @description 它会自动化规避组件额外多余的re-render
 * @param Comp 被包裹的组件
 * @param options 数据绑定配置
 * @return (options:ViewOptionsType<P,S>)=>React.MemoExoticComponent
 */
export const view = <P extends PrimitiveState = {}, S extends PrimitiveState = {}>(
  // any用于兼容某些HOC导致的类型不合一问题，比如withRouter(低版本的react-router还是存在该HOC)
  // tslint:disable-next-line:variable-name
  Comp: React.ComponentType<MapStateToProps<S, P> | any>,
  options: ViewOptionsType<P, S> = {}
) => {
  const { stores, equal } = options;

  return memo((props: P) => {
    /**
     * @description 引用数据的代理Set
     * 需要将innerUseStateMapSet与stateMap放在内部执行，
     * 这样每次更新的时候可以得到最新的数据引用与数据stateMap
     */
    const innerUseStateMapSet: Set<keyof S> | Map<keyof Stores<S>, Set<keyof S>> =
      (!stores || (stores as Store<S>)[REGENERATIVE_SYSTEM_KEY as keyof S]) ? new Set() : new Map();

    /**
     * @description 给state数据做一个代理，从而让其知晓Comp组件内部使用了哪些数据！
     * 恰巧由于这里的proxy代理，导致在挂载属性数据的时候不能使用扩展运算符，
     * 扩展运算符...会读取所有的属性数据，导致内部关联使用数据属性失去准确性
     * 所以只能挂载到一个集中的属性上，这里选择来props的state属性上
     */
    const [state, setState] = useState<
      S | { [key in keyof Stores<S>]: S }
    >(() => initialStateHandle(
      innerUseStateMapSet,
      stores,
    ));

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => mountedHandle(innerUseStateMapSet, state, setState, props, stores, equal), []);

    return <Comp {...props} state={state} />;
  }, equal ? (prevProps: P, nextProps: P) => {
    // props与state的变化可能存在同时变化的情况，但不影响equal的执行
    const latestState = stores
      ? (stores as Store<S>)[REGENERATIVE_SYSTEM_KEY as keyof S]
        ? mapToObject(getLatestStateMap(stores as Store<S>))
        : viewStoresToLatestState(stores)
      : ({} as S);
    return equal(
      { props: nextProps, state: latestState },
      { props: prevProps, state: latestState },
    );
  } : undefined);
};
