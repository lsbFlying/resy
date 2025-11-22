import type { PrimitiveState } from "../types";
import type { Unsubscribe } from "../subscribe/types";

type ResubscriberType = {
  newUnsub?: Unsubscribe;
  resubscribe?(): void;
};

export type SubscriberRefType<S extends PrimitiveState> = {
  stateKeys: {
    oldKeys: Set<keyof S>;
    newKeys: Set<keyof S>;
  };
  resubscriber?: null | ResubscriberType;
};
