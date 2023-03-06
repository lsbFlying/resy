import type { State, Store, StoreCoreMapType, StoreCoreMapValue } from "./model";
import { _DEV_, STORE_CORE_MAP_KEY, USE_STORE_KEY } from "./static";

/**
 * 给Comp组件的props上挂载的state属性数据做一层引用代理
 * @description 核心作用是找出SCU或者useMemo所需要的更新依赖的数据属性
 */
export function proxyStateHandler<S extends State>(
  stateMap: Map<keyof S, S[keyof S]>,
  innerUseStateSet: Set<keyof S>,
) {
  return new Proxy(stateMap, {
    get: (target: Map<keyof S, S[keyof S]>, key: keyof S) => {
      innerUseStateSet.add(key);
      // stateMap(即最新的状态数据Map-latestState)给出了resy生成的store内部数据的引用，这里始终能获取到最新数据
      return target.get(key);
    },
  } as ProxyHandler<Map<keyof S, S[keyof S]>>) as object as S;
}

/**
 * map转object
 * @description 解决回调参数如果是map的proxy代理的话无法做扩展运算的问题
 */
export function mapToObject<S extends State>(map: Map<keyof S, S[keyof S]>): S {
  return [...map.entries()].reduce((obj, [key, value]) => ((obj as S)[key] = value, obj), {}) as S;
}

// 获取最新数据Map对象
export function getLatestStateMap<S extends State = {}>(store: Store<S>) {
  return (
    store[STORE_CORE_MAP_KEY as keyof S] as StoreCoreMapType<S>
  ).get("stateMap") as StoreCoreMapValue<S>["stateMap"];
}

// store传的不是由resy本身的createStore创建产生的store的错误处理
export function storeErrorHandle<S extends State>(store: S) {
  if (_DEV_ && !store[USE_STORE_KEY as keyof S]) {
    throw new Error("The store parameter is not created by resty's createStore！");
  }
}
