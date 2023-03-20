import { useEffect, useMemo } from "react";
import { USE_STORE_KEY, USE_CONCISE_STORE_KEY } from "./static";
import { createStore } from "./createStore";
import { storeErrorHandle } from "./utils";
import type { State, ConciseStore } from "./model";

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
  const state = useMemo(() => {
    if (typeof initialState !== "function") {
      return initialState;
    }
    return initialState();
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => createStore<S>(state, {
    __privatization__: true,
  }), [])[USE_CONCISE_STORE_KEY as keyof S];
}

/**
 * useStore的升级版，它可以完全兼容useStore
 * 它可以将某些数据引用到store全局储存容器上，
 * 更多更主要地是为了将某些hook产生的值即不方便全局使用的数据值引用挂载到全局的store上方便使用
 * 然后通过useStore或者直接用"store."来读取refData中的数据即可方便使用
 * 为了方式代码实现，于是简化了refData的数据也是可以更新的，但是一般而言可能没有这个逻辑必要
 * @description 比如可以将antd的useForm的form引用映射到store上，方便后续在别的地方通过store读取form
 *
 * @example：
 * const [formInstance] = useForm();
 * const { form } = useStoreWithRef(store, { form: formInstance });
 * ...some code start...
 * const { form } = store;
 * const formValues = form?.getFieldsValue();
 * ...some code end...
 */
export function useStoreWithRef<S extends State>(store: S, refData?: Readonly<Partial<S> | (() => Partial<S>)>): S {
  storeErrorHandle(store);
  
  const refDataTemp = useMemo(() => {
    if (typeof refData !== "function") {
      return refData;
    }
    return refData();
  }, []);
  
  useEffect(() => {
    Object.keys(refDataTemp).forEach(key => {
      store[key as keyof S] = refDataTemp[key];
    });
  }, []);
  
  return store[USE_STORE_KEY as keyof S];
}
