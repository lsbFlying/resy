import { _DEV_, STORE_CORE_MAP_KEY, USE_STORE_KEY } from "./static";
import type { State, StateFunc, Store, StoreCoreMapType, StoreCoreMapValue } from "./model";

/**
 * 给Comp组件的props上挂载的state属性数据做一层引用代理
 * @description 核心作用是找出SCU或者useMemo所需要的更新依赖的数据属性
 */
export function proxyStateHandler<S extends State>(
  stateMap: Map<keyof S, S[keyof S]>,
  innerUseStateSet: Set<keyof S>,
) {
  const store = new Proxy(stateMap, {
    get: (target: Map<keyof S, S[keyof S]>, key: keyof S, receiver) => {
      innerUseStateSet.add(key);
      /**
       * stateMap(即最新的状态数据Map-latestState)给出了resy生成的store内部数据的引用，
       * 这里始终能获取到最新数据
       * 同时兼容考虑Reflect的bug兼容写法
       */
      return receiver === store
        ? target.get(key)
        : Reflect.get(target, key, receiver);
    },
  } as ProxyHandler<Map<keyof S, S[keyof S]>>) as object as S;
  return store;
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
    (
      store[STORE_CORE_MAP_KEY as keyof S] as StoreCoreMapType<S>
    ).get("getStateMap") as StoreCoreMapValue<S>["getStateMap"]
  )();
}

// store传的不是由resy本身的createStore创建产生的store的错误处理
export function storeErrorHandle<S extends State>(store: S) {
  if (_DEV_ && !store[USE_STORE_KEY as keyof S]) {
    throw new Error("The store parameter is not created by resty's createStore！");
  }
}

// 数据更新参数报错处理
export function updateDataErrorHandle<S extends State>(stateParams: Partial<S> | StateFunc<S>, errName: string) {
  if (
    _DEV_ && (
      (
        Object.prototype.toString.call(stateParams) !== "[object Object]"
        && Object.prototype.toString.call(stateParams) !== "[object Function]"
      ) || (
        Object.prototype.toString.call(stateParams) === "[object Function]"
        && Object.prototype.toString.call((stateParams as StateFunc<S>)()) !== "[object Object]"
      )
    )
  ) {
    throw new Error(`The state parameter of ${errName} is either an object or a function that returns an object!`);
  }
}
