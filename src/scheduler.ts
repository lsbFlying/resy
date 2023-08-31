import type { Callback, MapType, Scheduler } from "./model";
import { followUpMap } from "./utils";

/**
 * @description 调度处理器针对每一个store的私有化
 * 便于不同的store的调度处理分离开来
 * 避免了更新调度的交叉不协调问题产生的数据更新问题
 * detail course:
 * 因为调度内部的任务队列或者数据map都是根据key来添加执行的
 * 如果所有的store都公用一个会导致数据更新有问题
 * 同时，分离开调度并不影响批量更新的执行触发，是因为本身resy前置数据状态更进执行了
 * 所以不同的store在同一代码块中处理批量更新的时候
 * 会因为前置更进的数据状态以及第一批store的更新执行触发重渲染的时候
 * 恰好又因为proxy代理获取到了前置更进的新数据状态而在这一批次的更新渲染中得到触发渲染
 * 后续store的更新执行到useSyncExternalStore内部的checkIfSnapshotChanged方法时
 * 会发现前后数据一直而没有产生新一轮的强制更新，
 * 这个特性是 useSyncExternalStore + proxy + 前置数据 + Promise微任务执行 一起产生的额外惊喜效应
 */
const scheduler = () => {
  // 更新的任务队列
  const taskQueueMap = new Map();
  // 更新的任务数据
  const taskDataMap = new Map();
  
  /**
   * @description 批量处理更新的调度Map
   * 主要是为了resy的直接单次更新的批量合并
   * 同时完成react18以下的非管理领域的批处理更新的调度协调性
   */
  const schedulerProcessor: MapType<Scheduler> = new Map();
  
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
      taskDataMap: followUpMap(taskDataMap),
      taskQueueMap: followUpMap(taskQueueMap),
    }),
  );
  
  return schedulerProcessor;
};

export default scheduler;
