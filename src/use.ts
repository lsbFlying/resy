import { useMemo } from "react";
import { USE_CONCISE_STORE_KEY } from "./static";
import { createStore } from "./createStore";
import { protoPointStoreErrorHandle, storeErrorHandle } from "./errorHandle";
import type {
  PrimitiveState, ConciseStore, InitialState, AnyFn, Store, StoreMap,
  ConciseExternalMapType, ConciseExternalMapValue, ExternalMapType,
  MapType, Scheduler, StateRestoreAccomplishedMapType, ValueOf,
} from "./model";
import { followUpMap } from "./utils";
import { connectHookUse } from "./reduce";

/**
 * 驱动组件更新
 * @description 驱动组件更新的hook，使用store容器中的数据
 * 特意分离直接从store获取hook调用是为了数据的安全使用
 * 本身产生的数据就是hook数据，所以会多一层代理
 * @param store
 * @return S
 */
export const useStore = <S extends PrimitiveState>(store: S): S => {
  storeErrorHandle(store, "useStore");
  return store["useData" as keyof S];
};

/**
 * useConciseState钩子功能插槽方法
 * 以分功能模式减轻createStore的体积
 */
const __conciseStateSlot__ = <S extends PrimitiveState>(
  unmountRestore: boolean,
  externalMap: ExternalMapType<S>,
  reducerState: S,
  store: Store<S>,
  singlePropUpdate: (key: keyof S, value: ValueOf<S>, isDelete?: true) => void,
  stateMap: MapType<S>,
  storeStateRefCounter: number,
  storeMap: StoreMap<S>,
  stateRestoreAccomplishedMap: StateRestoreAccomplishedMapType,
  schedulerProcessor: MapType<Scheduler>,
  initialState?: InitialState<S>,
) => {
  const conciseExternalMap = followUpMap(externalMap) as ConciseExternalMapType<S>;

  /**
   * @description 给useConciseState的store代理的额外的store代理，
   * 同时store不仅仅是单纯的数据读取操作，set/sync/sub三个函数的使用一样可以，
   * 并且也让store具有单个数据属性更新的能力
   * 与createStore生成的store具有一样的功能
   * be careful: 这样主要是为了解决react的useState中产生的数据不具有可追溯性的问题
   * 比如在某些函数中因为因为或者作用域的不同导致函数内部再次获取useState的数据会不准确
   * 而使用这个额外的store来读取数据可以具有追溯性得到最新的数据状态
   */
  const conciseExtraStore = new Proxy(storeMap, {
    get: (_: StoreMap<S>, key: keyof S, receiver: any) => {
      protoPointStoreErrorHandle(receiver, conciseExtraStore);

      if (typeof stateMap.get(key) === "function") {
        return (stateMap.get(key) as AnyFn).bind(store);
      }

      return conciseExternalMap.get(key as keyof ConciseExternalMapValue<S>) || stateMap.get(key);
    },
    set: (_: S, key: keyof S, value: ValueOf<S>) => singlePropUpdate(key, value),
    deleteProperty: (_: S, key: keyof S) => singlePropUpdate(key, undefined as ValueOf<S>, true),
  } as any as ProxyHandler<StoreMap<S>>) as any as Store<S>;

  conciseExternalMap.set("store", conciseExtraStore);

  /**
   * @description 给useConciseState的驱动更新代理，与useStore分开，因为二者承担功能点有些区别
   * useStore中不需要store属性，而useConciseState可以有store属性
   * useStore中使用的store可以使用setOptions，而useConciseState中的store属性不能使用setOptions
   * 因为useConciseState本质上是createStore的memo包裹，所以重新渲染的时候无法使用静态createStore的已存在store
   * 而是createStore生成的新的store，而它只能是unmountRestore是true，必然会是useState一样的数据渲染效果
   * 所以自然也就不像具备全局性的createStore那样存在setOptions方法
   */
  const conciseStoreProxy = new Proxy(storeMap, {
    get: (_, key: keyof S) => {
      if (typeof stateMap.get(key) === "function") {
        // 也做一个函数数据hook的调用，给予函数数据更新渲染的能力
        connectHookUse(
          key, unmountRestore, reducerState, stateMap, storeStateRefCounter,
          storeMap, stateRestoreAccomplishedMap, schedulerProcessor, initialState,
        );
        return (stateMap.get(key) as AnyFn).bind(store);
      }
      return conciseExternalMap.get(key as keyof ConciseExternalMapValue<S>) || connectHookUse(
        key, unmountRestore, reducerState, stateMap, storeStateRefCounter,
        storeMap, stateRestoreAccomplishedMap, schedulerProcessor, initialState,
      );
    },
  } as ProxyHandler<StoreMap<S>>);

  externalMap.set(USE_CONCISE_STORE_KEY, conciseStoreProxy);
};

/**
 * useState的简明版本
 * @description 帮助组件可以使用resy创建私有化的store数据状态容器
 * 它可以用如下方式：
 * const { count, text, setState } = useConciseState({ count: 0, text: "hello" });
 * 作用实现其实就是等价于原生的useState：
 * const [count, setCount] = useState(0);
 * const [text, setText] = useState("hello");
 * 🌟: useConciseState相对于useState在多个数据状态时使用相对简单明了
 * 🌟:同时 useConciseState中可以解析出store属性，通过store可以读取各个数据的最新数据值
 * 弥补了useState中无法读取属性数据的最新值的不足，这是最核心的关键点
 * @param initialState
 * @return ConciseStore<S>
 */
export const useConciseState = <S extends PrimitiveState>(
  initialState?: InitialState<S>,
): ConciseStore<S> =>
  // eslint-disable-next-line react-hooks/exhaustive-deps
    useMemo(() => createStore<S>(
      initialState,
      {
        unmountRestore: true,
        __conciseStateSlot__,
      },
    ), [])[USE_CONCISE_STORE_KEY as keyof S]
;
