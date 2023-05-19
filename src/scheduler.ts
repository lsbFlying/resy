import type { Callback, Scheduler } from "./model";

/**
 * @description 调度处理器针对每一个store的私有化
 * 便于不同的store的调度处理分离开来
 * 避免了更新调度的交叉不协调问题产生的数据更新问题
 *
 * 核心是使得调度与任务数据/队列并行统一
 */
export default function scheduler() {
  // 更新的任务队列
  const taskQueueMap = new Map();
  // 更新的任务数据
  const taskDataMap = new Map();
  
  /**
   * @description 批量处理更新的调度Map
   * 主要是为了resy的直接单次更新的批量合并
   * 同时完成react18以下的非管理领域的批处理更新的调度协调性
   */
  const schedulerProcessor = new Map<keyof Scheduler, Scheduler[keyof Scheduler]>();
  
  schedulerProcessor.set("isCalling", null);
  schedulerProcessor.set("isUpdating", null);
  schedulerProcessor.set("willUpdating", null);
  
  schedulerProcessor.set(
    "add",
    (
      task: Callback,
      key: never,
      val: any,
    ) => {
      taskDataMap.set(key, val);
      taskQueueMap.set(key, task);
    },
  );
  
  schedulerProcessor.set(
    "flush",
    () => {
      taskDataMap.clear();
      taskQueueMap.clear();
    },
  );
  
  schedulerProcessor.set(
    "getTasks",
    () => ({
      taskDataMap: new Map(taskDataMap),
      taskQueueMap: new Map(taskQueueMap),
    }),
  );
  
  return schedulerProcessor;
}
