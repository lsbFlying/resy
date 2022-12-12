import { useMemo } from "react";
import type { State, SetState, Subscribe, SyncUpdate } from "./model";
import { storeCoreMapKey, useStoreKey } from "./static";
import { createStore } from "./createStore";

/**
 * useStore
 * @description 驱动组件更新的hook，使用store容器中的数据
 * 特意分离直接从store获取hook调用是为了数据的安全使用
 * 本身产生的数据就是hook数据，所以会多一层代理
 * @param store
 * @param hookInitialState 针对hook的初始化使用
 *
 * @example
 * const { count, form } = useStore(
 *   store,
 *   {
 *     form: Form.useForm<{ sortNumber: number }>()[0],
 *   },
 * );
 */
export function useStore<S extends State>(store: S, hookInitialState?: Partial<S>): S {
  store[storeCoreMapKey as keyof S].get("setHookInitialState")(hookInitialState);
  return store[useStoreKey as keyof S];
}

/**
 * @description 帮助组件可以使用resy创建私有化的store数据状态容器
 * 它可以用如下方式：
 * const { count, text, setState } = useConciseState({ count: 0, text: "hello" });
 * 作用实现其实就是等价于原生的useState：
 * const [count, setCount] = useState(0);
 * const [text, setText] = useState("hello");
 * 🌟: useConciseState相对于useState在多个数据状态时使用相对简单明了
 */
export function useConciseState<T extends State>(state: T): T & SetState<T> & Subscribe<T> & SyncUpdate<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const store = useMemo(() => createStore<T>(state, { privatization: true }), []);
  return store[useStoreKey as keyof T];
}
