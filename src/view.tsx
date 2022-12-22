import isEqual from "react-fast-compare";
import React, { memo, useEffect, useMemo, useState } from "react";
import type { State, StoreCoreMapType, StoreCoreMapValue, MapStateToProps, Store } from "./model";
import { STORE_CORE_MAP_KEY } from "./static";
import { proxyStateHandler } from "./utils";

export type { MapStateToProps };

/**
 * view
 *
 * @description 自动化规避组件额外re-render的HOC
 * A：通过将Comp组件包裹一层hook，转变成hook组件，从而实现对class组件的支持
 * 本身也自然是支持hook，Comp也可以是hook组件
 *
 * B：view创建初衷：
 * resy本身是为hook而生的，但是还是需要对class组件进行支持
 * 毕竟class组件与hook组件不是非此即彼，class组件的存在还是很有必要的
 * class组件依然具有很好的性能与代码健壮读写能力
 * hook可以认为是react如虎添翼/锦上添花，但是不能把class组件作为虎腿而卸掉
 * 至少目前来看二者两分天下才是对代码更友好健康的方式
 *
 * C：view连接了resy生成的store数据，使得Comp组件可以共享store
 * 同时完善了Comp组件自动避免额外re-render，并且特殊的是
 * 它比resy本身自带的规避额外re-render的效果更完善
 * 即如果view包裹的Comp组件即使在其父组件更新渲染了
 * 只要内部使用的数据没有更新，那么它本身不会渲染而产生额外re-render
 *
 * @param store resy生成的store数据状态储存容器
 * @param Comp 被包裹的组件
 * @param deepEqual props、state深度对比
 * 它会深对比props与state和之前的props、state状态进行对比
 * 是否开启需要开发者自己衡量所能带来的性能收益，常规情况下不需要开启此功能
 * 除非遇到很重量级的组件渲染很耗费性能则开启可以通过JS的计算减轻页面更新渲染的负担
 * @name view
 */
export function view<P extends State = {}, S extends State = {}>(
  store: Store<S>,
  // any用于防范某些HOC导致的类型不合一问题，比如withRouter(低版本的react-router还是存在该HOC)
  // tslint:disable-next-line:variable-name
  Comp: React.ComponentType<MapStateToProps<S, P> | any>,
  deepEqual?: boolean,
) {
  return memo((props: P) => {
    // 引用数据的代理Set
    const linkStateSet: Set<keyof S> = new Set();

    // 需要使用getState获取store内部的即时最新数据值
    const latestState = (
      (
        store[STORE_CORE_MAP_KEY as keyof S] as StoreCoreMapType<S>
      ).get("getState") as StoreCoreMapValue<S>["getState"]
    )();

    /**
     * 给state数据做一个代理，从而让其知晓Comp组件内部使用了哪些数据！
     * 恰巧由于这里的proxy代理，导致在挂载属性数据的时候不能使用扩展运算符，
     * 扩展运算符...会读取所有的属性数据，导致内部关联使用数据属性失去准确性
     * 所以只能挂载到一个集中的属性上，这里选择来props的state属性上
     */
    const [state, setState] = useState<S>(() => proxyStateHandler(latestState, linkStateSet));

    useEffect(() => {
      // 刚好巧妙的与resy的订阅监听subscribe结合起来，形成一个reactive更新的包裹容器
      const unsubscribe = store.subscribe((
        effectState,
        prevState,
        nextState,
      ) => {
        // Comp组件内部使用到的数据属性字段数组，放在触发执行保持内部引用数据最新化
        const innerLinkUseFields = Array.from(linkStateSet);

        const effectStateFields = Object.keys(effectState);

        if (
          innerLinkUseFields.some(key => effectStateFields.includes(key as string))
          && (!deepEqual || !isEqual(prevState, nextState))
        ) {
          linkStateSet.clear();
          // 保持代理数据的更新从而保持innerLinkUseFields的最新化
          setState(proxyStateHandler(new Map(Object.entries(nextState)), linkStateSet));
        }
      });
      return () => {
        /**
         * view会使得组件销毁时不执行StoreMap里的subscribe，就无法恢复重置数据
         * 因为它本身是订阅监听执行的，不属于组件的生命周期发生
         * 所以这里需要特定的数据恢复，同时重置恢复内部注意关联到unmountReset的逻辑处理
         */
        (
          (
            store[STORE_CORE_MAP_KEY as keyof S] as StoreCoreMapType<S>
          ).get("linkStateReset") as StoreCoreMapValue<S>["linkStateReset"]
        )(Array.from(linkStateSet));
        unsubscribe();
        linkStateSet.clear();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return useMemo(() => <Comp {...props} state={state}/>, [state, props]);
  }, deepEqual ? (prevProps: P, nextProps: P) => {
    return isEqual(prevProps, nextProps);
  } : undefined);
}
