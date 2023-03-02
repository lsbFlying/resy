import React, { memo, useEffect, useMemo, useState } from "react";
import type { State, StoreCoreMapType, StoreCoreMapValue, MapStateToProps, Store, PS } from "./model";
import { STORE_CORE_MAP_KEY } from "./static";
import { getLatestStateMap, mapToObject, proxyStateHandler } from "./utils";

/**
 * 自动memo与SCU的高阶HOC
 * @description 自动化规避组件额外re-render的HOC
 * A：通过将Comp组件包裹一层hook，转变成hook组件，从而实现对class组件的支持
 * 本身也自然是支持hook，Comp也可以是hook组件
 *
 * B：view创建初衷：
 * resy本身是为hook而生的，但是还是需要对class组件进行支持
 * class组件依然具有很好的性能与代码健壮性以及读写能力
 *
 * C：view连接了resy生成的store数据，使得Comp组件可以共享store
 * 同时完善了Comp组件自动避免额外re-render，并且特殊的是
 * 它比resy本身自带的规避额外re-render的效果更完善
 * 即如果view包裹的Comp组件即使在其父组件更新渲染了
 * 只要内部使用的数据没有更新，那么它本身不会渲染而产生额外re-render
 *
 * @param store resy生成的store数据状态储存容器
 * @param Comp 被包裹的组件
 * @param isDeepEqual 深度对比自定义函数
 * 可以自定义深对比props与state和之前的props、state状态
 * 从而来决定是否要更新渲染re-render
 *
 * todo resy 本身的数据更新在"避免额外冗余的re-render方面"已经做得较为完备了
 * 剩下的就是需要深对比来进一步优化了，但是深对比所获取的效益需要开发人员自行衡量
 * 如果遇到嵌套较深的大型数据对象，一般不建议深对比，
 * 与此同时，如上所说，resy本身即使不使用isDeepEqual函数参数来优化
 * 也可以取得相当不错的渲染、数据共享等使用效益了
 *
 * 🌟：view更多的是为了兼容class组件，
 * todo 但是暂时无法做到class组件使用多个store数据，后续待优化更进
 * 如果是hook组件，直接使用原生的useMemo然后内部仍然继续使用useStore也是可以的，如下：
 * function SomeHookCom() {
 *   const { ... } = useStore(store);
 *   ...
 * }
 *
 * ... some code start ...
 * {useMemo(() => <SomeHookCom/>, [])}
 * ... some code end ...
 */
export function view<P extends State = {}, S extends State = {}>(
  store: Store<S>,
  // any用于防范某些HOC导致的类型不合一问题，比如withRouter(低版本的react-router还是存在该HOC)
  // tslint:disable-next-line:variable-name
  Comp: React.ComponentType<MapStateToProps<S, P> | any>,
  isDeepEqual?: (prev: PS<P, S>, next: PS<P, S>) => boolean,
) {
  return memo((props: P) => {
    // 引用数据的代理Set
    const innerUseStateSet: Set<keyof S> = new Set();
    
    // 需要使用getState获取store内部的即时最新数据值
    const stateMap = getLatestStateMap(store);
    
    /**
     * @description 给state数据做一个代理，从而让其知晓Comp组件内部使用了哪些数据！
     * 恰巧由于这里的proxy代理，导致在挂载属性数据的时候不能使用扩展运算符，
     * 扩展运算符...会读取所有的属性数据，导致内部关联使用数据属性失去准确性
     * 所以只能挂载到一个集中的属性上，这里选择来props的state属性上
     */
    const [state, setState] = useState<S>(() => proxyStateHandler(stateMap, innerUseStateSet));
    
    useEffect(() => {
      /**
       * @description view会使得组件销毁时不执行StoreMap里的subscribe，就无法恢复重置数据
       * 因为它本身是订阅监听执行的，不属于组件的生命周期发生
       * 所以这里需要特定的数据恢复，同时重置恢复内部注意关联到initialReset的逻辑处理
       */
      (
        (
          store[STORE_CORE_MAP_KEY as keyof S] as StoreCoreMapType<S>
        ).get("viewInitialReset") as StoreCoreMapValue<S>["viewInitialReset"]
      )(Array.from(innerUseStateSet));
      
      // 重置之后需要更新一下重置后的数据生效
      setState(proxyStateHandler(stateMap, innerUseStateSet));
      
      // 刚好巧妙的与resy的订阅监听subscribe结合起来，形成一个reactive更新的包裹容器
      const unsubscribe = store.subscribe((
        effectState,
        prevState,
        nextState,
      ) => {
        const effectStateFields = Object.keys(effectState);
        
        if (
          // Comp组件内部使用到的数据属性字段数组，放在触发执行保持内部引用数据最新化
          Array.from(innerUseStateSet).some(key => effectStateFields.includes(key as string))
          && (!isDeepEqual || !isDeepEqual({ props, state: prevState }, { props, state: nextState }))
        ) {
          /**
           * // innerUseStateSet.clear();
           * @description 保持代理数据的更新从而保持内部引用的最新化
           * 这里暂时不在最新化之前执行 innerUseStateSet.clear();
           * 因为有时候view包裹的组件在因为自身引用数据导致的更新同时又卸载
           * 会使得下面这句setState因为卸载而失效，innerUseStateSet暂时变成了空的
           * 所以这里对于这种情况复杂的需要不采取"预清空"
           * 虽然"预清空"在组件的更新使用效率上更好些，但因为此问题也需要避免
           * 这样一来会把没有完成"预清空"优势的转给当前if的判断条件的执行压力上来
           * 即some循环可能会多走一些，但至少保证innerUseStateSet有使用的数据字段
           * 可以给viewInitialReset逻辑执行使用，但实际上"预清空"优势需要建立在view包裹的组件内部
           * 有为真显示加载组件的情况才会有优势，而实际上这种场景并不多见
           * 所以它的优势是有，但不多不明显，相对而言转嫁给if判断里的some循环的压力也是存在，但并不多不明显
           * 所以这里还是选择移除 innerUseStateSet.clear(); 即可
           */
          setState(proxyStateHandler(new Map(Object.entries(nextState)), innerUseStateSet));
        }
      });
      return () => {
        unsubscribe();
        innerUseStateSet.clear();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    return useMemo(() => <Comp {...props} state={state}/>, [state, props]);
  }, isDeepEqual ? (prevProps: P, nextProps: P) => {
    const latestState = mapToObject(getLatestStateMap(store));
    return isDeepEqual(
      { props: prevProps, state: latestState },
      { props: nextProps, state: latestState },
    );
  } : undefined);
}
