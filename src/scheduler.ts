import { Callback, State } from "./model";
import { batchUpdate } from "./static";

// 更新的任务队列
const taskQueue: Set<Callback> = new Set();

type TaskDataType<T> = Record<keyof T, T[keyof T]>;
// 更新的任务数据
const taskData: TaskDataType<any> = {};

export type SchedulerType<T extends State = {}> = {
  add<T>(task: Callback, key: keyof T, val: T[keyof T]): Promise<void>;
  flush(): void;
  isEmpty(): boolean;
  // 注意这里的clean不能与Map的原型方法clear重名
  clean(): void;
  getTaskData(): TaskDataType<T>;
};

const scheduler = new Map<keyof SchedulerType, SchedulerType[keyof SchedulerType]>();
scheduler.set("add", async (task, key, val) => {
  taskQueue.add(task);
  taskData[key] = val;
});
scheduler.set("flush", () => {
  if (taskQueue.size === 0) return;
  batchUpdate(() => taskQueue.forEach(task => task()));
});
scheduler.set("isEmpty", () => taskQueue.size === 0);
scheduler.set("clean", () => taskQueue.clear());
scheduler.set("getTaskData", () => taskData);

export { scheduler };
