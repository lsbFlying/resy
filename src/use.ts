import { useMemo, useRef } from "react";
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
 * 弥补了useState中无法读取属性数据的最新值的不足
 */
export function useConciseState<S extends State>(initialState?: S): ConciseStore<S> {
  const ref = useRef(initialState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const store = useMemo(() => createStore<S>(ref.current, { privatization: true }), []);
  return store[USE_CONCISE_STORE_KEY as keyof S];
}

/**
 * useStore的升级版，它可以完全兼容useStore
 * 它可以将某些数据引用到store全局储存容器上，
 * 更多更主要地是为了将某些hook产生的值即不方便全局使用的数据值引用挂载到全局的store上方便使用
 * 即通过useStoreWithRef将refData引用挂载到全局store上一次即可，
 * 然后通过useStore或者直接用"store."来读取refData中的数据即可方便使用
 * 正因为是引用，所以useStoreWithRef中的refData的数据是不能更新的
 * 比如下面的例子中
 * 不能store.form = "newFormStr"; 不能store.setState({ form: "newFormStr" });
 * 也不能store.syncUpdate({ form: "newFormStr" })
 * 更新是无效的且会在浏览器控制台报错提示。
 * @description 比如可以将antd的useForm的form引用映射到store上，方便后续在别的地方通过store读取form
 * @example A：
 * const { form } = useStoreWithRef(store, { form: useForm()[0] });
 * next:
 * ...some code start...
 * const { form } = store;
 * // 方便form的读取使用
 * const formValues = form?.getFieldsValue();
 * ...some code end...
 * 除此之外，也可以将某些不方便修改到全局的组件内部的数据引用挂载到全局的store上，
 * 从而便于私有数据的全局化使用。
 */
export function useStoreWithRef<S extends State>(store: S, refData: Partial<S>): S {
  storeErrorHandle(store);
  const ref = useRef(refData);
  
  // 先执行重置
  useMemo(() => (
    (
      (
        store[STORE_CORE_MAP_KEY as keyof S] as StoreCoreMapType<S>
      ).get("refInStore") as StoreCoreMapValue<S>["refInStore"]
    )(ref.current, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), []);
  
  (
    (
      store[STORE_CORE_MAP_KEY as keyof S] as StoreCoreMapType<S>
    ).get("refInStore") as StoreCoreMapValue<S>["refInStore"]
  )(ref.current);
  
  return store[USE_STORE_KEY as keyof S];
}
