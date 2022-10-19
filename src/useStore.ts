import { State } from "./model";
import { useStoreKey } from "./static";

/**
 * useStore
 * @description 驱动组件更新的hook，使用store容器中的数据
 * 特意分离直接从store获取hook调用是为了数据的安全使用
 * 本身产生的数据就是hook数据，所以会多一层代理
 */
export function useStore<T extends State>(store: T): T {
  return store[useStoreKey as keyof T];
}
