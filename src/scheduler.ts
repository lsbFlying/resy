import type { MapType, Scheduler, PrimitiveState, Callback, ValueOf } from "./model";

/**
 * @description 调度处理器针对每一个store的私有化
 * 便于不同的store的调度处理分离开来
 * 避免了更新调度的交叉不协调问题产生的数据更新问题
 * detail course:
 * 因为调度内部的任务队列或者数据map都是根据key来添加执行的
 * 如果所有的store都公用一个会导致数据更新有问题
 * 同时，分离开调度并不影响批量更新的执行触发，是因为本身resy前置数据状态更进执行了
 * 后续store的更新执行到useSyncExternalStore内部的checkIfSnapshotChanged方法时
 * 由于前面批次的store更新因为value变更触发了useSyncExternalStore内部的useLayoutEffect
 * 而内部的useLayoutEffect又同步了数据状态inst.value = value;
 * 所以原本为了防止更新撕裂的问题而写的useLayoutEffect，节省了一次更新效应
 * 这个特性是 useSyncExternalStore + proxy + 前置数据 + Promise微任务执行 一起产生的额外联动效应
 * todo 目前来看这种useSyncExternalStore内部的useLayoutEffect的撕裂检查执行效果良好，保持观察
 */
const scheduler = <S extends PrimitiveState = {}>() => {
  // 更新的任务数据
  const taskDataMap: MapType<S> = new Map();
  // 更新任务队列
  const taskQueueSet: Set<Callback> = new Set();

  /**
   * @description 批量处理更新的调度Map
   * 主要是为了resy的直接单次更新的批量合并
   * 同时完成react18以下的非管理领域的批处理更新的调度协调性
   */
  const schedulerProcessor: MapType<Scheduler> = new Map();

  schedulerProcessor.set("isUpdating", null);
  schedulerProcessor.set("willUpdating", null);
  schedulerProcessor.set("deferDestructorFlag", null);

  schedulerProcessor.set(
    "pushTask",
    (
      key: keyof S,
      value: ValueOf<S>,
      task: Callback,
    ) => {
      taskDataMap.set(key, value);
      taskQueueSet.add(task);
    },
  );

  schedulerProcessor.set(
    "flush",
    () => {
      taskDataMap.clear();
      taskQueueSet.clear();
    },
  );

  schedulerProcessor.set(
    "getTasks",
    () => ({
      taskDataMap,
      taskQueueSet,
    }),
  );

  return schedulerProcessor;
};

export default scheduler;
