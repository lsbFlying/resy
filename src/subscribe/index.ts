import type { PrimitiveState, MapType } from "../types";
import type { Scheduler } from "../scheduler/types";

// 更新之前的处理（前置记录prevBatchState，为后续subscribe的数据变动触发做对比）
export const willUpdatingHandle = <S extends PrimitiveState>(
  schedulerProcessor: MapType<Scheduler<S>>,
  prevBatchState: MapType<S>,
  stateMap: MapType<S>,
) => {
  if (!schedulerProcessor.get("willUpdating")) {
    schedulerProcessor.set("willUpdating", true);
    /**
     * @description 在更新执行将更新之前的数据状态缓存一下，
     * 以便于subscribe触发监听与setState、syncUpdate的函数参数prevState使用
     * 因为key的变化可能被删除，或者一开始不存在而后添加，所以这里先清空再设置
     */
    prevBatchState.clear();
    stateMap.forEach((value, key) => {
      prevBatchState.set(key, value);
    });
  }
};
