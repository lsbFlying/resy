/**
 * created by liushanbao
 * @description 一款简单易用的React数据状态管理器
 * @author liushanbao
 * @date 2022-05-05
 * @function resy
 * @name resy
 */
import useSyncExternalStoreExports from "use-sync-external-store/shim";
import { dispatchAllStoreEffect, storeListenerKey } from "./static";
import { Callback, State, Store, EffectState, CustomEventDispatcherInterface } from "./model";

/**
 * 从use-sync-external-store包的导入方式到下面的引用方式
 * 是为了解决该包在ESM中的有效执行，至少目前该包不这样是解决不了ESM执行的问题
 * valtio中也是同样的解决方式
 */
const { useSyncExternalStore } = useSyncExternalStoreExports;

/**
 * resy: react state easy
 * created by liushanbao
 * @description 初始化状态编写的时候最好加上一个自定义的准确的泛型类型，
 * 虽然resy会有类型自动推断，但是对于数据状态类型可能变化的情况下还是不够准确的
 * @author liushanbao
 * @date 2022-05-05
 * @param state
 * @param unmountClear
 * @description unmountClear参数主要是为了在某模块卸载的时候自动清除初始化数据，恢复数据为初始化传入的state数据
 * 之所以会有unmountClear这样的参数设计是因为resy为了极简的使用便利性，一般是放在某个文件中进行调用返回一个store
 * 但是之后再进入该模块之后都是走的Node.js的import的缓存了，即没有再次执行resy方法了导致数据状态始终保持
 * 也就是在 "静态模板" 的实现方式下，函数是不会再次运行的
 * 但这不是一个坏事儿，因为本身store作为一个全局范围内可控可引用的状态存储器而言，具备这样的能力是有益的
 * 比如登录后的用户信息数据作为一个全局模块都可公用分享的数据而言就很好的体现了这一点
 * 但这种全局真正公用分享的数据是相对而言少数的，大部分情况下是没那么多要全局分享公用的数据的
 * 所以unmountClear默认设置为true，符合常规使用即可，除非遇到像上述登录信息数据那样的全局数据而言才会设置为false
 */
