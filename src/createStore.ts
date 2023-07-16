/**
 * created by liushanbao
 * @description 一款简单易用的React数据状态管理器
 * @author liushanbao
 * @date 2022-05-05
 * @name createStore
 */
import scheduler from "./scheduler";
import {
  batchUpdate, STORE_VIEW_MAP_KEY, USE_STORE_KEY, USE_CONCISE_STORE_KEY, _RE_DEV_SY_,
} from "./static";
import {
  stateErrorHandle, mapToObject, objectToMap, fnPropUpdateErrorHandle,
} from "./utils";
import {
  resetStateMap, setStateCallbackStackPush, genStoreViewMap, connectStore,
  batchDispatchListener, taskPush, finallyBatchHandle, proxyReceiverThisHandle,
} from "./reduce";
import type {
  ExternalMapType, ExternalMapValue, State, StateFnParams, StoreMap, StoreMapValue, StoreMapValueType,
  Unsubscribe, Listener, CreateStoreOptions, Store, AnyFn, ConciseExternalMapType, ConciseExternalMapValue,
  SetStateCallback, SetStateCallbackItem, MapType, ValueOf,
} from "./model";

/**
 * createStore
 * created by liushanbao
 * @description 创建一个可全局使用的状态存储容器
 * 初始化状态编写的时候最好加上一个自定义的准确的泛型类型，
 * 虽然resy会有类型自动推断，但是对于数据状态类型可能变化的情况下还是不够准确的
 * @author liushanbao
 * @date 2022-05-05
 * @param initialState 初始化状态数据
 * 在有足够复杂的初始化数据逻辑场景下，"函数化参数" 功能更能满足完善这种场景需求的写法的便利性
 * 最重要的是结合restore方法具有必须的重置恢复数据初始化的能力保证初始化逻辑执行的正确性
 * @param options 状态容器配置项
 */
