import type { Callback, Scheduler } from "./model";

// 更新的任务队列
const taskQueueMap = new Map<string | number | symbol, Callback>();

// 更新的任务数据
const taskDataMap = new Map();

/**
 * 批量处理更新的调度Map
 * 主要是为了resy的直接单次更新的批量合并
 * 同时完成react18以下的非管理领域的批处理更新的调度协调性
 */
const scheduler = new Map<keyof Scheduler, Scheduler[keyof Scheduler]>();

scheduler.set(
  "add",
  (
    task,
    key,
    val,
    taskDataMapParam,
    taskQueueMapParam,
  ) => {
    (taskDataMapParam || taskDataMap).set(key, val);
    (taskQueueMapParam || taskQueueMap).set(key, task);
  },
);

scheduler.set(
  "flush",
  (
    taskDataMapParam: Map<never, {}> | undefined,
    taskQueueMapParam: Map<never, Callback> | undefined,
  ) => {
    (taskDataMapParam || taskQueueMap).clear();
    (taskQueueMapParam || taskQueueMap).clear();
  },
);

scheduler.set(
  "getTask",
  (
    taskDataMapParam: Map<never, {}> | undefined,
    taskQueueMapParam: Map<never, Callback> | undefined,
  ) => {
    return {
      taskDataMap: new Map(taskDataMapParam || taskDataMap),
      taskQueueMap: new Map(taskQueueMapParam || taskQueueMap),
    };
  },
);

export default scheduler;
