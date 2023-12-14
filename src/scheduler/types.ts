import type { PrimitiveState, ValueOf, MapType, Callback } from "../types";

/**
 * resy的调度类型接口
 * @description 调度类型
 * 原本调度中还有针对setState的callback回掉进行处理的开关标识isCalling
 * 后来发现是多余不必要的，因为本身回掉Set在遍历执行的过程中即使
 * 内部再有回掉执行，也会放在Set后续尾部调用，所以这里是天然直接遍历即可
 */
export type Scheduler<S extends PrimitiveState> = {
  // 更新进行中
  isUpdating: Promise<void> | null;
  // 将要更新执行的标识
  willUpdating: true | null;
  // 入栈更新数据的key/value以及更新任函数务队列
  pushTask(key: keyof S, value: ValueOf<S>, task: Callback): void;
  // 冲刷任务数据与任务队列
  flush(): void;
  // 获取当前一轮的更新任务及数据
  getTasks(): {
    taskDataMap: MapType<S>;
    taskQueueSet: Set<Callback>;
  };
  // 延迟useEffect的return 注册接触函数Destructor执行的标识
  deferDestructorFlag: Promise<void> | null;
};