export function createStore<S extends State>(
  initialState?: S & ThisType<Store<S>> | (() => S & ThisType<Store<S>>),
  options?: CreateStoreOptions,
): Store<S> {
  /**
   * @description 做了一个假值兼容，本想兼容createStore()以及useConciseState()的，
   * 但这样刚好导致0、null、false、""、undefined、NaN都可以了
   * 但事实上我最大程度允许的假值就是JS的undefined，因为必要条件下我不想写初始化参数
   * 例如：const { count, setState } = useConciseState<{ count?: number }>();
   * 或者：const store = createStore<{ count?: number }>();
   * 我可以不写初始化参数，即使在TS中我也可以只通过一个初始化的范型类型确定代码中我要使用的数据
   * 这样写法看起来像是凭空捏造了一个有效的数据状态，it`s looks cool!
   * 但同样除了undefined其他的假值可能是开发者的代码bug，如果都兼容了不太好
   */
  // 所以在这里的Object判断中只对undefined特殊处理
  let state = initialState === undefined
    ? ({} as S)
    : typeof initialState === "function"
      ? initialState()
      : initialState;
  
  stateErrorHandle(state, "createStore");
  
  const { initialReset = true } = options || {};
  
  // 当前store的调度处理器
  const schedulerProcessor = scheduler();
  
  // 对应整个store的数据引用标记的set集合
  const storeRefSet = new Set<number>();
  
  /**
   * @description 由于proxy读取数据本身相较于原型链读取数据要慢，
   * 所以在不改变传参state的情况下，同时resy使用Map与Set提升性能，来弥补proxy的性能缺陷
   */
  let stateMap: MapType<S> = objectToMap(state);
  // 由于stateMap的设置前置了，优化了同步数据的获取，但是对于之前的数据状态也会需要前置处理
  let prevState: MapType<S> | null = null;
  
  /**
   * setState的回调函数执行栈数组
   * 用Array没有用Set或者Map是因为内部需要用索引index
   */
  const setStateCallbackStackArray: SetStateCallbackItem<S>[] = [];
  
  // 订阅监听Set容器
  const listenerSet = new Set<Listener<S>>();
  
  // 处理view连接store、以及获取最新state数据的相关处理Map
  const storeViewMap = genStoreViewMap(initialReset, state, stateMap, storeRefSet);
  
  // 数据存储容器storeMap
  const storeMap: StoreMap<S> = new Map();
  
  // 异步更新之前的处理
  function handleWillUpdating() {
    if (!schedulerProcessor.get("willUpdating")) {
      schedulerProcessor.set("willUpdating", true);
      // 在更新执行将更新之前的数据状态缓存下拉，以便于subscribe触发监听使用
      prevState = new Map(stateMap);
    }
  }
  
  /**
   * 同步更新
   * @description todo 更多意义上是为了解决input无法输入非英文语言bug的无奈，后续待优化setState与单次更新
   */
  function syncUpdate(updateParams: Partial<S> | StateFnParams<S>) {
    let updateParamsTemp = updateParams as Partial<S>;
    if (typeof updateParams === "function") {
      updateParamsTemp = (updateParams as StateFnParams<S>)();
    }
  
    stateErrorHandle(updateParamsTemp, "syncUpdate");
    
    const prevStateTemp = new Map(stateMap);
    batchUpdate(() => {
      let effectState: Partial<S> | null = null;
      Object.keys(updateParamsTemp).forEach(key => {
        const val = (updateParamsTemp as Partial<S> | S)[key];
        
        fnPropUpdateErrorHandle(key, val || stateMap.get(key));
        
        if (!Object.is(val, stateMap.get(key))) {
          stateMap.set(key, val);
          !effectState && (effectState = {});
          effectState[key as keyof S] = val;
          (
            (
              connectStore(key, initialReset, state, stateMap, storeRefSet, storeMap).get(key) as StoreMapValue<S>
            ).get("updater") as StoreMapValueType<S>["updater"]
          )();
        }
      });
      effectState && batchDispatchListener(prevStateTemp, effectState, stateMap, listenerSet);
    });
  }
  
  // 可对象数据更新的函数
  function setState(updateParams: Partial<S> | StateFnParams<S>, callback?: SetStateCallback<S>) {
    // willUpdating需要在更新之前开启，这里不管是否有变化需要更新，先打开缓存一下prevState方便后续订阅事件的触发执行
    handleWillUpdating();
    
    let updateParamsTemp = updateParams as Partial<S>;
    
    if (typeof updateParams !== "function") {
      // 对象方式更新直接走单次直接更新的添加入栈，后续统一批次合并更新
      Object.keys(updateParams).forEach(key => {
        taskPush(key, (updateParams as Partial<S> | S)[key], initialReset, state, stateMap, storeRefSet, storeMap, schedulerProcessor);
      });
    } else {
      /**
       * @description
       * 1、如果stateParams是函数的情况并且在函数中使用了直接更新的方式更新数据
       * 那么这里需要先调用stateParams函数，产生一个直接更新的新一轮的批次更新
       * 然后再直接检查产生的直接更新中这一轮的批次中的最新任务数据与任务队列，然后进行冲刷与更新
       *
       * 2、如果stateParams函数中不是使用直接更新的方式，
       * 而是又使用了setState，那么会走到else分支仍然批量更新
       * 因为如果是函数入参里面更新肯定通过scheduler调度统一共用到单次直接更新的逻辑，
       * 不管它当前更新层是否使用，它最终总归会使用到单次直接更新的批量合并这一步
       *
       * 3、并且这种函数入参的更新具有更高效完善的合并优势，
       * "即函数入参内部的更新触发的订阅函数内的更新会统一成一个批次更新"
       * 它是凭借这种方式的 "执行时效" 并结合unstable_batchedUpdates内部的批处理实现
       * "执行时效" 在于触发的订阅函数内的更新会随着第一次setState函数更新的then而冲刷更新掉
       * 而这个冲刷更新与前一个函数入参内的更新的时间间隔仅有4ms以内左右
       * 而之所以这样前后冲刷的间隔只有4ms以内左右，
       * 是因为它相对于常规而言少经历了订阅函数内部更新的一个promise函数的执行
       * 而promise函数在底层实现中还是较为复杂的，需要的代码时耗也有几毫秒
       * 刚好常规而言的订阅联动更新就在这几毫秒的差距中就实现了批次处理的分水岭
       * 而4ms左右这样的一个时间间隔
       * 在react中就会被unstable_batchedUpdates或者react内部的调度机制处理成统一批次的更新
       * be careful：当然这里的特性是在react-V18中才有的，因为react-V18的unstable_batchedUpdates做了优化
       * 如果是react-V18以下的版本，则还是分两个批次渲染更新。
       */
      const updateParamsTemp2 = (updateParams as StateFnParams<S>)();
      Object.keys(updateParamsTemp2).forEach(key => {
        taskPush(key, (updateParamsTemp2 as S)[key], initialReset, state, stateMap, storeRefSet, storeMap, schedulerProcessor);
      });
      updateParamsTemp = updateParamsTemp2;
    }
  
    stateErrorHandle(updateParamsTemp, "setState");
    
    // 异步回调添加入栈
    if (callback) {
      const nextState = Object.assign({}, mapToObject(stateMap), updateParamsTemp);
      /**
       * 如果是回调在执行时发现回调中有更setState并且有回调，
       * 此时回调进入下一个微任务循环中添加入栈，不影响这一轮的回调执行栈的执行
       */
      schedulerProcessor.get("isCalling")
        ? Promise.resolve().then(() => {
          setStateCallbackStackPush(nextState, callback, setStateCallbackStackArray);
        })
        : setStateCallbackStackPush(nextState, callback, setStateCallbackStackArray);
    }
    finallyBatchHandle(schedulerProcessor, prevState, stateMap, listenerSet, setStateCallbackStackArray);
  }
  
  // 订阅函数
  function subscribe(listener: Listener<S>, stateKeys?: (keyof S)[]): Unsubscribe {
    const listenerWrap: Listener<S> = (effectState, nextState, prevState) => {
      const listenerKeysIsEmpty = stateKeys === undefined || !(stateKeys && stateKeys.length !== 0);
      /**
       * 事实上最终订阅触发时，每一个订阅的这个外层listener都被触发了，
       * 只是这里在最终执行内层listener的时候做了数据变化的判断才实现了subscribe中的listener的是否执行
       */
      if (
        listenerKeysIsEmpty
        || (
          !listenerKeysIsEmpty
          && Object.keys(effectState).some(key => stateKeys.includes(key))
        )
      ) listener(effectState, nextState, prevState);
    };
    
    listenerSet.add(listenerWrap);
    
    // 显示返回解除订阅函数供用户自行选择是否解除订阅，因为也有可能用户想要一个订阅一直生效
    return () => {
      listenerSet.delete(listenerWrap);
    };
  }
  
  // 重置恢复初始化状态数据
  function restore() {
    const prevStateTemp = new Map(stateMap);
    /**
     * 如果是函数返回的初始化状态数据，则需要再次执行初始化函数来获取内部初始化的逻辑数据
     * 防止因为初始化函数的内部逻辑导致重置恢复的数据不符合初始化的数据逻辑
     */
    if (typeof initialState === "function") state = initialState();
    
    batchUpdate(() => {
      let effectState: Partial<S> | null = null;
      prevStateTemp.forEach((_, key) => {
        const originValue = state[key];
        
        const value = (stateMap.get(key) as ValueOf<S>) || originValue;
        
        // 函数跳过（因为在resy当中函数本身不允许更新也就没有变化）
        if (typeof value !== "function" && !Object.is(originValue, stateMap.get(key))) {
          resetStateMap(key, state, stateMap);
          
          !effectState && (effectState = {});
          effectState[key as keyof S] = originValue;
          
          (
            (
              connectStore(key, initialReset, state, stateMap, storeRefSet, storeMap).get(key) as StoreMapValue<S>
            ).get("updater") as StoreMapValueType<S>["updater"]
          )();
        }
      });
      
      effectState && batchDispatchListener(prevStateTemp, effectState, stateMap, listenerSet);
    });
  }
  
  // 单个属性数据更新
  function singlePropUpdate(_: S, key: keyof S, val: ValueOf<S>) {
    handleWillUpdating();
    taskPush(key, val, initialReset, state, stateMap, storeRefSet, storeMap, schedulerProcessor);
    finallyBatchHandle(schedulerProcessor, prevState, stateMap, listenerSet, setStateCallbackStackArray);
    return true;
  }
  
  // setState、subscribe与syncUpdate以及store代理内部数据Map的合集
  const externalMap: ExternalMapType<S> = new Map();
  
  // 给useStore的驱动更新代理
  const storeProxy = new Proxy(storeMap, {
    get(_, key: keyof S) {
      if (typeof stateMap.get(key) === "function") {
        return (stateMap.get(key) as AnyFn).bind(store);
      }
      return externalMap.get(key as keyof ExternalMapValue<S>)
        || (
          (
            (
              connectStore(key, initialReset, state, stateMap, storeRefSet, storeMap) as StoreMap<S>
            ).get(key) as StoreMapValue<S>
          ).get("useAtomState") as StoreMapValueType<S>["useAtomState"]
        )();
    },
  } as ProxyHandler<StoreMap<S>>);
  
  externalMap.set("setState", setState);
  externalMap.set("syncUpdate", syncUpdate);
  externalMap.set("subscribe", subscribe);
  externalMap.set("restore", restore);
  
  const conciseExternalMap = new Map(externalMap) as ConciseExternalMapType<S>;
  
  /**
   * @description 给useConciseState的store代理的额外的store代理，
   * 同时store不仅仅是单纯的数据读取操作，set/sync/sub三个函数的使用一样可以，
   * 并且也让store具有单个数据属性更新的能力
   * 与createStore生成的store具有一样的功能
   * be careful: 这样主要是为了解决react的useState中产生的数据不具有可追溯性的问题
   * 比如在某些函数中因为因为或者作用域的不同导致函数内部再次获取useState的数据会不准确
   * 而使用这个额外的store来读取数据可以具有追溯性得到最新的数据状态
   */
  const conciseExtraStoreProxy = new Proxy(state, {
    get(target, key: keyof S, receiver: any) {
      if (typeof stateMap.get(key) === "function") {
        return (stateMap.get(key) as AnyFn).bind(store);
      }
      return conciseExternalMap.get(key as keyof ConciseExternalMapValue<S>)
        || proxyReceiverThisHandle(receiver, conciseExtraStoreProxy, target, key, stateMap);
    },
    set: singlePropUpdate,
  } as ProxyHandler<S>) as Store<S>;
  
  conciseExternalMap.set("store", conciseExtraStoreProxy);
  
  // 给useConciseState的驱动更新代理，与useStore分离开来，避免useStore中解构读取store产生冗余
  const conciseStoreProxy = new Proxy(storeMap, {
    get(_, key: keyof S) {
      if (typeof stateMap.get(key) === "function") {
        return (stateMap.get(key) as AnyFn).bind(store);
      }
      return conciseExternalMap.get(key as keyof ConciseExternalMapValue<S>) || (
        (
          (
            connectStore(key, initialReset, state, stateMap, storeRefSet, storeMap) as StoreMap<S>
          ).get(key) as StoreMapValue<S>
        ).get("useAtomState") as StoreMapValueType<S>["useAtomState"]
      )();
    },
  } as ProxyHandler<StoreMap<S>>);
  
  externalMap.set(STORE_VIEW_MAP_KEY, storeViewMap);
  externalMap.set(USE_STORE_KEY, storeProxy);
  externalMap.set(USE_CONCISE_STORE_KEY, conciseStoreProxy);
  
  const store = new Proxy(state, {
    get(target, key: keyof S, receiver: any) {
      if (typeof stateMap.get(key) === "function") {
        /**
         * "js中this指向的复杂性以及js本身不是纯面向对象语言的考量，将this指向禁用也不是不行"
         * 我曾一度由于上述原因而打算放弃使用this，
         * 但是store本身的"蛇头咬蛇尾"的问题除了加上类型定义难以解决，
         * 以及ThisType<Store<S>>对于this指向的类型的友好处理
         * 给了我新的希望迫使我重新考量this的使用，
         * ThisType<Store<S>>可以解决store本身的蛇头咬蛇尾的问题，
         * 但是this对于函数属性不能写箭头函数，两者都不完美，但是互相弥补吧，所以决定this也兼容处理
         *
         * @description "蛇头咬蛇尾" ———— 比如在createStore的定义对象中再次使用了store本身作为数据类型的判别
         * 就会导致 "蛇头咬蛇尾" 的类型问题，例如：
         * const store = createStore({
         *   text: {},
         *   t: {
         *     name() {
         *       return {
         *         // 这里的store.text的引用就会导致 "蛇头咬蛇尾"，
         *         // 因为store本身的类型推断不能在其未完成类型编译预判的过程中再次使用store本身而再次去推断
         *         text: store.text
         *       };
         *     },
         *   }
         * });
         * 除非加上类型标识：
         * const store: Store<Type> = createStore<Type>({
         *   text: {},
         *   t: {
         *     name() {
         *       return {
         *         // 给store加了类型 Store<Type> 标识即可解决 "蛇头咬蛇尾" 的问题
         *         text: store.text
         *       };
         *     },
         *   }
         * })
         */
        return (stateMap.get(key) as AnyFn).bind(store);
      }
      return externalMap.get(key as keyof ExternalMapValue<S>)
        || proxyReceiverThisHandle(receiver, store, target, key, stateMap);
    },
    set: singlePropUpdate,
    // delete 也会起到更新作用
    deleteProperty(_: S, key: keyof S) {
      handleWillUpdating();
      taskPush(key, undefined as ValueOf<S>, initialReset, state, stateMap, storeRefSet, storeMap, schedulerProcessor);
      finallyBatchHandle(schedulerProcessor, prevState, stateMap, listenerSet, setStateCallbackStackArray);
      return true;
    },
    setPrototypeOf() {
      if (_RE_DEV_SY_) {
        throw new Error("Prohibit changing the prototype of the store!");
      }
      return false;
    },
  } as ProxyHandler<S>) as Store<S>;
  
  return store;
}
