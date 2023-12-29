import type { PrimitiveState, MapType } from "./types";

export const hasOwnProperty = Object.prototype.hasOwnProperty;

export const toString = Object.prototype.toString;

/** Track the shallow-cloned state map */
export const followUpMap = <K, V>(map: Map<K, V>) => {
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
export const objectToMap = <S extends PrimitiveState>(object: S) => Object.keys(object)
  .reduce((prev, key) => {
    prev.set(key, object[key]);
    return prev;
  }, new Map());

/** clear object */
export const clearObject = <S extends PrimitiveState>(object: S) => {
  Object.keys(object).forEach(key => {
    delete object[key];
  });
};
