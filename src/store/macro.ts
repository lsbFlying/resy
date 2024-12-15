import { createStore } from "./index";
import type { PrimitiveState } from "../types";
import type { InitialState, InnerStoreOptions, StoreOptions, UseMacroStore } from "./types";

/**
 * @description Define the preprocessed store type for the createStore macro,
 * which essentially represents the return type of the useStore function.
 *
 * 🌟 This API primarily follows the macro definition convention from the C programming language,
 * hence the use of "define" as a prefix for naming.
 *
 * 🌟 `defineStore` will render the functions within the store incapable of updating,
 * unlike `createStore`, and they will merely serve as actions.
 * If you have a specific reason to enable function properties with the capability to update rendering,
 * you can turn it on through the configuration option "enableMarcoActionStateful".
 *
 * 🌟 In the future, `defineStore` will gradually replace `createStore` as the norm for usage,
 * and it possesses more rationality.
 * The existence of `defineStore` also implies that Resy's focus will shift towards hooks components,
 * moving away from an adherence to class components.
 *
 * 🌟 `defineStore`, in fact, returns the `useStore` function,
 * which on one hand reflects the characteristics of functional programming,
 * and on the other hand, stems from React's restrictions on hook usage
 *
 * 😊 If React had no restrictions on hook usage,
 * I would prefer to directly return the final store instead of redundantly calling `useStore()` again.
 *
 * @example
 * ```tsx
 * interface StateModel {
 *   count: number;
 *   increase(): void;
 * }
 *
 * const useStore = defineStore<StateModel>({
 *   count: 0,
 *   increase() {
 *     this.count += 1;
 *   },
 * });
 *
 * const App = () => {
 *   const { count, increase } = useStore();
 *
 *   return (
 *     <>
 *       <p>count:{count}</p>
 *       <button onClick={increase}>increase</button>
 *     </>
 *   );
 * };
 * ```
 */
export const defineStore = <S extends PrimitiveState>(
  initialState?: InitialState<S>,
  options?: StoreOptions,
): UseMacroStore<S> => {
  return createStore(initialState, {
    ...options,
    __enableMacros__: true,
    __functionName__: defineStore.name,
  } as InnerStoreOptions).useStore as UseMacroStore<S>;
};
