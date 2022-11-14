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

scheduler.set("add", async (task, key, val) => {
  taskQueueMap.set(key, task);
  taskDataMap.set(key, val);
});

scheduler.set("flush", () => {
  taskQueueMap.clear();
  taskDataMap.clear();
});

scheduler.set("getTask", () => {
  return {
    taskDataMap: new Map(taskDataMap),
    taskQueueMap: new Map(taskQueueMap),
  };
});

export default scheduler;
