/**
 * created by liushanbao
 * @description 一款简单易用的React数据状态管理器
 * @author liushanbao
 * @date 2022-05-05
 * @function createStore
 * @name createStore
 */
import useSyncExternalStoreExports from "use-sync-external-store/shim";
import scheduler from "./scheduler";
import EventDispatcher from "./listener";
import { batchUpdate, storeCoreMapKey, useStoreKey } from "./static";
import type {
  Callback, ExternalMapType, ExternalMapValue, SetState, State, StateFunc, StoreCoreMapType,
  StoreCoreMapValue, StoreMap, StoreMapValue, StoreMapValueType, Subscribe, Unsubscribe,
  Scheduler, CustomEventListener, Listener,
} from "./model";
import { mapToObject } from "./utils";

/**
 * 从use-sync-external-store包的导入方式到下面的引用方式
 * 是为了解决该包在ESM中的有效执行，因为use-sync-external-store这个包最终打包只导出了CJS
 * 等use-sync-external-store什么时候更新版本导出ESM模块的时候再更新吧
 */
const { useSyncExternalStore } = useSyncExternalStoreExports;

/**
 * createStore
 * created by liushanbao
 * @description 初始化状态编写的时候最好加上一个自定义的准确的泛型类型，
 * 虽然resy会有类型自动推断，但是对于数据状态类型可能变化的情况下还是不够准确的
 * @author liushanbao
 * @date 2022-05-05
 * @param state
 * @param unmountClear
 * @description unmountClear参数主要是为了在某模块卸载的时候自动清除初始化数据，恢复数据为初始化传入的state数据
 * 之所以会有unmountClear这样的参数设计是因为resy为了极简的使用便利性，一般是放在某个文件中进行调用返回一个store
 * 但是之后再进入该模块之后都是走的Node.js的import的缓存了，即没有再次执行resy方法了导致数据状态始终保持
 * 也就是在 "静态模板" 的实现方式下，函数是不会再次运行的
 * 但这不是一个坏事儿，因为本身store作为一个全局范围内可控可引用的状态存储器而言，具备这样的能力是有益的
 * 比如登录后的用户信息数据作为一个全局模块都可公用分享的数据而言就很好的体现了这一点
 * 但这种全局真正公用分享的数据是相对而言少数的，大部分情况下是没那么多要全局分享公用的数据的
 * 所以unmountClear默认设置为true，符合常规使用即可，除非遇到像上述登录信息数据那样的全局数据而言才会设置为false
 */
