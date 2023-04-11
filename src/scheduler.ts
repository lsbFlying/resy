import type { Callback, Scheduler } from "./model";

/**
 * @description 调度处理器针对每一个store的私有化
 * 便于与useConciseState的store的调度处理分离开来
 * 避免了更新调度的交叉不协调问题产生的数据更新问题
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
  
  schedulerProcessor.set(
    "add",
    (
      task: Callback,
      key: never,
      val: any,
      taskDataMapParam: Map<never, any> | null,
      taskQueueMapParam: Map<never, Callback> | null,
    ) => {
      (taskDataMapParam || taskDataMap).set(key, val);
      (taskQueueMapParam || taskQueueMap).set(key, task);
    },
  );
  
  schedulerProcessor.set(
    "flush",
    (
      taskDataMapParam: Map<never, any> | null,
      taskQueueMapParam: Map<never, Callback> | null,
    ) => {
      (taskDataMapParam || taskDataMap).clear();
      (taskQueueMapParam || taskQueueMap).clear();
    },
  );
  
  schedulerProcessor.set(
    "getTask",
    (
      taskDataMapParam: Map<never, any> | null,
      taskQueueMapParam: Map<never, Callback> | null,
    ) => {
      return {
        taskDataMap: new Map(taskDataMapParam || taskDataMap),
        taskQueueMap: new Map(taskQueueMapParam || taskQueueMap),
      };
    },
  );
  
  return schedulerProcessor;
}
