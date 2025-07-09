import type { AnyFn } from "../types";

export type UseComputedType = {
  useComputed<T extends AnyFn>(fn: T): ReturnType<T>;
};

export type ComputedType = {
  computed<T extends AnyFn>(fn: T): ReturnType<T>;
};
