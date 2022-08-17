import { Callback, State } from "./model";
import { batchUpdate } from "./static";

type SchedulerTask = () => Promise<void>;

// 更新的任务队列
const taskQueueMap = new Map<string | number | symbol, SchedulerTask>();

// 更新的任务数据
const taskDataMap = new Map();

// resy的调度类型
export interface Scheduler<T = State> {
  add<T>(task: SchedulerTask, key: keyof T, val: T[keyof T], prevCycleDispatch: Callback): Promise<void>;
  flush(): void;
  isEmpty(): boolean;
  // 注意这里的clean最好不要与Map的原型方法clear重名
  clean(): void;
  getTaskDataMap(): Map<keyof T, T[keyof T]>;
  /**
   * 通过isFlush正在冲刷的标识来解决事件循环中的执行顺序，避免更新错乱
   * 最常见的场景是更新一个数据之后，useEffect通过这个数据的依赖进行二次逻辑更新
   * 这时就可以通过isFlush来解决二次更新的错乱问题
   */
  isFlush: boolean;
}

/**
 * 批量处理更新的调度Map
 * 主要是为了完成react18以下的非管理领域的批处理更新的调度协调性
 */
const scheduler = new Map<keyof Scheduler, Scheduler[keyof Scheduler]>();
scheduler.set("add", async (task, key, val, prevCycleDispatch) => {
  if (scheduler.get("isFlush")) {
    task().then(() => {
      // 触发dispatch数据订阅更新
      prevCycleDispatch();
    });
    return;
  }
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
  scheduler.set("isFlush", true);
  batchUpdate(() => taskQueueMap.forEach(task => task()));
});
scheduler.set("isEmpty", () => taskQueueMap.size === 0);
scheduler.set("clean", () => {
  taskQueueMap.clear();
  taskDataMap.clear();
  scheduler.set("isFlush", false);
});
scheduler.set("getTaskDataMap", () => taskDataMap);

export { scheduler };
