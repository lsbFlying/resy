import { useMemo } from "react";
import { createStore } from "../store";
import { storeErrorHandle } from "../errors";
import type { PrimitiveState } from "../types";
import type { ConciseStore } from "./types";
import type { InitialState, Store } from "../store/types";

/**
 * 驱动组件更新
 * @description 驱动组件更新的hook，使用store容器中的数据
 * 特意分离直接从store获取hook调用是为了数据的安全使用
 * 本身产生的数据就是hook数据，所以会多一层代理
 * @param store
 * @return S
 */
export const useStore = <S extends PrimitiveState>(store: Store<S>): Store<S> => {
  storeErrorHandle(store, "useStore");
  return store["useData" as keyof S];
};

/**
 * useState的简明版本
 * @description 帮助组件可以使用resy创建私有化的store数据状态容器
 * 它可以用如下方式：
 * const { count, text, setState } = useConciseState({ count: 0, text: "hello" });
 * 作用实现其实就是等价于原生的useState：
 * const [count, setCount] = useState(0);
 * const [text, setText] = useState("hello");
 * 🌟 useConciseState相对于useState在多个数据状态时使用相对简单明了
 * 🌟 同时 useConciseState中可以解析出store属性，通过store可以读取各个数据的最新数据值
 * 弥补了useState中无法读取属性数据的最新值的不足，这是最核心的关键点
 * @param initialState
 * @return ConciseStore<S>
 */
export const useConciseState = <S extends PrimitiveState>(
  initialState?: InitialState<S>,
): ConciseStore<S> =>
    useMemo(() => createStore<S>(initialState, {
      unmountRestore: true,
      __useConciseStateMode__: true,
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [])["useData" as keyof S]
;
