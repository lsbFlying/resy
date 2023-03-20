import React, { memo, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { STORE_CORE_MAP_KEY } from "./static";
import { getLatestStateMap, mapToObject, proxyStateHandler, storeErrorHandle } from "./utils";
import type {State, StoreCoreMapType, StoreCoreMapValue, MapStateToProps, Store, PS, AnyFn} from "./model";

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
 * be careful: resy 本身的数据更新在"避免额外冗余的re-render方面"已经做得较为完备了
 * 剩下的就是需要深对比来进一步优化了，但是深对比所获取的效益需要开发人员自行衡量
 * 如果遇到嵌套较深的大型数据对象，一般不建议深对比，
 * 与此同时，如上所说，resy本身即使不使用isDeepEqual函数参数来优化
 * 也可以取得相当不错的渲染、数据共享等使用效益了
 *
 * 🌟：view更多的是为了兼容class组件，
 * todo: 但是暂时无法做到class组件使用多个store数据，后续待优化更进
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
  isDeepEqual?: (next: PS<P, S>, prev: PS<P, S>) => boolean,
) {
  storeErrorHandle(store);
  
  // 引用数据的代理Set
  const innerUseStateSet: Set<keyof S> = new Set();
  
  // 需要使用getState获取store内部的即时最新数据值
  const stateMap = getLatestStateMap(store);
  
  return memo((props: P) => {
    /**
     * @description 给state数据做一个代理，从而让其知晓Comp组件内部使用了哪些数据！
     * 恰巧由于这里的proxy代理，导致在挂载属性数据的时候不能使用扩展运算符，
     * 扩展运算符...会读取所有的属性数据，导致内部关联使用数据属性失去准确性
     * 所以只能挂载到一个集中的属性上，这里选择来props的state属性上
     */
    const [state, setState] = useState<S>(() => proxyStateHandler(stateMap, innerUseStateSet));
    
    /**
     * 不能简单地使用 sort，使用 sort 并不靠谱。因为 Set 里面的内容可能有很多种类
     * 字符串、对象、数字，不同类型之间是不可对比的，所以排序结果并不会一致
     * 最好的方式是按照数学上集合相等的定义：* A = B 当且仅当 A 是 B 的子集并且 B 是 A 的子集
     */
    function isContentSameSet(s1: Set<keyof S>, s2: Set<keyof S>) {
      // 获取一个集合所有的值，判断另外一个集合是否全部包含该这些值
      const innerSame = (a: Set<keyof S>, b: Set<keyof S>) => {
        const values = [...a]
        for (let val of values) {
          // 及时跳出循环，降低复杂度
          if (!b.has(val)) return false
        }
        return true
      }
      // a 包含 b，b 包含 a，那么两个集合相同
      return innerSame(s1, s2) && innerSame(s2, s1)
    }
    
    function viewConnectHandle(vcs: Set<AnyFn>, ius?: Set<keyof S>) {
      (ius || innerUseStateSet).forEach(key => {
        // 将view关联到store内部的subscribe，进行数据生命周期的同步
        vcs.add(
          (
            (
              store[STORE_CORE_MAP_KEY as keyof S] as StoreCoreMapType<S>
            ).get("viewConnectStore") as StoreCoreMapValue<S>["viewConnectStore"]
          )(key)
        );
      });
    }
    
    // 防止更新撕裂，做一个useLayoutEffect兼容处理
    useLayoutEffect(() => {
      const innerUseStateSetLayout: Set<keyof S> = new Set();
      const stateLayout = proxyStateHandler(getLatestStateMap(store), innerUseStateSetLayout);
      const viewConnectStoreSet = new Set<AnyFn>();
      // 有可能因为自身的数据属性使用变化但是size没有变，所以需要多一个内容判断
      if (
        innerUseStateSetLayout.size !== innerUseStateSet.size
        || !isContentSameSet(innerUseStateSetLayout, innerUseStateSet)
      ) {
        viewConnectHandle(viewConnectStoreSet, innerUseStateSetLayout);
        setState(stateLayout);
      }
      return () => viewConnectStoreSet.forEach(unsubscribe => unsubscribe());
    }, []);
    
    useEffect(() => {
      const viewConnectStoreSet = new Set<AnyFn>();
      viewConnectHandle(viewConnectStoreSet);
      
      // 刚好巧妙的与resy的订阅监听subscribe结合起来，形成一个reactive更新的包裹容器
      const unsubscribe = store.subscribe((
        effectState,
        nextState,
        prevState,
      ) => {
        const effectStateFields = Object.keys(effectState);
        
        if (
          // Comp组件内部使用到的数据属性字段数组，放在触发执行保持内部引用数据最新化
          Array.from(innerUseStateSet).some(key => effectStateFields.includes(key as string))
          && (!isDeepEqual || !isDeepEqual({ props, state: nextState }, { props, state: prevState }))
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
        viewConnectStoreSet.forEach(unsubscribe => unsubscribe());
        innerUseStateSet.clear();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    return useMemo(() => <Comp {...props} state={state}/>, [state, props]);
  }, isDeepEqual ? (prevProps: P, nextProps: P) => {
    // props与state的变化可能存在同时变化的情况，但不影响isDeepEqual的执行
    const latestState = mapToObject(getLatestStateMap(store));
    return isDeepEqual(
      { props: nextProps, state: latestState },
      { props: prevProps, state: latestState },
    );
  } : undefined);
}
