import { Callback, State } from "./model";
import { batchUpdate } from "./static";

// 更新的任务队列
const taskQueueSet: Set<Callback> = new Set();

type TaskDataType<T> = Map<keyof T, T[keyof T]>;
// 更新的任务数据
const taskDataMap: TaskDataType<any> = new Map();

export type SchedulerType<T extends State = {}> = {
  add<T>(task: Callback, key: keyof T, val: T[keyof T]): Promise<void>;
  flush(): void;
  isEmpty(): boolean;
  // 注意这里的clean最好不要与Map的原型方法clear重名
  clean(): void;
  getTaskDataMap(): TaskDataType<T>;
};

const scheduler = new Map<keyof SchedulerType, SchedulerType[keyof SchedulerType]>();
scheduler.set("add", async (task, key, val) => {
  if (!Object.is(taskDataMap.get(key), val)) {
    taskQueueSet.add(task);
    taskDataMap.set(key, val);
  }
});
scheduler.set("flush", () => {
  if (taskQueueSet.size === 0) return;
  batchUpdate(() => taskQueueSet.forEach(task => task()));
});
scheduler.set("isEmpty", () => taskQueueSet.size === 0);
scheduler.set("clean", () => {
  taskQueueSet.clear();
  taskDataMap.clear();
});
scheduler.set("getTaskDataMap", () => taskDataMap);

export { scheduler };
