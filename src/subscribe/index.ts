import type { PrimitiveState, MapType } from "../types";
import { mapToObject } from "../utils";
import type { Listener } from "./types";
import type { Scheduler } from "../scheduler/types";

// 批量触发订阅监听的数据变动
export const batchDispatchListener = <S extends PrimitiveState>(
  prevState: MapType<S>,
  effectState: Partial<S>,
  stateMap: MapType<S>,
  listenerSet: Set<Listener<S>>,
) => {
  listenerSet.forEach(item => {
    // 这里mapToObject的复制体让外部的订阅使用保持尽量的纯洁与安全性
    item({
      effectState,
      nextState: mapToObject(stateMap),
      prevState: mapToObject(prevState),
    });
  });
};

// prevState同步更进到stateMap
export const prevStateFollowUpStateMap = <S extends PrimitiveState>(
  prevState: MapType<S>,
  stateMap: MapType<S>,
) => {
  // 因为key的变化可能被删除，或者一开始不存在而后添加，所以这里先清空再设置
  prevState.clear();
  stateMap.forEach((value, key) => {
    prevState.set(key, value);
  });
};

// 更新之前的处理（前置记录prevState，为后续subscribe的数据变动触发做对比）
export const willUpdatingHandle = <S extends PrimitiveState>(
  schedulerProcessor: MapType<Scheduler<S>>,
  prevState: MapType<S>,
  stateMap: MapType<S>,
) => {
  if (!schedulerProcessor.get("willUpdating")) {
    schedulerProcessor.set("willUpdating", true);
    /**
     * @description 在更新执行将更新之前的数据状态缓存一下，
     * 以便于subscribe触发监听与setState、syncUpdate的函数参数prevState使用
     */
    prevStateFollowUpStateMap(prevState, stateMap);
  }
};
