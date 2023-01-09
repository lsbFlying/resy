import { useMemo } from "react";
import type { State, AdaptFuncTypeReturn, ConciseStore } from "./model";
import { STORE_CORE_MAP_KEY, USE_STORE_KEY } from "./static";
import { createStore } from "./createStore";

/**
 * 驱动组件更新
 * @description 驱动组件更新的hook，使用store容器中的数据
 * 特意分离直接从store获取hook调用是为了数据的安全使用
 * 本身产生的数据就是hook数据，所以会多一层代理
 * @param store
 * @param hookInitialState 针对hook的初始化使用
 * hookInitialState参数本身是针对hook的产生值，
 * 但是如果你填写了非hook产生值的数据属性也会使得再次初始化的值生效
 * @example
 * const { count, form } = useStore(
 *   store,
 *   {
 *     form: Form.useForm<{ sortNumber: number }>()[0],
 *   },
 * );
 */
export function useStore<S extends State>(store: S, hookInitialState?: AdaptFuncTypeReturn<Partial<S>>): S {
  store[STORE_CORE_MAP_KEY as keyof S].get("setHookInitialState")(hookInitialState);
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
 */
export function useConciseState<S extends State>(initialState?: AdaptFuncTypeReturn<S>): ConciseStore<S> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const store = useMemo(() => createStore<S>(initialState, { privatization: true }), []);
  return store[USE_STORE_KEY as keyof S];
}
