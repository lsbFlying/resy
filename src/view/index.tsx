import React, { memo, useEffect, useState } from "react";
import { REGENERATIVE_SYSTEM_KEY } from "../static";
import { mapToObject } from "../utils";
import {
  getLatestStateMap, viewStoresToLatestState, initialStateHandle, effectedHandle,
} from "./core";
import type { PrimitiveState } from "../types";
import type { ViewOptionsType, MapStateToProps, Stores } from "./types";
import type { Store } from "../store/types";

/**
 * 连接store且具备memo与SCU的高阶HOC
 * @description 它会自动化规避组件额外多余的re-render，可连接store数据进行props方式渲染，支持class组件的使用
 * @param Comp 被包裹的组件
 * @param options 数据绑定与对比配置
 * @return memo (options: ViewOptionsType<P, S>) => React.MemoExoticComponent;
 * @deprecated view的本质是memo，附加功能是可以帮助class组件连接使用store的数据，
 * 但是memo的本质使用效益总所周知可能是不那么明显，属于伤敌一千自损八百的招式
 * 且对于class组件而言，class终究是函数的上层模仿实现，最终还是有函数转换执行，
 * 其性能会弱于hook组件，可以考虑不再予以兼容支持，
 * 暂时启用渐进式弃用的方式，该api未来版本可能会被遗弃
 */
export const view = <P extends PrimitiveState = {}, S extends PrimitiveState = {}>(
  // any用于兼容某些HOC导致的类型不合一问题，比如withRouter(低版本的react-router还是存在该HOC)
  // tslint:disable-next-line:variable-name
  Comp: React.ComponentType<MapStateToProps<S, P> | any>,
  options: ViewOptionsType<P, S> = {},
) => {
  const { stores, equal } = options;

  return memo((props: P) => {
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
    const [state, setState] = useState<
      S | { [key in keyof Stores<S>]: S }
    >(() => initialStateHandle(
      innerUseStateMapSet,
      stores,
    ));

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => effectedHandle(innerUseStateMapSet, state, setState, props, stores, equal), []);

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
