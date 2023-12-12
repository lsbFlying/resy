import type { PrimitiveState, MapType, Callback, ObjectMapType } from "../types";
import type { Unsubscribe } from "../subscribe/types";
import type { Store } from "../store/types";

/** view中equal函数的参数类型，props与state的类型合集 */
export type PS<P extends PrimitiveState = {}, S extends PrimitiveState = {}> = Readonly<{
  props: P;
  state: S;
}>;

/** view返回函数的参数类型 */
export type ViewOptionsType<P extends PrimitiveState = {}, S extends PrimitiveState = {}> = {
  stores?: Store<S> | Stores<S>;
  equal?: (next: PS<P, S>, prev: PS<P, S>) => boolean;
};

/**
 * @description StoreViewMap的数据值类型，作为view这个api的核心Map接口类型
 * 具备处理store的重置数据、以及获取最新state数据等相关处理功能
 */
export type StoreViewMapValue<S extends PrimitiveState> = {
  // store内部的stateMap数据对象
  getStateMap: MapType<S>;
  // view卸载检查重置数据
  viewUnmountRestore: Callback;
  // view初始化刷新恢复（createStore的initialState是函数的情况下）
  viewInitialStateFnRestore: Callback;
  // view的props数据使用方式的数据生命周期与store关联同步
  viewConnectStore: () => Unsubscribe;
};

// 供view使用的核心连接容器Map，包括处理内部stateMap数据以及重置初始化数据的方法
export type StoreViewMapType<S extends PrimitiveState> = MapType<StoreViewMapValue<S>>;

/** 针对class组件的混合store数据状态类型 */
export type MultipleState = Record<number | string, Store<any>>;

/** 多个store的类型 */
export type Stores<S extends MultipleState> = { [key in keyof S]: Store<S[key]> };

/**
 * 将resy生成的store容器数据映射挂载到组件props的state属性上
 * @description 对于挂在属性数据的接口类型的命名，期间甚至考虑过MapStoreToProps
 * 但是这样以来会使得需要从store中解构数据进行使用，这与createStore的store相冲突
 * 所以放弃了这一考量，然后this.props.state与this.state可能会使得未解触过react的萌新产生疑惑
 * 但是又没有别的更好的名称，同时MapStateToProps与redux的connect的参数名相同
 * 且大体含义理解相近，在社区有公共的认知考量，所以出于resy本身低学习成本的考虑综合而言还是选择了MapStateToProps这个名称
 */
export type MapStateToProps<S extends PrimitiveState, P extends PrimitiveState = {}> = P & {
  readonly state: S;
}

// view内部的stateMap的数据类型，根据是否是多store连接使用会有变化
export type ViewStateMapType<S extends PrimitiveState> = MapType<S> | ObjectMapType<S>;
