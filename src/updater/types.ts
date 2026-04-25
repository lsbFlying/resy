import { PrimitiveState } from "../types";

/** Update the data type of the parameter */
export type State<S extends PrimitiveState> = Partial<S> | S | null;

/**
 * The type of update parameter is function parameter
 * @desc 整个状态变换是一个纯函数 —— 输入 prev，输出下个状态，不依赖也不修改任何外部东西。
 * 可测试性：你可以把那个函数单独拉出来单元测试，完全脱离 store。
 * 可维护性：读代码的人立刻清楚“这里所有更新是基于同一个历史快照一次性推演的”，不用跟踪全局 store 的中间变化。
 * 即使 store.xxx 总能读到最新值，把复杂更新的逻辑写成一个纯变换依然比散落多个“读-写”步骤更容易维护、更少犯错误。
 * 这就是“语义清晰度与安全性”的真正含义，它和闭包问题无关，而和代码的结构有关。
 */
export type StateFnType<S extends PrimitiveState> = (prevState: Readonly<S>) => State<S>;

export type SetStateAction<S extends PrimitiveState> = State<S> | StateFnType<S>;

/** Type of setState */
export type SetStateType<S extends PrimitiveState> = {
  setState(state: SetStateAction<S>): void;
};

/**
 * Type of callback functions for setState, syncUpdate, and restore
 * @description The existence of the nextState parameter in the callback is also necessary for reasons similar to prevState.
 */
export type StateCallback<S extends PrimitiveState> = (nextState: Readonly<S>) => void;

// Element types of setState, syncUpdate, restore callback execution
export type StateCallbackItem<S extends PrimitiveState> = {
  nextState: S;
  callback: StateCallback<S>;
};

/** Type of syncUpdate */
export type SyncUpdateType<S extends PrimitiveState> = {
  syncUpdate(state: SetStateAction<S>): void;
};
