import type { NativeDataType, PrimitiveState } from "./types";

export const hasOwnProperty = Object.prototype.hasOwnProperty;

export const typeString = Object.prototype.toString;

export const slice = Array.prototype.slice;

/** Identifying what type of data */
export const whatsType = (value: unknown): NativeDataType => {
  return typeString.call(value)?.match(/\[object\s+(.*?)]/)?.[1] as NativeDataType;
};

/** Method for determining empty objects */
export const isEmptyPureObject = <S extends PrimitiveState>(obj: S) => {
  for (const key in obj) {
    if (hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
};
