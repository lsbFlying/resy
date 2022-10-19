import { useMemo } from "react";
import { State } from "./model";
import { storeCoreMapKey, useStoreKey } from "./static";

/**
 * useStore
 * @description 驱动组件更新的hook，使用store容器中的数据
 * 特意分离直接从store获取hook调用是为了数据的安全使用
 * 本身产生的数据就是hook数据，所以会多一层代理
 */
export function useStore<S extends State>(store: S, initialState?: Partial<S>): S {
  
  const storeProxy = store[useStoreKey as keyof S];
  if (initialState === undefined) {
    return storeProxy;
  }
  
  useMemo(() => {
    const storeCoreMap = store[storeCoreMapKey as keyof S];
    storeCoreMap.get("setFieldsValue")(initialState);
  }, []);
  
  return storeProxy;
}
