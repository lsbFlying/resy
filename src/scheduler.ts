import { Callback, State } from "./model";
import { batchUpdate } from "./static";

// 更新的任务队列
const taskQueue: Set<Callback> = new Set();

type TaskDataType<T> = Record<keyof T, T[keyof T]>;
// 更新的任务数据
const taskData: TaskDataType<any> = {};

const scheduler = {
  async add<T extends State>(task: Callback, key: keyof T, val: T[keyof T]) {
    taskQueue.add(task);
    taskData[key] = val;
  },
  flush() {
    if (taskQueue.size === 0) return;
    batchUpdate(() => taskQueue.forEach(task => task()));
  },
  isEmpty() {
    return taskQueue.size === 0;
  },
  clear() {
    taskQueue.clear();
  },
  getTaskData() {
    return taskData;
  },
};

export default scheduler;