export function createStore<T extends State>(state: T, unmountClear = true): T & SetState<T> & Subscribe<T> {
  /**
   * 不改变传参state，同时resy使用Map与Set提升性能
   * 如stateMap、storeMap、storeCoreMap、storeChangesSet等
   */
  let stateMap: Map<keyof T, T[keyof T]> = new Map(Object.entries(state));
  
  // 每一个resy生成的store具有的监听订阅处理，并且可以获取最新state数据
  const storeCoreMap: StoreCoreMapType<T> = new Map();
  storeCoreMap.set("getState", () => stateMap);
  storeCoreMap.set("setHookFieldsValue", (hookInitialState: Partial<T>) => {
    Object.keys(hookInitialState).forEach(key => {
      if (stateMap.get(key) === undefined) {
        stateMap.set(key, hookInitialState[key] as T[keyof T]);
      }
    });
  });
  storeCoreMap.set("resetState", () => {
    if (unmountClear) stateMap = new Map(Object.entries(state));
  });
  storeCoreMap.set("listenerEventType", Symbol("storeListenerSymbol"));
  storeCoreMap.set("dispatchStoreSet", new Set<CustomEventListener<T>>());
  storeCoreMap.set("dispatchStoreEffect", (effectData: Partial<T>, prevState: T, nextState: T) => {
    (
      storeCoreMap.get("dispatchStoreSet") as StoreCoreMapValue<T>["dispatchStoreSet"]
    ).forEach(item => item.dispatchEvent(
      storeCoreMap.get("listenerEventType") as string | symbol,
      effectData,
      prevState,
      nextState,
    ));
  });
  
  // 数据存储容器storeMap
  const storeMap: StoreMap<T> = new Map();
  
  /** 生成storeMap键值对 */
  function genStoreMapKeyValue(key: keyof T) {
    /**
     * 为每一个数据的change更新回调做一个闭包MSet储存
     * 之所以用Set不用Map是因为每一个使用数据字段
     * 都需要一个subscribe的强更新绑定回调
     * 而每一个绑定回调函数是针对组件对于数据使用的更新开关
     */
    const storeChangesSet = new Set<Callback>();
    
    const storeMapValue: StoreMapValue<T> = new Map();
    storeMapValue.set("subscribe", (storeChange: Callback) => {
      storeChangesSet.add(storeChange);
      return () => {
        storeChangesSet.delete(storeChange);
        if (unmountClear) stateMap.set(key, state[key]);
      };
    });
    storeMapValue.set("getSnapshot", () => stateMap.get(key));
    storeMapValue.set("setSnapshot", (val: T[keyof T]) => {
      /**
       * 考虑极端复杂的情况下业务逻辑有需要更新某个数据为函数，或者本身函数也有变更
       * 同时使用Object.is避免一些特殊情况，虽然实际业务上设置值为NaN/+0/-0的情况并不多见
       */
      if (!Object.is(val, stateMap.get(key))) {
        // 这一步是为了配合getSnapshot，使得getSnapshot可以获得最新值
        stateMap.set(key, val);
        // 这一步才是真正的更新数据，通过useSyncExternalStore的内部变动后强制更新来刷新数据驱动页面更新
        storeChangesSet.forEach(storeChange => storeChange());
      }
    });
    storeMapValue.set("useSnapshot", () => useSyncExternalStore(
      (storeMap.get(key) as StoreMapValue<T>).get("subscribe") as StoreMapValueType<T>["subscribe"],
      (storeMap.get(key) as StoreMapValue<T>).get("getSnapshot") as StoreMapValueType<T>["getSnapshot"],
    ));
    
    storeMap.set(key, storeMapValue);
  }
  
  /** 批量触发订阅监听的数据变动 */
  function batchDispatch(prevState: Map<keyof T, T[keyof T]>, changedData: Map<keyof T, T[keyof T]>) {
    if (changedData.size > 0 && (storeCoreMap.get("dispatchStoreSet") as StoreCoreMapValue<T>["dispatchStoreSet"]).size > 0) {
      /**
       * effectState：实际真正影响变化的数据
       * changedData是给予更新变化的数据，但是不是真正会产生变化影响的数据，
       * 就好比setState中的参数对象可以写与原数据一样数据，但是不产生更新
       */
      const effectState = {} as Partial<T>;
      
      [...changedData.entries()].forEach(([key, value]) => {
        if (!Object.is(value, prevState.get(key))) {
          effectState[key as keyof T] = stateMap.get(key);
        }
      });
      
      if (Object.keys(effectState).length !== 0) {
        (
          storeCoreMap.get("dispatchStoreEffect") as StoreCoreMapValue<T>["dispatchStoreEffect"]
        )(effectState, mapToObject(prevState), mapToObject(stateMap));
      }
    }
  }
  
  /** 更新任务添加入栈 */
  async function taskPush(key: keyof T, val: T[keyof T]) {
    (scheduler.get("add") as Scheduler<T>["add"])(
      () => (
        (
          initialValueConnectStore(key).get(key) as StoreMapValue<T>
        ).get("setSnapshot") as StoreMapValueType<T>["setSnapshot"]
      )(val),
      key,
      val,
    );
  }
  
  /** 批量异步更新函数 */
  async function updater(stateParams: Partial<T> | T | StateFunc = {}) {
    if (typeof stateParams !== "function") {
      // 对象方式更新直接走单次直接更新的添加入栈，后续统一批次合并更新
      Object.keys(stateParams).forEach(key => {
        taskPush(key, (stateParams as Partial<T> | T)[key]);
      });
    } else {
      /**
       * 1、如果stateParams是函数的情况并且在函数中使用了直接更新的方式更新数据
       * 那么这里需要先调用stateParams函数，产生一个直接更新的新一轮的批次更新
       * 然后再直接检查产生的直接更新中这一轮的批次中的最新任务数据与任务队列，然后进行冲刷与更新
       *
       * 2、如果stateParams函数中不是使用直接更新的方式，
       * 而是又使用了setState，那么会走到else分支仍然批量更新
       * 因为如果是函数入参里面更新肯定通过scheduler调度统一共用到单次直接更新的逻辑，
       * 不管它当前更新层是否使用，它最终总归会使用到单次直接更新的批量合并这一步
       */
      (stateParams as StateFunc)();
    }
  }
  
  /**
   * @description 最终批量处理（更新、触发）
   * 借助then的（微任务）事件循环实现数据与任务更新的执行都统一入栈，然后冲刷更新
   * 同时可以帮助React v18以下的版本实现React管理不到的地方自动批处理更新
   * 但是异步更新的批量处理也导致无法立即获取最新数据
   * 如果想要立即同步获取最新数据可以使用setState的回调
   * 由此可见为了实现批量更新与同步获取最新数据有点拆东墙补西墙的味道
   * 但好在setState的回调弥补了同步获取最新数据的问题
   */
  function finallyBatchHandle() {
    const { taskDataMap, taskQueueMap } = (scheduler.get("getTask") as Scheduler<T>["getTask"])();
    // 至此，这一轮数据更新的任务完成，立即清空冲刷任务数据与任务队列，腾出空间为下一轮数据更新做准备
    (scheduler.get("flush") as Scheduler<T>["flush"])();
    if (taskDataMap.size !== 0) {
      // 更新之前的数据
      const prevState = new Map(stateMap);
      batchUpdate(() => taskQueueMap.forEach(task => task()));
      batchDispatch(prevState, taskDataMap);
    }
  }
  
  /**
   * @description setState批量更新函数
   * 为了解决"如果在同一个事件循环的批次之中setState批量更新与直接更新的方式混用了"这样的场景
   * 决定将setState的更新与直接更新的方式共用一个scheduler调用，这样可以从根本上解决"混用合并"的问题
   * 也不仅仅是混用的场景，还包含setState连续多次调用的场景，至于这种场景的出现有些其实是合理的
   * 比如需要条件更新:
   * if (condition) {
   *   setState(???);
   * }
   * setState(???);
   * 类似这种场景；我们当然可以使用一个对象容器然后再一次性更新对象容器，
   * 但有时候我就不想多此一步操作就想这样简单的写法，所以自身多次调用的场景合并也是很有必要的
   */
  function setState(stateParams: Partial<T> | T | StateFunc = {}, callback?: (nextState: T) => void) {
    updater(stateParams).then(() => {
      finallyBatchHandle();
      callback?.(mapToObject(stateMap));
    });
  }
  
  /** 订阅函数 */
  function subscribe(listener: Listener<T>, stateKeys?: (keyof T)[]): Unsubscribe {
    const dispatchStoreSetTemp = storeCoreMap.get("dispatchStoreSet") as StoreCoreMapValue<T>["dispatchStoreSet"];
    
    const customEventDispatcher: CustomEventListener<T> = new EventDispatcher();
    customEventDispatcher.addEventListener(
      /**
       * 每一个订阅监听实例有相同的event type不要紧，因为实例不同所以不会影响
       * 这里取一个实例类型常量反而方便节省内存、增加代码执行效率
       */
      storeCoreMap.get("listenerEventType") as StoreCoreMapValue<T>["listenerEventType"],
      (
        effectState: Partial<Omit<T, keyof SetState<T> | keyof Subscribe<T>>>,
        prevState: Omit<T, keyof SetState<T> | keyof Subscribe<T>>,
        nextState: Omit<T, keyof SetState<T> | keyof Subscribe<T>>,
      ) => {
        let includesFlag = false;
        const listenerKeysIsEmpty = stateKeys === undefined || !(stateKeys && stateKeys.length !== 0);
        if (!listenerKeysIsEmpty && Object.keys(effectState).some(key => stateKeys.includes(key))) includesFlag = true;
        if (listenerKeysIsEmpty || (!listenerKeysIsEmpty && includesFlag)) listener(effectState, prevState, nextState);
      },
    );
    dispatchStoreSetTemp.add(customEventDispatcher);
    
    return () => {
      dispatchStoreSetTemp.delete(customEventDispatcher);
    };
  }
  
  // 为每一个数据字段储存连接到store容器中
  function initialValueConnectStore(key: keyof T) {
    // 解决初始化属性泛型有?判断符导致store[key]为undefined的问题
    if (storeMap.get(key) !== undefined) return storeMap;
    genStoreMapKeyValue(key);
    return storeMap;
  }
  
  // setState与subscribe以及store代理内部数据Map的合集
  const externalMap: ExternalMapType<T> = new Map();
  
  // 给useStore的驱动更新代理
  const storeMapProxy = new Proxy(storeMap, {
    get: (_, key: keyof T) => {
      return externalMap.get(key as keyof ExternalMapValue<T>) || (
        (
          (
            initialValueConnectStore(key) as StoreMap<T>
          ).get(key) as StoreMapValue<T>
        ).get("useSnapshot") as StoreMapValueType<T>["useSnapshot"]
      )();
    },
  } as ProxyHandler<StoreMap<T>>);
  
  externalMap.set("setState", setState);
  externalMap.set("subscribe", subscribe);
  externalMap.set(storeCoreMapKey, storeCoreMap);
  externalMap.set(useStoreKey, storeMapProxy);
  
  return new Proxy(state, {
    get: (_, key: keyof T) => {
      return externalMap.get(key as keyof ExternalMapValue<T>) || stateMap.get(key);
    },
    set: (_, key: keyof T, val: T[keyof T]) => {
      taskPush(key, val).then(() => {
        finallyBatchHandle();
      });
      return true;
    },
  } as ProxyHandler<T>) as T & SetState<T> & Subscribe<T>;
}
