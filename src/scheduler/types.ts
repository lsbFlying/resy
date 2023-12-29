import type { PrimitiveState, ValueOf, MapType, Callback } from "../types";

// Scheduler type
export type Scheduler<S extends PrimitiveState> = {
  // Flag for ongoing update
  isUpdating: Promise<void> | null;
  // Flag for the upcoming update execution
  willUpdating: true | null;
  // Push both the updated data (in key/value pairs) and the update task queue into the stack
  pushTask(key: keyof S, value: ValueOf<S>, task: Callback): void;
  // Flush and clear the task data and task queue
  flush(): void;
  // Get the current round of update tasks and data
  getTasks(): {
    taskDataMap: MapType<S>;
    taskQueueSet: Set<Callback>;
  };
  // Flag to delay the execution of the return registration function in useEffect
  deferDestructorFlag: Promise<void> | null;
};
