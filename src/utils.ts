import type { NativeDataType } from "./types";

export const hasOwnProperty = Object.prototype.hasOwnProperty;

export const typeString = Object.prototype.toString;

export const slice = Array.prototype.slice;

/** Identifying what type of data */
export const whatsType = (value: unknown): NativeDataType => {
  return typeString.call(value)?.match(/\[object\s+(.*?)]/)?.[1] as NativeDataType;
};