export function resy<T extends State>(state: T, unmountClear: boolean = true): T {
  
  // 每一个store具有的监听订阅对象
  const storeListener = {
    listenerEventType: Symbol("storeListenerSymbol"),
    dispatchStoreEffectSet: new Set<CustomEventDispatcherInterface<any>>(),
    dispatchStoreEffect: <T extends State>(effectData: EffectState<T>, preState: T, nextState: T) => {
      /**
       * 采用这种全触发：
       * 一是为了支持所有store所有数据的订阅支持，
       * 二是这种写法简单，
       * 三是考虑订阅监听的场景并不多，即使有几个订阅也不影响性能
       */
      storeListener.dispatchStoreEffectSet.forEach(item => item.dispatchEvent(
        storeListener.listenerEventType,
        effectData,
        preState,
        nextState,
      ));
    },
  }
  
  // 数据存储容器store
  const store: Store<T> = {} as Store<T>;
  
  // 初始化默认数据缓存，方便配合unmountClear参数重置模块状态数据
  const defaultState: T = {} as T;
  
  // 生成store元素Item
  function genStoreItem(key: keyof T) {
    /**
     * 这里使用set不使用纯对象或者数组的原因很简单：
     * 就是Set或者Map类型在频繁添加和删除元素的情况下有明显的性能优势
     */
    const storeChanges = new Set<Callback>();
    store[key] = {
      subscribe: (storeChange) => {
        storeChanges.add(storeChange);
        return () => {
          storeChanges.delete(storeChange);
          if (unmountClear) {
            unmountClear = false;
            const timeId = setTimeout(() => {
              unmountClear = true;
              Object.keys(store).forEach((key: keyof T) => {
                state[key] = defaultState[key];
              });
              clearTimeout(timeId);
            }, 0);
          }
        };
      },
      getString: () => state[key],
      setString: (val) => {
        const preState = Object.assign({}, state);
        // 避免一些特殊情况，虽然实际业务上设置值为NaN/+0/-0的情况并不多见
        if (Object.is(val, state[key]) || typeof val === "function") return;
        state[key] = val;
        const nextState = Object.assign({}, state);
        storeChanges.forEach(storeChange => storeChange());
        const effectState = { [key]: val } as EffectState<T>;
        dispatchAllStoreEffect<T>(effectState, preState, nextState);
        storeListener.dispatchStoreEffect<T>(effectState, preState, nextState);
      },
      // 去react官方找一下useSyncExternalStore的源码并看懂它，这一段就可以理解resy实现细粒度更新的巧妙
      useString: () => useSyncExternalStore(
        store[key].subscribe,
        store[key].getString,
      ),
    };
  }
  
  /**
   * 循环遍历的方式本身并不会对性能造成多大的损失
   * 会对性能造成一定开销的是resy最终输出的proxy构成的观察者模式
   * 但是本身resy的工作方式是细粒度更新的，全局引用，是一个"自由的"全局状态，它是调用的范围更广
   * 且连接的更新是细粒度更新，避免了re-render是它一方面的弥补性能差距的小优势
   */
  Object.keys(state).forEach((key: keyof T) => {
    defaultState[key] = state[key];
    if (typeof state[key] === "function") return;
    genStoreItem(key);
  });
  
  // 解决初始化属性泛型有?判断符导致store[key]为undefined的问题
  function resolveInitValueUndefined(key: keyof T, val?: any) {
    if (store[key] === void 0 && typeof val !== "function") {
      genStoreItem(key);
      return store[key];
    }
    // 解决一开始?的属性后续设置是函数的情况
    if (!state[key] && store[key] === void 0 && typeof val === "function") {
      state[key] = val;
    }
    return store[key];
  }
  
  /**
   * @description
   * 1、下面会使用try catch一是用来捕捉undefined的属性调用报错，
   * 二是为了避免在hook中去解构(属性读取)的时候调用hook导致的hook规则报错
   * 虽然说不要在别的hook中对store使用解构(属性读取)，否则会报错hook使用规则错误，
   * 而且我们理论上也确实应该在函数组件的最顶层使用，即也要符合hook的使用规则，
   * 但实际上这些规则的限制导致我们在使用状态数据的时候极为不便，所以这里，try catch使用
   * 主要是为了弥补上面两个缘由，但实际上这并不会影响导致数据状态的混乱与错误
   *
   * 因为：
   * A、解构(属性读取)的时候有异常了之后会捕捉在catch中return state[key]返回正常的值，
   * 且在setString中有state[key] = val始终保持着最新值的赋值更新给予，所以这里能够取到最新值，
   * 而我们getString中得到的也始终是state中的值，也就是初始化的默认常量对象，
   * 至于页面的更新渲染本质上是useSyncExternalStore这个hook内部的监听变化函数调用内部的setHook更新进而触发的
   *
   * B、赋值更新的时候属于更新状态并没有调用hook，它是hook本身状态内部的监听函数的执行进行的更新渲染
   *
   * 2、这里所说的的避免hook规则报错主要是针对use(Layout)Effect/useMemo等hook，
   * 但这本质上也不属于异常捕捉处理，因为resy返回的store为了使用上的极简方便性-随取随用，所以这里返回来最新数据值
   * 而在setString中有state[key] = val始终保持着最新值的赋值更新给予，所以这里能够取到最新值
   *
   * 3、但是对于useMemo这个hook却很奇怪无法避免该hook的规则报错，即resy不能在useMemo中使用解构(属性读取)
   * 就是即使你使用了try catch捕捉报错也无法规避useMemo的hook规则报错
   * 但这种限制又很奇特，如果你将useMemo中的hook调用变成组件，如：{useMemo(() => <Components/>, [])}
   * 而不是一个方法的调用如：{useMemo(() => xxxFunction(), [])}，这样就不会出现hook使用规则报错的问题了
   * 但是有时候我们仅仅只是一个逻辑的调用而不是组件的调用的情况下就没法避免useMemo的hook规则报错了
   * 对于这种memo逻辑调用出现的hook规则报错，resyMemo可解决该问题
   *
   * todo resy的观察者模式导致它的性能上可能会受到一定的损失，
   * todo 但事实上valtio甚至对数据进行了纵深递归代理，其内存消耗依赖相对而言更高
   * todo 所以这里resy是否有性能损失还有待考究或者说待优化，至少目前使用上并未有性能问题
   */
  return new Proxy(state, {
    get: (_, key: keyof T) => {
      if (key === storeListenerKey) {
        return storeListener;
      }
      try {
        return resolveInitValueUndefined(key).useString();
      } catch (e) {
        return state[key];
      }
    },
    set: (_, key: keyof T, val: T[keyof T]) => {
      resolveInitValueUndefined(key, val)?.setString(val);
      return true;
    },
  } as ProxyHandler<T>);
}

export * from "./api";
