import { useEffect, useMemo, useRef } from "react";
import { USE_STORE_KEY, USE_CONCISE_STORE_KEY, STORE_CORE_MAP_KEY } from "./static";
import { createStore } from "./createStore";
import { storeErrorHandle } from "./utils";
import type { State, ConciseStore, StoreCoreMapType, StoreCoreMapValue } from "./model";

/**
 * 驱动组件更新
 * @description 驱动组件更新的hook，使用store容器中的数据
 * 特意分离直接从store获取hook调用是为了数据的安全使用
 * 本身产生的数据就是hook数据，所以会多一层代理
 * @param store
 */
export function useStore<S extends State>(store: S): S {
  storeErrorHandle(store);
  return store[USE_STORE_KEY as keyof S];
}

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
 */
export function useConciseState<S extends State>(initialState?: S | (() => S)): ConciseStore<S> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => {
    return createStore<S>(
      typeof initialState !== "function" ? initialState : initialState(),
      { __privatization__: true },
    );
  }, [])[USE_CONCISE_STORE_KEY as keyof S];
}

/**
 * useStore的升级加强版本，可以挂载ref引用数据在store上
 * 自上而下兼容useStore的使用
 */
export function useStoreWithRef<S extends State>(store: S, ref?: Partial<S>): S {
  const refTemp = useRef(ref);
  
  const unsubscribeRefMap = useMemo(() => {
    return (
      (
        store[STORE_CORE_MAP_KEY as keyof S] as StoreCoreMapType<S>
      ).get("storeMountRef") as StoreCoreMapValue<S>["storeMountRef"]
    )(refTemp.current && new Map(Object.entries(refTemp.current)));
  }, []);
  
  useEffect(() => unsubscribeRefMap, []);
  
  return store[USE_STORE_KEY as keyof S];
}
