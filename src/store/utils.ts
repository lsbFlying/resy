import type { PrimitiveState, MapType } from "../types";

/** Track the shallow-cloned state map */
export const shallowCloneMap = <K, V>(map: Map<K, V>) => {
  const mapTemp: Map<K, V> = new Map();
  map.forEach((value, key) => {
    mapTemp.set(key, value);
  });
  return mapTemp;
};

/** map to object */
export const mapToObject = <S extends PrimitiveState>(map: MapType<S>): S => {
  const object = {} as S;
  for (const [key, value] of map) {
    object[key] = value;
  }
  return object;
};

/** object to map */
export const objectToMap = <S extends PrimitiveState>(object: S) => {
  return Object.keys(object).reduce(
    (prev, key) => {
      prev.set(key, object[key]);
      return prev;
    },
    new Map(),
  );
};

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
