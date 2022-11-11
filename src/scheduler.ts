import type { Callback, Scheduler } from "./model";
import { batchUpdate } from "./static";

// 更新的任务队列
const taskQueueMap = new Map<string | number | symbol, Callback>();

// 更新的任务数据
const taskDataMap = new Map();

/**
 * 批量处理更新的调度Map
 * 主要是为了完成react18以下的非管理领域的批处理更新的调度协调性
 */
const scheduler = new Map<keyof Scheduler, Scheduler[keyof Scheduler]>();
scheduler.set("add", async (task, key, val) => {
  taskQueueMap.set(key, task);
  taskDataMap.set(key, val);
});
scheduler.set("flush", () => {
  batchUpdate(() => taskQueueMap.forEach(task => task()));
  taskQueueMap.clear();
  taskDataMap.clear();
});
scheduler.set("getTaskDataMap", () => (new Map(taskDataMap)));

export default scheduler;
