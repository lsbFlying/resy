import type { PrimitiveState, MapType } from "../types";
import type { StateRestoreAccomplishedMapType, InitialFnCanExecMapType } from "./types";
import type { InitialState, StateRefCounterMapType } from "../store/types";
import { hasOwnProperty, clearObject } from "../utils";

/**
 * @description 获取目前所有的keys
 * 🌟 这里需要合并处理key的问题，因为可能存在delete key的情况
 * 这会导致字段属性数据不统一协调，存在缺失导致数据变化没有完全捕捉到
 * 而restore回复到原始数据状态需要捕捉到所有的状态key然后才可以捕捉到所有的value变化
 * 包括initialRestore或者unmountRestore都是如此
 * 所以这里需要使用merge合并key进行数据属性以及状态的合并捕捉处理
 * 这里也不用担心后续增加的key如果被删除的情况，因为每一次的delete操作也属于更新操作
 * 并且会有相应的delete key的完善更进，所以这里的处理足以完成回复到初始状态的功能
 */
export const mergeStateKeys = <S extends PrimitiveState>(
  reducerState: S,
  stateMap: MapType<S>,
) => Array.from(
    new Set(
      (
      Object.keys(reducerState) as (keyof S)[]
      ).concat(
        Array.from(stateMap.keys())
      )
    )
  );

// 获取还原出来的state
export const handleReducerState = <S extends PrimitiveState>(
  reducerState: S,
  initialState?: InitialState<S>,
) => {
  /**
   * @description 如果是函数返回的初始化状态数据，则需要再次执行初始化函数来获取内部初始化的逻辑数据
   * 防止因为初始化函数的内部逻辑导致重置恢复的数据不符合初始化的数据逻辑
   *
   * 卸载的情况下也选择函数刷新执行恢复，是因为我们很难把控到initialState参数作为函数的情况下
   * 它的内部逻辑有怎样的需求设定会执行我们难以预料的一些逻辑操作，所以为了安全起见选择卸载的情况下也执行一下函数刷新恢复
   */
  if (typeof initialState === "function") {
    clearObject(reducerState);
    Object.entries(initialState()).forEach(([key, value]) => {
      reducerState[key as keyof S] = value;
    });
  }
};

const restoreHandle = <S extends PrimitiveState>(
  reducerState: S,
  stateMap: MapType<S>,
  initialState?: InitialState<S>,
) => {
  // 进一步获取最新的还原状态数据
  handleReducerState(reducerState, initialState);
  /**
   * @description 重置数据状态（一次性全部重置）相较于直接复制 stateMap = new Map(state)的方式效率更快
   * 之所以选择全部重置是因为防止某些模块未被及时渲染导致后续数据没有被初始化恢复
   */
  mergeStateKeys(reducerState, stateMap).forEach(key => {
    hasOwnProperty.call(reducerState, key)
      ? stateMap.set(key, reducerState[key])
      : stateMap.delete(key);
  });
};

/**
 * 初始化渲染恢复重置数据处理
 * @description 通过storeStateRefCounterMap判断当前数据是否还有组件引用
 * 只要还有一个组件在引用当前数据，都不会重置数据，
 * 因为当前还在业务逻辑中，不属于完整的卸载
 * 完整的卸载周期对应表达的是整个store的使用周期
 *
 * most important
 * detail course: 经过多次的临项实验
 * 最终确认放在卸载过程重置同时结合store整体的数据引用才是安全的
 *
 * 与此同时需要注意的是，如果initialState是函数，
 * 那么后续重新渲染的时候需要重新执行initialState函数恢复初始化状态数据reducerState
 *
 * 所以restoreHandle运用在两个阶段，一是卸载阶段，一是初始化阶段
 */
export const unmountRestoreHandle = <S extends PrimitiveState>(
  unmountRestore: boolean,
  reducerState: S,
  stateMap: MapType<S>,
  storeStateRefCounterMap: StateRefCounterMapType,
  stateRestoreAccomplishedMap: StateRestoreAccomplishedMapType,
  initialFnCanExecMap: InitialFnCanExecMapType,
  initialState?: InitialState<S>,
) => {
  if (
    unmountRestore
    && !storeStateRefCounterMap.get("counter")
    && !stateRestoreAccomplishedMap.get("unmountRestoreAccomplished")
  ) {
    if (typeof initialState !== "function") {
      stateRestoreAccomplishedMap.set("unmountRestoreAccomplished", true);
      restoreHandle(reducerState, stateMap, initialState);
    }
    initialFnCanExecMap.set("canExec", true);
  }
};

// initialState是函数的情况下的刷新恢复处理（与unmountRestoreHandle分开处理避免开关状态的混乱产生执行逻辑错误）
export const initialStateFnRestoreHandle = <S extends PrimitiveState>(
  reducerState: S,
  stateMap: MapType<S>,
  storeStateRefCounterMap: StateRefCounterMapType,
  stateRestoreAccomplishedMap: StateRestoreAccomplishedMapType,
  initialFnCanExecMap: InitialFnCanExecMapType,
  initialState?: InitialState<S>,
) => {
  if (
    typeof initialState === "function"
    && initialFnCanExecMap.get("canExec")
    && !storeStateRefCounterMap.get("counter")
    && !stateRestoreAccomplishedMap.get("initialStateFnRestoreAccomplished")
  ) {
    stateRestoreAccomplishedMap.set("initialStateFnRestoreAccomplished", true);
    restoreHandle(reducerState, stateMap, initialState);
    initialFnCanExecMap.set("canExec", true);
  }
};
