import { Callback, State } from "./model";
import { batchUpdate } from "./static";

// 更新的任务队列
const taskQueueMap = new Map<string | number | symbol, Callback>();

// 更新的任务数据
const taskDataMap = new Map();

// resy的调度类型
export interface Scheduler<T = State> {
  add<T>(task: Callback, key: keyof T, val: T[keyof T]): Promise<void>;
  flush(): void;
  isEmpty(): boolean;
  // 注意这里的clean最好不要与Map的原型方法clear重名
  clean(): void;
  getTaskDataMap(): Map<keyof T, T[keyof T]>;
}

/**
 * 批量处理更新的调度Map
 * 主要是为了完成react18以下的非管理领域的批处理更新的调度协调性
 */
const scheduler = new Map<keyof Scheduler, Scheduler[keyof Scheduler]>();
scheduler.set("add", async (task, key, val) => {
  /**
   * 这里需要注意避免重复添加相同赋值更新的情况
   * 同时需要注意在一个批次里同一个数据属性的更新
   * 只按最后一次赋值更新处理，避免多余添加
   * undefined比较特殊，需要额外处理
   */
  if (!Object.is(taskDataMap.get(key), val === undefined ? "undefined" : val)) {
    taskQueueMap.set(key, task);
    taskDataMap.set(key, val);
  }
});
scheduler.set("flush", () => {
  if (taskQueueMap.size === 0) return;
  batchUpdate(() => taskQueueMap.forEach(task => task()));
});
scheduler.set("isEmpty", () => taskQueueMap.size === 0);
scheduler.set("clean", () => {
  taskQueueMap.clear();
  taskDataMap.clear();
});
scheduler.set("getTaskDataMap", () => taskDataMap);

export { scheduler };
