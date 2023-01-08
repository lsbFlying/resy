import type { State } from "./model";

/**
 * 给Comp组件的props上挂载的state属性数据做一层引用代理
 * @description 核心作用是找出SCU或者useMemo所需要的更新依赖的数据属性
 */
export function proxyStateHandler<S extends State>(
  latestState: Map<keyof S, S[keyof S]>,
  innerUseStateSet: Set<keyof S>,
) {
  return new Proxy(latestState, {
    get: (target: Map<keyof S, S[keyof S]>, key: keyof S) => {
      innerUseStateSet.add(key);
      // latestState给出了resy生成的store内部数据的引用，这里始终能获取到最新数据
      return target.get(key);
    },
  } as ProxyHandler<Map<keyof S, S[keyof S]>>) as object as S;
}

/**
 * 判断空对象
 * @description 内部使用，前提已确定是[object Object]
 */
export function isEmptyObj(obj: object) {
  // tslint:disable:variable-name
  for (const _key in obj) {
    return false;
  }
  return true;
}

/**
 * map转object
 * @description 解决回调参数如果是map的proxy代理的话无法做扩展运算的问题
 */
export function mapToObject<S extends State>(map: Map<keyof S, S[keyof S]>): S {
  return [...map.entries()].reduce((obj, [key, value]) => ((obj as S)[key] = value, obj), {}) as S;
}
