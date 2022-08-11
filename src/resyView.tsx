import React, { useEffect, useMemo, useState } from "react";
import { State, StoreHeartMapType, StoreHeartMapValueType } from "./model";
import { resyViewNextStateMapKey, storeHeartMapKey } from "./static";
import { resyListener } from "./utils";

export interface ResyStateToProps<T extends State> {
  // 将resy生成的store容器数据挂载到组件的props的state属性上
  state: T;
}

/**
 * 给Comp组件的props上挂载的state属性数据做一层引用代理
 * 核心作用是找出SCU或者useMemo所需要的更新依赖的数据属性
 */
function proxyStateHandle<S extends State>(latestState: Map<keyof S, S[keyof S]>, linkStateSet: Set<keyof S>) {
  return new Proxy(latestState, {
    get: (target: Map<keyof S, S[keyof S]>, key: keyof S) => {
      linkStateSet.add(key);
      // latestState给出了resy生成的store内部数据的引用，这里始终能获取到最新数据
      return target.get(key);
    },
  } as ProxyHandler<Map<keyof S, S[keyof S]>>) as any as S;
}

/**
 * resyView
 *
 * @description
 * A：通过将Comp组件包裹一层hook，转变成hook组件，从而实现对class组件的支持
 * 本身也自然是支持hook，Comp也可以是hook组件
 *
 * B：resyView创建初衷：
 * resy本身是为hook而生的，但是还是需要对class组件进行支持
 * 毕竟class组件与hook组件不是非此即彼，class组件的存在还是很有必要的
 * class组件依然具有很好的性能与代码健壮读写能力(其实就性能而言class是高于hook)
 * hook可以认为是react如虎添翼/锦上添花，但是不能把class组件作为虎腿而卸掉
 * 至少目前来看二者两分天下才是对代码更友好健康的方式
 *
 * C：resyView连接了resy生成的store数据，使得Comp组件可以共享store
 * 同时完善了Comp组件自动避免rerender，并且特殊的是
 * 它比resy本身自带的规避rerender的效果更完善
 * 即如果resyView包裹的Comp组件即使在其父组件更新渲染了
 * 只要内部使用的数据没有更新，那么它本身不会渲染re-render
 */
export function resyView<P extends State, S extends State>(store: S, Comp: React.ComponentType<(ResyStateToProps<S> & P) | any>) {
  // 引用数据的代理Set
  const linkStateSet: Set<keyof S> = new Set();
  return React.memo((props: P) => {
    // 需要使用getState获取store内部的即时最新数据值
    const latestState = (
      (
        store[storeHeartMapKey as keyof S] as StoreHeartMapType<S>
      ).get("getState") as StoreHeartMapValueType<S>["getState"]
    )();
    /**
     * 给state数据做一个代理，从而让其知晓Comp组件内部使用了哪些数据！
     * 恰巧由于这里的proxy代理，导致在挂载属性数据的时候不能使用扩展运算符，
     * 扩展运算符...会读取所有的属性数据，导致内部关联使用数据属性失去准确性
     * 所以只能挂载到一个集中的属性上，这里选择来props的state属性上
     */
    const [state, setState] = useState<S>(proxyStateHandle(latestState, linkStateSet));
    const [propsState, setPropsState] = useState<P>(props);
    
    useEffect(() => {
      setPropsState(props);
      // 在较少的数据属性状态下，JSON.stringify的比较效率性价比相对而言是最好的
    }, [JSON.stringify(props)]);
    
    useEffect(() => {
      // Comp组件内部使用到的数据属性字段数组
      const innerLinkUseFields = Array.from(linkStateSet);
      // 刚好巧妙的与resy的订阅监听resyListener结合起来，形成一个reactive更新的包裹容器
      const cancelListener = resyListener((
        effectState,
        _,
        nextState,
      ) => {
        const effectStateFields = Object.keys(effectState);
        if (innerLinkUseFields.some(key => effectStateFields.includes(key as string))) {
          linkStateSet.clear();
          // 保持代理数据的更新从而保持innerLinkUseFields的最新化
          setState(proxyStateHandle(nextState[resyViewNextStateMapKey as keyof typeof nextState], linkStateSet));
        }
      }, store);
      return () => {
        /**
         * resyView会使得组件销毁时不执行subscribe，因为它本身是订阅监听执行的，不属于组件的生命周期发生
         * 所以这里需要特定的数据恢复，同时resetState内部注意关联到unmountClear的逻辑处理
         */
        (
          (
            store[storeHeartMapKey as keyof S] as StoreHeartMapType<S>
          ).get("resetState") as StoreHeartMapValueType<S>["resetState"]
        )();
        cancelListener();
        linkStateSet.clear();
      };
    }, []);
    
    return useMemo(() => <Comp {...propsState} state={state}/>, [state, propsState]);
  });
}
