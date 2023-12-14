/**
 * @description 本文件是view的内部代码抽离拆解的一些方法
 */
import type { Dispatch, SetStateAction } from "react";
import type {
  Callback, MapType, ObjectMapType, ObjectType, PrimitiveState, ValueOf,
} from "../types";
import type { Store, InitialState, StateRefCounterMapType } from "../store/types";
import type {
  PS, Stores, StoreViewMapType, ViewStateMapType, StoreViewMapValue,
} from "./types";
import type { Scheduler } from "../scheduler/types";
import type { Unsubscribe } from "../subscribe/types";
import { mapToObject, objectToMap, hasOwnProperty } from "../utils";
import { protoPointStoreErrorHandle, storeErrorHandle } from "../errors";
import { REGENERATIVE_SYSTEM_KEY, VIEW_CONNECT_STORE_KEY } from "../static";
import { unmountRestoreHandle, initialStateFnRestoreHandle } from "../reset";
import type { StateRestoreAccomplishedMapType, InitialFnCanExecMapType } from "../reset/types";

/**
 * 给Comp组件的props上挂载的state属性数据做一层引用代理
 * @description 核心作用是找出SCU或者useMemo所需要的更新依赖的数据属性
 */
const stateRefByProxyHandle = <S extends PrimitiveState>(
  stateMap: MapType<S>,
  innerUseStateSet: Set<keyof S>,
) => {
  const store = new Proxy(stateMap, {
    get: (_, key: keyof S, receiver: any) => {
      protoPointStoreErrorHandle(receiver, store);

      innerUseStateSet.add(key);
      return stateMap.get(key);
    },
  } as ProxyHandler<MapType<S>>) as object as S;
  return store;
};

// 获取最新数据Map对象（针对单个/无store，多个store就遍历再多次调用）
export const getLatestStateMap = <S extends PrimitiveState>(store?: Store<S> | Stores<S>) => {
  if (!store || !store[REGENERATIVE_SYSTEM_KEY as keyof S]) return new Map() as MapType<S>;
  return (
    store[VIEW_CONNECT_STORE_KEY as keyof S] as StoreViewMapType<S>
  ).get("getStateMap") as StoreViewMapValue<S>["getStateMap"];
};

// view多个store的最新数据的处理
export const viewStoresToLatestState = <S extends PrimitiveState>(stores: Stores<S>) => {
  const latestStateTemp = {} as { [key in keyof Stores<S>]: ValueOf<S> };
  for (const storesKey in stores) {
    if (hasOwnProperty.call(stores, storesKey)) {
      latestStateTemp[storesKey] = mapToObject(getLatestStateMap(stores[storesKey]));
    }
  }
  // as S 是为了配合view的equal函数的类型识别
  return latestStateTemp as S;
};

// view多个store的state更新处理
const viewStoresStateUpdateHandle = <S extends PrimitiveState>(
  state: { [key in keyof Stores<S>]: S },
  innerUseStateSet: Set<keyof S>,
  nextState: S,
  storesKey?: keyof Stores<S>,
) => {
  const stateTemp: { [key in keyof Stores<S>]: S } = Object.assign({}, state);
  Object.keys(state).forEach(storesKeyItem => {
    if (storesKey === storesKeyItem) {
      stateTemp[storesKey] = stateRefByProxyHandle(objectToMap(nextState), innerUseStateSet);
    }
  });
  return stateTemp;
};

const viewRestoreHandle = <S extends PrimitiveState>(
  action: "viewUnmountRestore" | "viewInitialStateFnRestore",
  stores?: Store<S> | Stores<S>,
) => {
  if (!stores) return;
  // 单个Store
  if ((stores as Store<S>)[REGENERATIVE_SYSTEM_KEY as keyof S]) {
    (
      (
        (stores as Store<S>)?.[VIEW_CONNECT_STORE_KEY as keyof S] as StoreViewMapType<S>
      )?.get(action) as Callback
    )?.();
  } else {
    (Object.keys(stores) as (keyof Stores<S>)[]).forEach(storesKey => {
      const storeItem = (stores as Stores<S>)[storesKey] as Store<S>;
      (
        (
          storeItem?.[VIEW_CONNECT_STORE_KEY as keyof S] as StoreViewMapType<S>
        )?.get(action) as Callback
      )?.();
    });
  }
};

