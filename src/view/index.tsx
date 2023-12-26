import type { PrimitiveState } from "../types";
import type { ViewOptionsType, MapStateToProps, Stores } from "./types";
import type { Store } from "../store/types";
import React, { memo, useEffect, useState } from "react";
import { REGENERATIVE_SYSTEM_KEY } from "../static";
import { mapToObject } from "../utils";
import {
  getLatestStateMap, viewStoresToLatestState, initialStateHandle, effectedHandle,
} from "./core";
import { viewOptionsErrorHandle } from "../errors";

/**
 * 连接store且具备memo与SCU的高阶HOC
 * @param Comp 被包裹的组件
 * @param options 数据绑定与对比配置
 * @return React.MemoExoticComponent
 * @description 支持class、hook组件连接store数据进行props方式渲染，
 * view最初的功能目的是想使得class组件连接使用store的数据。
 * @deprecated 事实上view已经很完善了，只是相对而言我还是不满意它的使用简易程度，
 * 所以在寻求到更完善的class组件的状态管理的支持方式之后
 * 未来的resy版本可能不再维护view这个api甚至放弃view
 */
export const view = <S extends PrimitiveState = {}, P extends PrimitiveState = {}>(
  // any用于兼容某些HOC导致的类型不合一问题，比如withRouter(低版本的react-router还是存在该HOC)
  // tslint:disable-next-line:variable-name
  Comp: React.ComponentType<MapStateToProps<S, P> | any>,
  options: ViewOptionsType<S, P> = {},
) => {
  viewOptionsErrorHandle(options);

  const { stores, compare } = options;
  const hasCompareFn = typeof compare === "function";
  const memoEnable = hasCompareFn ? true : compare;

  const PureView = (props: P) => {
    /**
     * @description 引用数据的代理Set（单store）、Map（多store）
     * 需要将innerUseStateMapSet与stateMap放在内部执行，
     * 这样每次更新的时候可以得到最新的数据引用与数据stateMap
     * 后续在setState更新的时候会执行stateRefByProxyHandle内部会进一步更新innerUseStateMapSet
     * 保持innerUseStateMapSet数据代理引用的准确与及时性
     */
    const innerUseStateMapSet: Set<keyof S> | Map<keyof Stores<S>, Set<keyof S>> =
      (!stores || (stores as Store<S>)[REGENERATIVE_SYSTEM_KEY as keyof S]) ? new Set() : new Map();

    /**
     * @description 给state数据做一个代理，从而让其知晓Comp组件内部使用了哪些数据！
     * 恰巧由于这里的proxy代理，导致在挂载属性数据的时候不能使用扩展运算符，
     * 扩展运算符...会读取所有的属性数据，导致内部关联使用数据属性失去准确性
     * 所以只能挂载到一个集中的属性上，这里选择来props的state属性上
     */
    const [
      state,
      setState,
    ] = useState<S | { [K in keyof Stores<S>]: S }>(() => initialStateHandle(
      innerUseStateMapSet,
      stores,
    ));

    useEffect(() => effectedHandle(
      innerUseStateMapSet, state, setState, props, stores,
      typeof compare === "boolean" ? undefined : compare,
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ), []);

    return <Comp {...props} state={state} />;
  };

  if (!memoEnable) return PureView;

  return memo(PureView, hasCompareFn ? (prevProps: P, nextProps: P) => {
    // props与state的变化可能存在同时变化的情况，但不影响equal的执行
    const latestState = stores
      ? (stores as Store<S>)[REGENERATIVE_SYSTEM_KEY as keyof S]
        ? mapToObject(getLatestStateMap(stores as Store<S>))
        : viewStoresToLatestState(stores)
      : ({} as S);
    return compare(
      { state: latestState, props: nextProps },
      { state: latestState, props: prevProps },
    );
  } : undefined);
};
