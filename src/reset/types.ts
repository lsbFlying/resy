import type { MapType } from "../types";

// stateMap恢复的状态开关标识map类型（开关标识减少多次执行带来的可能产生的额外的渲染更新）
export type StateRestoreAccomplishedMapType = MapType<{
  unmountRestoreAccomplished?: boolean | null;
  initialStateFnRestoreAccomplished?: boolean | null;
}>;