// 初始化state数据处理函数
export const initialStateHandle = <S extends PrimitiveState>(
  innerUseStateMapSet: Set<keyof S> | Map<keyof Stores<S>, Set<keyof S>>,
  stores?: Store<S> | Stores<S>,
) => {
  // 在最开始执行，赶在storeStateRefCounterMap加载之前
  viewRestoreHandle("viewInitialStateFnRestore", stores);
  // 需要使用getState获取store内部的即时最新数据值（默认无store，同时默认兼容处理多store的返回情况）
  const stateMap: ViewStateMapType<S> = getLatestStateMap(stores) as MapType<S>;

  /**
   * @description 如果是有store的情况则可以通过props.state的方式进行数据渲染及操作
   * 且props.state的方式兼容于函数组件与class组件
   * 但是如果是在class组件中则必须使用props.state的方式
   * 而函数组件则两种方式都可以
   */
  // 先行初始化执行逻辑，并且每次生命周期中只同步执行一次
  // 多个Store
  if (stores && !(stores as Store<S>)[REGENERATIVE_SYSTEM_KEY as keyof S]) {
    (Object.keys(stores) as (keyof Stores<S>)[]).forEach(storesKey => {
      const storeItem = (stores as Stores<S>)[storesKey] as Store<S>;
      (stateMap as ObjectMapType<S>)[storesKey] = getLatestStateMap(storeItem);
      (innerUseStateMapSet as Map<keyof Stores<S>, Set<keyof S>>).set(storesKey, new Set<keyof S>());
    });
  }

  // 单store 或 无store
  if (!stores || (stores as Store<S>)[REGENERATIVE_SYSTEM_KEY as keyof S]) {
    return stateRefByProxyHandle(stateMap as MapType<S>, innerUseStateMapSet as Set<keyof S>);
  }

  // 多store
  const stateTemp = {} as ObjectType<S>;
  Object.keys(stateMap).forEach((stateMapKey: keyof S) => {
    stateTemp[stateMapKey] = stateRefByProxyHandle<ValueOf<S>>(
      (stateMap as ObjectMapType<S>)[stateMapKey],
      (innerUseStateMapSet as Map<keyof Stores<S>, Set<keyof S>>).get(stateMapKey) as Set<keyof S>,
    );
  });
  return stateTemp;
};

// 处理单个/多个store的数据订阅监听
const handleStoreSubscribe = <S extends PrimitiveState, P extends PrimitiveState = {}>(
  store: Store<S>,
  innerUseStateMapSet: Set<keyof S> | Map<keyof Stores<S>, Set<keyof S>>,
  viewConnectStoreSet: Set<Unsubscribe>,
  state: S | { [key in keyof Stores<S>]: S },
  setState: Dispatch<SetStateAction<S | { [key in keyof Stores<S>]: S }>>,
  props: P,
  equal?: (next: PS<P, S>, prev: PS<P, S>) => boolean,
  singleStore?: boolean,
  storesKeyTemp?: keyof Stores<S>,
) => {
  // 进行store校验（这里是单独的store，多个store也是遍历单独执行handleStoreSubscribe传入的，它与singleStore是不相关的判断逻辑）
  storeErrorHandle(store, "view");

  if (singleStore) {
    innerUseStateMapSet.forEach(() => {
      // 将view关联到store内部的storeStateRefCounterMap，进行数据生命周期的同步
      viewConnectStoreSet.add(
        (
          (
            store[VIEW_CONNECT_STORE_KEY as keyof S] as StoreViewMapType<S>
          ).get("viewConnectStore") as StoreViewMapValue<S>["viewConnectStore"]
        )()
      );
    });

    // 刚好巧妙的与resy的订阅监听subscribe结合起来，形成一个reactive更新的包裹容器
    return store.subscribe(data => {
      const { effectState, nextState, prevState } = data;
      const effectStateFields = Object.keys(effectState);

      if (
        // Comp组件内部使用到的数据属性字段数组，放在触发执行保持内部引用数据最新化
        Array.from(innerUseStateMapSet as Set<keyof S>).some(key => effectStateFields.includes(key as string))
        && (
          !equal || (
            typeof equal === "function"
            && !equal({ props, state: nextState }, { props, state: prevState })
          )
        )
      ) {
        setState(stateRefByProxyHandle(objectToMap(nextState), innerUseStateMapSet as Set<keyof S>));
      }
    });
  } else {
    (innerUseStateMapSet as Map<keyof Stores<S>, Set<keyof S>>).forEach((
      _,
      storesKey,
      map,
    ) => {
      (map.get(storesKey) as Set<keyof S>).forEach(() => {
        viewConnectStoreSet.add(
          (
            (
              store[VIEW_CONNECT_STORE_KEY as keyof S] as StoreViewMapType<S>
            ).get("viewConnectStore") as StoreViewMapValue<S>["viewConnectStore"]
          )()
        );
      });
    });

    return store.subscribe(data => {
      const { effectState, nextState, prevState } = data;
      const effectStateFields = Object.keys(effectState);
      const innerUseStateSet = (
        innerUseStateMapSet as Map<keyof Stores<S>, Set<keyof S>>
      ).get(storesKeyTemp as keyof Stores<S>) as Set<keyof S>;

      if (
        // Comp组件内部使用到的数据属性字段数组，放在触发执行保持内部引用数据最新化
        Array.from(innerUseStateSet).some(key => effectStateFields.includes(key as string))
        && (
          !equal || (
            typeof equal === "function"
            && !equal({ props, state: nextState }, { props, state: prevState })
          )
        )
      ) {
        setState(viewStoresStateUpdateHandle(state, innerUseStateSet, nextState, storesKeyTemp));
      }
    });
  }
};

