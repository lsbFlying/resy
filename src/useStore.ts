import { useMemo } from "react";
import type { State, SetState, Subscribe, SyncUpdate } from "./model";
import { storeCoreMapKey, useStoreKey } from "./static";
import { isEmptyObj } from "./utils";
import { createStore } from "./createStore";

/**
 * useStore
 * @description 驱动组件更新的hook，使用store容器中的数据
 * 特意分离直接从store获取hook调用是为了数据的安全使用
 * 本身产生的数据就是hook数据，所以会多一层代理
 * @param store
 * @param hookInitialState 针对hook的初始化使用
 * @example
 * const { count, form } = useStore(
 *   store,
 *   {
 *     form: Form.useForm<{ sortNumber: number }>()[0],
 *   },
 * );
 */
export function useStore<S extends State>(store: S, hookInitialState?: Partial<S>): S {
  useMemo(() => {
    if (hookInitialState && !isEmptyObj(hookInitialState)) {
      const storeCoreMap = store[storeCoreMapKey as keyof S];
      storeCoreMap.get("setHookFieldsValue")(hookInitialState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return store[useStoreKey as keyof S];
}

/**
 * @description 帮助组件可以使用resy创建私有化的store数据状态容器
 * 它可以用如下方式：
 * const privateStore = usePrivateStore({ count: 0, text: "QWE });
 * const { count, text, setState } = useStore(privateStore);  // 或者setState不解构直接使用store.setState
 * 作用实现其实就是原生的useState：
 * const [count, setCount] = useStore(privateStore);
 * const [text, setText] = useStore(privateStore);
 *
 * notes: 出入参与createStore是一样的
 */
export function usePrivateStore<T extends State>(state: T): T & SetState<T> & Subscribe<T> & SyncUpdate<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => createStore<T>(state, { privatization: true }), []);
}
