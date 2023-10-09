/**
 * created by liushanbao
 * @description 一款简单易用的React数据状态管理器
 * @author liushanbao
 * @date 2022-05-05
 * @name createStore
 */
import scheduler from "./scheduler";
import {
  batchUpdate, VIEW_CONNECT_STORE_KEY, USE_STORE_KEY, USE_CONCISE_STORE_KEY, REGENERATIVE_SYSTEM_KEY,
} from "./static";
import {
  stateErrorHandle, mapToObject, objectToMap, protoPointStoreErrorHandle,
  followUpMap, optionsErrorHandle, hasOwnProperty, subscribeErrorHandle, setStateCallbackErrorHandle,
} from "./utils";
import {
  genViewConnectStoreMap, batchDispatchListener, pushTask, connectHookUse,
  finallyBatchHandle, willUpdatingHandle, mergeStateKeys, handleReducerState,
} from "./reduce";
import type {
  ExternalMapType, ExternalMapValue, PrimitiveState, StateFnType, StoreMap,
  Unsubscribe, Listener, CreateStoreOptions, Store, AnyFn, ConciseExternalMapType,
  ConciseExternalMapValue, SetStateCallback, SetStateCallbackItem,
  MapType, ValueOf, State, StateRestoreAccomplishedMapType, InitialStateType, Callback,
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
 * @return Store<S>
 */
export const createStore = <S extends PrimitiveState>(
  initialState?: InitialStateType<S>,
  options?: CreateStoreOptions,
): Store<S> => {
  /**
   * 解析还原出来的状态数据
   * @description 这里不能用let定义reducerState以及后续restore这个api中
   * 对reducerState直接的赋值重置会影响reducerState本身的数据引用
   * 对于reduce文件里面的reducerState的state参数的引用追踪的状态变化会有影响
   * 所以这里使用const定义，且后续清空使用clearObject遍历清空
   * 这么做是为了节省内存，否则reduce里面拆分的很多方法就必须写在createStore内部了
   * 那样一来每次createStore就会生成很多reduce里面的重复函数占用很多内存
   */
  const reducerState = initialState === undefined
    ? ({} as S)
    : typeof initialState === "function"
      ? initialState()
      : initialState;

  stateErrorHandle(reducerState, "createStore");

  optionsErrorHandle("createStore", options);
  const optionsTemp = options
    ? { unmountRestore: options.unmountRestore }
    : { unmountRestore: true };

  // 当前store的调度处理器
  const schedulerProcessor = scheduler();

  // 对应整个store的数据引用标记的set集合
  const storeStateRefSet = new Set<number>();
  /**
   * @description storeStateRef的引用清空的状态对应了整个store的数据状态的恢复到初始化的情况，
   * 这里是恢复初始化成功与否的开关标识，以防止代码多次执行重复的动作，减轻冗余负担
   */
  const stateRestoreAccomplishedMap: StateRestoreAccomplishedMapType = new Map();

  /**
   * @description 在不改变传参state的情况下，同时resy使用Map与Set提升性能，且Map、Set在内存也会占优
   * 同时更重要的是转换给map，做一层引用类型数据的安全保护层的浅拷贝
   * 这样即使外部的initialState数据的引用数据恶意错误变化，也不会影响内部map数据的恶意变化
   * 但是如果reducerState、initialState要在一级以上的内层数据做脏更改的话这里也是难以保护的
   * 本身js是若类型语言，很难做到类型级数据更改安全，除非全量的深拷贝，但是深拷贝对于大对象过于耗费性能，这里不做考量
   * 且resy同样保持react一贯的更新设定，即不支持二级属性更新，使用全新属性值进行数据更新
   * 虽然map、object之间的转换可能会耗费一些性能，但是在数据量不大的情况下影响不大
   * 且涉及map、object转换的都属于高阶使用方式，常规使用不涉及这种消耗转换，所以总体来说使用Map获取的性能收益是划算的
   */
  const stateMap: MapType<S> = objectToMap(reducerState);
  // 由于stateMap的设置前置了，优化了同步数据的获取，但是对于之前的数据状态也会需要前置处理
  const prevState: MapType<S> = objectToMap(reducerState);

  /**
   * @description setState的回调函数执行栈数组
   * 用Array没有用Set或者Map是因为内部需要用索引index
   */
  const setStateCallbackStackSet = new Set<SetStateCallbackItem<S>>();

  // 订阅监听Set容器
  const listenerSet = new Set<Listener<S>>();

  // 处理view连接store、以及获取最新state数据的相关处理Map
  const viewConnectStoreMap = genViewConnectStoreMap(
    optionsTemp.unmountRestore, reducerState, stateMap,
    storeStateRefSet, stateRestoreAccomplishedMap, initialState,
  );

  // 数据存储容器storeMap
  const storeMap: StoreMap<S> = new Map();

  /**
   * @description store内部数据的change更新回调的Set集合
   * 包含整个store数据的变化更新的回调函数，采用Set储存相对简单高效
   */
  const storeChangeSet = new Set<Callback>();

  /**
   * 同步更新
   * @description todo 更多意义上是为了解决input无法输入非英文语言bug的无奈
   * bug原因是react的更新调度机制不满足在微任务中执行的问题，vue中是可以的，后续待优化
   */
  const syncUpdate = (state: State<S> | StateFnType<S>) => {
    let stateTemp = state;
    if (typeof state === "function") {
      stateTemp = (state as StateFnType<S>)(mapToObject(prevState));
    }

    if (stateTemp === null) return;

    stateErrorHandle(stateTemp, "syncUpdate");

    const prevStateTemp: MapType<S> = followUpMap(stateMap);

    batchUpdate(() => {
      const effectState: Partial<S> = {};

      Object.keys(stateTemp as NonNullable<State<S>>).forEach(key => {
        const val = (stateTemp as Partial<S> | S)[key];

        if (!Object.is(val, stateMap.get(key))) {
          stateMap.set(key, val);
          effectState[key as keyof S] = val;
          // 更新
          storeChangeSet.forEach(storeChange => {
            storeChange();
          });
        }
      });

      if (Object.keys(effectState).length > 0 && listenerSet.size > 0) {
        batchDispatchListener(prevStateTemp, effectState, stateMap, listenerSet);
      }
    });
  };

  // 可对象数据更新的函数
  const setState = (state: State<S> | StateFnType<S>, callback?: SetStateCallback<S>) => {
    setStateCallbackErrorHandle(callback);

    // 调度处理器内部的willUpdating需要在更新之前开启，这里不管是否有变化需要更新，
    // 先打开缓存一下prevState方便后续订阅事件的触发执行
    willUpdatingHandle(schedulerProcessor, prevState, stateMap);

    let stateTemp = state;

    if (typeof state === "function") {
      stateTemp = (state as StateFnType<S>)(mapToObject(prevState));
    }

    if (stateTemp !== null) {
      stateErrorHandle(stateTemp, "setState");

      // 更新添加入栈，后续统一批次合并更新
      Object.keys(stateTemp as NonNullable<State<S>>).forEach(key => {
        pushTask(key, (stateTemp as S)[key], stateMap, schedulerProcessor);
      });
    }

    // 异步回调添加入栈
    if (callback) {
      const nextState: S = Object.assign({}, mapToObject(stateMap), stateTemp);
      setStateCallbackStackSet.add({ nextState, callback });
    }

    finallyBatchHandle(
      schedulerProcessor, prevState, stateMap, listenerSet, setStateCallbackStackSet, storeChangeSet,
    );
  };

  // 重置恢复初始化状态数据
  const restore = () => {
    const prevStateTemp = followUpMap(stateMap);
    handleReducerState(reducerState, initialState);

    batchUpdate(() => {
      const effectState: Partial<S> = {};

      mergeStateKeys(reducerState, prevStateTemp).forEach(key => {
        const originValue = reducerState[key];

        if (!Object.is(originValue, stateMap.get(key))) {
          hasOwnProperty.call(reducerState, key)
            ? stateMap.set(key, originValue)
            : stateMap.delete(key);
          effectState[key as keyof S] = originValue;

          storeChangeSet.forEach(storeChange => {
            storeChange();
          });
        }
      });

      if (Object.keys(effectState).length > 0 && listenerSet.size > 0) {
        batchDispatchListener(prevStateTemp, effectState, stateMap, listenerSet);
      }
    });
  };

  // 订阅函数
  const subscribe = (listener: Listener<S>, stateKeys?: (keyof S)[]): Unsubscribe => {
    subscribeErrorHandle(listener, stateKeys);
    let listenerWrap: Listener<S> | null = data => {
      const listenerKeysExist = stateKeys && stateKeys?.length > 0;
      /**
       * @description 事实上最终订阅触发时，每一个订阅的这个外层listener都被触发了，
       * 只是这里在最终执行内层listener的时候做了数据变化的判断才实现了subscribe中的listener的是否执行
       */
      if (
        (
          listenerKeysExist
          && Object.keys(data.effectState).some(key => stateKeys.includes(key))
        ) || !listenerKeysExist
      ) listener(data);
    };

    listenerSet.add(listenerWrap);

    // 显示返回解除订阅函数供用户自行选择是否解除订阅，因为也有可能用户想要一个订阅一直生效
    return () => {
      listenerSet.delete(listenerWrap as Listener<S>);
      listenerWrap = null;
    };
  };

  // 更改设置unmountRestore参数配置
  const setOptions = (options: CreateStoreOptions) => {
    optionsErrorHandle("setOptions", options);
    optionsTemp.unmountRestore = options?.unmountRestore ?? optionsTemp.unmountRestore;
  };

  // 单个属性数据更新
  const singlePropUpdate = (_: S, key: keyof S, val: ValueOf<S>) => {
    willUpdatingHandle(schedulerProcessor, prevState, stateMap);
    pushTask(key, val, stateMap, schedulerProcessor);
    finallyBatchHandle(
      schedulerProcessor, prevState, stateMap, listenerSet, setStateCallbackStackSet, storeChangeSet,
    );
    return true;
  };

  // setState、syncUpdate、restore、subscribe以及store代理内部数据Map的合集
  const externalMap: ExternalMapType<S> = new Map();

  /**
   * @description 这里也可以使用initialState、reducerState或者stateMap进行代理
   * 这里选取storeMap进行统一代理编写
   */
  const store = new Proxy(storeMap, {
    get: (_: StoreMap<S>, key: keyof S, receiver: any) => {
      protoPointStoreErrorHandle(receiver, store);

      if (typeof stateMap.get(key) === "function") {
        /**
         * @description 增加bind绑定对象是因为如果是单纯的const { xFn } = store;的解构写法，
         * 会使得函数内部的this指向的上下文作用域变成组件的作用域，
         * 而组件运行的作用域在开发的严格模式中是undefined，所以这里需要bind绑定this对象来兼容这种情况
         */
        return (stateMap.get(key) as AnyFn).bind(store);
      }

      return externalMap.get(key as keyof ExternalMapValue<S>) || stateMap.get(key);
    },
    set: singlePropUpdate,
    // delete 也会起到更新作用
    deleteProperty: (_: S, key: keyof S) => singlePropUpdate(_, key, undefined as ValueOf<S>),
    setPrototypeOf: () => {
      throw new Error("Changing the prototype of store is forbidden!");
    },
  } as any as ProxyHandler<StoreMap<S>>) as any as Store<S>;

  // 给useStore的驱动更新代理
  const storeProxy = new Proxy(storeMap, {
    get(_, key: keyof S) {
      if (typeof stateMap.get(key) === "function") {
        // 也做一个函数数据hook的调用，给予函数数据更新渲染的能力
        connectHookUse(
          key, optionsTemp.unmountRestore, reducerState, stateMap, storeStateRefSet,
          storeMap, stateRestoreAccomplishedMap, storeChangeSet, initialState,
        );
        return (stateMap.get(key) as AnyFn).bind(store);
      }
      return externalMap.get(key as keyof ExternalMapValue<S>) || connectHookUse(
        key, optionsTemp.unmountRestore, reducerState, stateMap, storeStateRefSet,
        storeMap, stateRestoreAccomplishedMap, storeChangeSet, initialState,
      );
    },
  } as ProxyHandler<StoreMap<S>>);

  externalMap.set("setState", setState);
  externalMap.set("syncUpdate", syncUpdate);
  externalMap.set("restore", restore);
  externalMap.set("subscribe", subscribe);
  externalMap.set(REGENERATIVE_SYSTEM_KEY, REGENERATIVE_SYSTEM_KEY);

  const conciseExternalMap = followUpMap(externalMap) as ConciseExternalMapType<S>;

  externalMap.set("setOptions", setOptions);

  /**
   * @description 给useConciseState的store代理的额外的store代理，
   * 同时store不仅仅是单纯的数据读取操作，set/sync/sub三个函数的使用一样可以，
   * 并且也让store具有单个数据属性更新的能力
   * 与createStore生成的store具有一样的功能
   * be careful: 这样主要是为了解决react的useState中产生的数据不具有可追溯性的问题
   * 比如在某些函数中因为因为或者作用域的不同导致函数内部再次获取useState的数据会不准确
   * 而使用这个额外的store来读取数据可以具有追溯性得到最新的数据状态
   */
  const conciseExtraStore = new Proxy(storeMap, {
    get(_: StoreMap<S>, key: keyof S, receiver: any) {
      protoPointStoreErrorHandle(receiver, conciseExtraStore);

      if (typeof stateMap.get(key) === "function") {
        return (stateMap.get(key) as AnyFn).bind(store);
      }

      return conciseExternalMap.get(key as keyof ConciseExternalMapValue<S>) || stateMap.get(key);
    },
    set: singlePropUpdate,
    deleteProperty: (_: S, key: keyof S) => singlePropUpdate(_, key, undefined as ValueOf<S>),
    setPrototypeOf: () => {
      throw new Error("Changing the prototype of store is forbidden!");
    },
  } as any as ProxyHandler<StoreMap<S>>) as any as Store<S>;

  conciseExternalMap.set("store", conciseExtraStore);

  /**
   * @description 给useConciseState的驱动更新代理，与useStore分开，因为二者承担功能点有些区别
   * useStore中不需要store属性，而useConciseState可以有store属性
   * useStore中使用的store可以使用setOptions，而useConciseState中的store属性不能使用setOptions
   * 因为useConciseState本质上是createStore的memo包裹，所以重新渲染的时候无法使用静态createStore的已存在store
   * 而是createStore生成的新的store，而它只能是unmountRestore是true，必然会是useState一样的数据渲染效果
   * 所以自然也就不像具备全局性的createStore那样存在setOptions方法
   */
  const conciseStoreProxy = new Proxy(storeMap, {
    get(_, key: keyof S) {
      if (typeof stateMap.get(key) === "function") {
        // 也做一个函数数据hook的调用，给予函数数据更新渲染的能力
        connectHookUse(
          key, optionsTemp.unmountRestore, reducerState, stateMap, storeStateRefSet,
          storeMap, stateRestoreAccomplishedMap, storeChangeSet, initialState,
        );
        return (stateMap.get(key) as AnyFn).bind(store);
      }
      return conciseExternalMap.get(key as keyof ConciseExternalMapValue<S>) || connectHookUse(
        key, optionsTemp.unmountRestore, reducerState, stateMap, storeStateRefSet,
        storeMap, stateRestoreAccomplishedMap, storeChangeSet, initialState,
      );
    },
  } as ProxyHandler<StoreMap<S>>);

  externalMap.set(VIEW_CONNECT_STORE_KEY, viewConnectStoreMap);
  externalMap.set(USE_STORE_KEY, storeProxy);
  externalMap.set(USE_CONCISE_STORE_KEY, conciseStoreProxy);

  return store;
};
