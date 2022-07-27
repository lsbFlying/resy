/**
 * created by liushanbao
 * @description 一款简单易用的React数据状态管理器
 * @author liushanbao
 * @date 2022-05-05
 * @function resy
 * @name resy
 */
import useSyncExternalStoreExports from "use-sync-external-store/shim";
import scheduler from "./scheduler";
import { useResyDriverKey, storeListenerStateKey } from "./static";
import { Callback, State, Store, EffectState, CustomEventInterface, StoreListenerState } from "./model";

/**
 * 从use-sync-external-store包的导入方式到下面的引用方式
 * 是为了解决该包在ESM中的有效执行，至少目前该包不这样是解决不了ESM执行的问题
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
  /**
   * 为了保证不改变传入的state参数，使用一个状态数据桥，
   * Object.assign或者{...}扩展符都会对于第二级别的数据结构进行引用共用，但是这里不受影响
   * 因为resy本身只做了数据的一级代理，二级数据的更新需要新的对象直接赋值
   * 所以这里巧妙的避免的数据桥的非一级数据引用公用的问题
   * 同时也达到了数据"克隆"的效果，包括后面订阅监听里面的prevState与nextState也是如此
   */
  let stateTemp: T = Object.assign({}, state);
  
  // 每一个store具有的监听订阅对象
  const storeListenerState: StoreListenerState<T> = {
    getState: () => stateTemp,
    resetState: () => {
      if (unmountClear) stateTemp = Object.assign({}, state);
    },
    listenerEventType: Symbol("storeListenerSymbol"),
    dispatchStoreEffectSet: new Set<CustomEventInterface<any>>(),
    dispatchStoreEffect: (effectData: EffectState<T>, prevState: T, nextState: T) => {
      storeListenerState.dispatchStoreEffectSet.forEach(item => item.dispatchEvent(
        storeListenerState.listenerEventType,
        effectData,
        prevState,
        nextState,
      ));
    },
  }
  
  // 数据存储容器store
  const store: Store<T> = {} as Store<T>;
  
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
          if (unmountClear) stateTemp[key] = state[key];
        };
      },
      getString: () => stateTemp[key],
      setString: (val) => {
        /**
         * 考虑极端复杂的情况下业务逻辑有需要更新某个数据为函数，或者本身函数也有变更
         * 那么也会即使更新stateTemp来保持内部state数据的最新情况，所以这里把函数类型放开
         * 同时使用Object.is避免一些特殊情况，虽然实际业务上设置值为NaN/+0/-0的情况并不多见
         */
        if (Object.is(val, stateTemp[key])) return;
        const prevState = Object.assign({}, stateTemp);
        stateTemp[key] = val;
        storeChanges.forEach(storeChange => storeChange());
        if (!scheduler.isBatchUpdating) {
          const nextState = Object.assign({}, stateTemp);
          const effectState = { [key]: val } as EffectState<T>;
          // 单一属性触发数据变动
          storeListenerState.dispatchStoreEffect(effectState, prevState, nextState);
        }
      },
      // 去react官方找一下useSyncExternalStore的源码并看懂它，这一段就可以理解resy实现细粒度更新的巧妙
      useString: () => useSyncExternalStore(
        store[key].subscribe,
        store[key].getString,
      ),
    };
  }
  
  // 为每一个数据字段储存链接到store容器中，这样渲染并发执行提升渲染流畅度
  function solveInitialValueLinkStore(key: keyof T) {
    // 解决初始化属性泛型有?判断符导致store[key]为undefined的问题
    if (store[key] === undefined) {
      genStoreItem(key);
      return store;
    }
    return store;
  }
  
  return new Proxy(state, {
    get: (_, key: keyof T) => {
      if (key === useResyDriverKey) {
        // 给useResy的驱动更新代理
        return new Proxy(store, {
          get: (_t, tempKey: keyof T) => {
            const storeTemp = solveInitialValueLinkStore(tempKey);
            return storeTemp[tempKey].useString();
          },
        } as ProxyHandler<T>);
      }
      if (key === storeListenerStateKey) return storeListenerState;
      return stateTemp[key];
    },
    set: (_, key: keyof T, val: T[keyof T]) => {
      solveInitialValueLinkStore(key)[key]?.setString(val);
      return true;
    },
  } as ProxyHandler<T>);
}

export * from "./utils";
export * from "./resyView";
