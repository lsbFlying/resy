import type { PrimitiveState, ValueOf, MapType, Callback } from "../types";
import type { StateCallbackItem, StateCallback, State } from "../store/types";

// Scheduler type
export type SchedulerType<S extends PrimitiveState> = {
  // Flag for ongoing update
  isUpdating: Promise<void> | null;
  // Flag for the upcoming update execution
  willUpdating: true | null;
  // Push both the updated data (in key/value pairs) and the update task queue into the stack
  pushTask(
    key: keyof S,
    value: ValueOf<S>,
    task: Callback,
  ): void;
  // Push the callback onto the stack and wait for subsequent execution
  pushCallbackStack(
    stateMap: MapType<S>,
    state: State<S>,
    callback?: StateCallback<S>,
  ): void;
  // Flush and clear the task data and task queue
  flushTask(): void;
  // Get the current round of update tasks and data
  getSchedulerQueue(): {
    taskDataMap: MapType<S>;
    taskQueueMap: Map<keyof S, Callback>;
    callbackStackSet: Set<StateCallbackItem<S>>;
  };
  // Flag to delay the execution of the return registration function in useEffect
  deferEffectDestructorExecFlag: Promise<void> | null;
};
