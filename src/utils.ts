import { State } from "./model";

/**
 * 给Comp组件的props上挂载的state属性数据做一层引用代理
 * 核心作用是找出SCU或者useMemo所需要的更新依赖的数据属性
 */
export function proxyStateHandle<S extends State>(latestState: Map<keyof S, S[keyof S]>, linkStateSet: Set<keyof S>) {
  return new Proxy(latestState, {
    get: (target: Map<keyof S, S[keyof S]>, key: keyof S) => {
      linkStateSet.add(key);
      // latestState给出了resy生成的store内部数据的引用，这里始终能获取到最新数据
      return target.get(key);
    },
  } as ProxyHandler<Map<keyof S, S[keyof S]>>) as any as S;
}

// 判断空对象
export function isEmptyObj(obj: object) {
  for (const _key in obj) {
    return false;
  }
  return true;
}

// 解决回调参数如果是map的proxy代理的话无法做扩展运算的问题
export function mapToObject<T extends State>(map: Map<keyof T, T[keyof T]>): T {
  return [...map.entries()].reduce((obj, [key, value]) => ((obj as any as T)[key] = value, obj), {}) as T;
}
