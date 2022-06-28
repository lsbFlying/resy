/**
 * created by liushanbao
 * @description 一款简单易用的React数据状态管理器
 * @author liushanbao
 * @date 2022-05-05
 * @function resy
 * @name resy
 */
import useSyncExternalStoreExports from "use-sync-external-store/shim";
import { dispatchAllStoreEffect, getResyStateKey, storeListenerKey } from "./static";
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
  
  let stateTemp: T = Object.assign({}, state);
  
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
              stateTemp = Object.assign({}, state);
              clearTimeout(timeId);
            }, 0);
          }
        };
      },
      getString: () => stateTemp[key],
      setString: (val) => {
        // 避免一些特殊情况，虽然实际业务上设置值为NaN/+0/-0的情况并不多见
        if (Object.is(val, stateTemp[key]) || typeof val === "function") return;
        const preState = Object.assign({}, stateTemp);
        stateTemp[key] = val;
        storeChanges.forEach(storeChange => storeChange());
        const nextState = Object.assign({}, stateTemp);
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
  
  // 为每一个数据字段储存链接到store容器中，这样渲染并发执行提升渲染流畅度
  function resolveInitialValueLinkStore(key: keyof T, val?: any) {
    // 解决初始化属性泛型有?判断符导致store[key]为undefined的问题
    if (store[key] === undefined && typeof val !== "function") {
      genStoreItem(key);
      return store[key];
    }
    // 解决一开始?的属性后续设置是函数的情况
    if (stateTemp[key] === undefined && store[key] === undefined && typeof val === "function") {
      stateTemp[key] = val;
    }
    return store[key];
  }
  
  /**
   * @description
   * 1、下面会使用try catch
   * 是为了避免在非组件的函数中去解构(属性读取)的时候导致的hook规则报错
   * 而且我们理论上也确实应该在函数组件的最顶层使用，即也要符合hook的使用规则，
   * 但实际上这些规则的限制导致我们在使用状态数据的时候极为不便，所以这里，try catch使用
   * 主要是为了弥补上面两个缘由，但实际上这并不会影响导致数据状态的混乱与错误
   *
   * 因为：
   * A、解构(属性读取)的时候有异常了之后会捕捉在catch中return stateTemp[key]返回正常的值，
   * 且在setString中有stateTemp[key] = val始终保持着最新值的赋值更新给予，所以这里能够取到最新值，
   * 而我们getString中得到的也始终是state中的值，也就是初始化的默认常量对象，
   * 至于页面的更新渲染本质上是useSyncExternalStore这个hook内部的监听变化函数调用内部的setHook更新进而触发的
   *
   * B、赋值更新的时候属于更新状态并没有调用hook，它是hook本身状态内部的监听函数的执行进行的更新渲染
   *
   * 2、但是对于useMemo这个hook却很奇怪无法避免该hook的规则报错，即resy不能在useMemo中使用解构(属性读取)
   * 就是即使你使用了try catch捕捉报错也无法规避useMemo的hook规则报错
   * 但这种限制又很奇特，如果你将useMemo中的hook调用变成组件，如：{useMemo(() => <Components/>, [])}
   * 而不是一个方法的调用如：{useMemo(() => xxxFunction(), [])}，这样就不会出现hook使用规则报错的问题了
   * 但是有时候我们仅仅只是一个逻辑的调用而不是组件的调用的情况下就没法避免useMemo的hook规则报错了
   * 对于这种memo逻辑调用出现的hook规则报错，resyMemo可解决该问题
   */
  return new Proxy(state, {
    get: (_, key: keyof T) => {
      if (key === storeListenerKey) return storeListener;
      if (key === getResyStateKey) return stateTemp;
      try {
        return resolveInitialValueLinkStore(key).useString();
      } catch (e) {
        return stateTemp[key];
      }
    },
    set: (_, key: keyof T, val: T[keyof T]) => {
      resolveInitialValueLinkStore(key, val)?.setString(val);
      return true;
    },
  } as ProxyHandler<T>);
}

export * from "./utils";
