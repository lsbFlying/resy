import { PrimitiveState } from "../types";

/** clear object */
export const clearObject = <S extends PrimitiveState>(object: S) => {
  Object.keys(object).forEach(key => {
    delete object[key];
  });
};
