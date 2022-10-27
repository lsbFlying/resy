import { useMemo } from "react";
import type { State } from "./model";
import { storeCoreMapKey, useStoreKey } from "./static";
import { isEmptyObj } from "./utils";

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
