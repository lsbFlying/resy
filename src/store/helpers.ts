import type { PrimitiveState } from "../types";

/**
 * @description Determine whether the current change data is within the monitoring range of stateKeys
 * @return boolean
 */
export const effectStateInListenerKeys = <S extends PrimitiveState>(
  effectState: Readonly<Partial<S>>,
  stateKeys?: (keyof S)[],
) => {
  let effectExecFlag = false;
  const listenerKeysExist = stateKeys && stateKeys?.length > 0;
  /**
   * @description In fact, when the final subscription is triggered,
   * each of these outer layer listenerWraps subscribed is activated.
   * It's just that here, the execution of the inner listener is contingent upon a data change check,
   * which then determines whether the listener in subscribe should be executed.
   */
  if (
    (
      listenerKeysExist
      && Object.keys(effectState).some(key => stateKeys.includes(key))
    ) || !listenerKeysExist
  ) {
    effectExecFlag = true;
  }
  return effectExecFlag;
};
