import { AnyFn } from "../types";
import { StatefulFn } from "./types";

/**
 * @desc The functions in the auxiliary initialization definition
 * have the ability to update and render in a state based manner.
 */
export const fnStateful = <T extends AnyFn>(fn: T) => {
  (fn as StatefulFn).__stateful__ = true;
  return fn;
};