// 组件useEffect异步只执行一次的相关处理
export const effectedHandle = <S extends PrimitiveState, P extends PrimitiveState = {}>(
  innerUseStateMapSet: Set<keyof S> | Map<keyof Stores<S>, Set<keyof S>>,
  state: S | { [key in keyof Stores<S>]: S },
  setState: Dispatch<SetStateAction<S | { [key in keyof Stores<S>]: S }>>,
  props: P,
  stores?: Store<S> | Stores<S>,
  equal?: (next: PS<P, S>, prev: PS<P, S>) => boolean,
) => {
  if (!stores) return;

  // 因为useEffect是异步的，所以后续访问 innerUseStateMapSet 时会有数据而不是空
  const viewConnectStoreSet = new Set<Unsubscribe>();

  let unsubscribe: Unsubscribe | Unsubscribe[];
  // 单store
  if ((stores as Store<S>)[REGENERATIVE_SYSTEM_KEY as keyof S]) {
    unsubscribe = handleStoreSubscribe(
      stores as Store<S>,
      innerUseStateMapSet,
      viewConnectStoreSet,
      state,
      setState,
      props,
      equal,
      true,
    );
  } else {
    unsubscribe = [];
    Object.keys(stores).forEach(storesKey => {
      (unsubscribe as Unsubscribe[]).push(handleStoreSubscribe(
        stores[storesKey],
        innerUseStateMapSet,
        viewConnectStoreSet,
        state,
        setState,
        props,
        equal,
        false,
        storesKey,
      ));
    });
  }

  return () => {
    typeof unsubscribe === "function"
      ? unsubscribe()
      : unsubscribe.forEach(item => {
        item();
      });
    viewConnectStoreSet.forEach(unsubscribeItem => {
      unsubscribeItem();
    });
    Promise.resolve().then(() => {
      // 需要在最后执行，等待storeStateRefCounterMap卸载完成
      viewRestoreHandle("viewUnmountRestore", stores);
    });
  };
};

// 生成view连接store的map对象
export const genViewConnectStoreMap = <S extends PrimitiveState>(
  unmountRestore: boolean,
  reducerState: S,
  stateMap: MapType<S>,
  storeStateRefCounterMap: StateRefCounterMapType,
  stateRestoreAccomplishedMap: StateRestoreAccomplishedMapType,
  schedulerProcessor: MapType<Scheduler<S>>,
  initialFnCanExecMap: InitialFnCanExecMapType,
  initialState?: InitialState<S>,
) => {
  const viewConnectStoreMap: StoreViewMapType<S> = new Map();
  viewConnectStoreMap.set("getStateMap", stateMap);
  viewConnectStoreMap.set("viewUnmountRestore", () => {
    unmountRestoreHandle(
      unmountRestore, reducerState, stateMap, storeStateRefCounterMap,
      stateRestoreAccomplishedMap, initialFnCanExecMap, initialState,
    );
  });
  viewConnectStoreMap.set("viewInitialStateFnRestore", () => {
    initialStateFnRestoreHandle(
      reducerState, stateMap, storeStateRefCounterMap,
      stateRestoreAccomplishedMap, initialFnCanExecMap, initialState,
    );
  });
  viewConnectStoreMap.set("viewConnectStore", () => {
    storeStateRefCounterMap.set("counter", storeStateRefCounterMap.get("counter")! + 1);

    return () => {
      storeStateRefCounterMap.set("counter", storeStateRefCounterMap.get("counter")! - 1);

      if (!schedulerProcessor.get("deferDestructorFlag")) {
        schedulerProcessor.set("deferDestructorFlag", Promise.resolve().then(() => {
          schedulerProcessor.set("deferDestructorFlag", null);
          if (!storeStateRefCounterMap.get("counter")) {
            stateRestoreAccomplishedMap.set("unmountRestoreAccomplished", null);
            stateRestoreAccomplishedMap.set("initialStateFnRestoreAccomplished", null);
          }
        }));
      }
    };
  });
  return viewConnectStoreMap;
};
