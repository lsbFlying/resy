import { __DEV__, REGENERATIVE_SYSTEM_KEY } from "./static";
import type {
  PrimitiveState, State, CreateStoreOptions, Listener, SetStateCallback,
} from "./model";

const toString = Object.prototype.toString;

// store传的不是由resy本身的createStore创建产生的store的错误处理
export const storeErrorHandle = <S extends PrimitiveState>(store: S, fnName: "useStore" | "view") => {
  if (!store[REGENERATIVE_SYSTEM_KEY as keyof S]) {
    throw new Error(
      `resy's ${
        fnName
      }(...): Expected the 'store' argument should be generated by resy's createStore(...). Instead received: ${
        store
      }.`
    );
  }
};

// 数据更新参数报错处理
export const stateErrorHandle = <S extends PrimitiveState>(
  stateParams: State<S>,
  fnName: "setState" | "syncUpdate" | "createStore",
) => {
  if (toString.call(stateParams) !== "[object Object]") {
    throw new Error(
      `resy's ${fnName}(...): takes an object of state variables to update or`
      + " a function which returns an object of state variables."
    );
  }
  if (
    __DEV__ && (stateParams as Partial<S>)?.[REGENERATIVE_SYSTEM_KEY as keyof S]
  ) {
    console.error(
      `Warning: resy's ${fnName}(...): takes a store of generated by resy's createStore that's has no update significance!`
    );
  }
};

// createStore的options配置错误处理
export const optionsErrorHandle = <S extends PrimitiveState>(
  fnName: "setOptions" | "createStore",
  options?: CreateStoreOptions<S>
) => {
  if (
    (options !== undefined && typeof options?.unmountRestore !== "boolean")
    || (
      options !== undefined && (
        typeof options?.__conciseStateSlot__ !== "function"
        && typeof options?.__conciseStateSlot__ !== "undefined"
      )
    )
  ) {
    throw new Error(
      `resy's ${fnName}(...): Expected the ${
        fnName === "createStore" ? "last optional" : ""
      } 'options' argument to be a CreateStoreOptions type params. Instead received: ${options}.`
    );
  }
};

// subscribe的参数错误处理
export const subscribeErrorHandle = <S extends PrimitiveState>(
  listener: Listener<S>,
  stateKeys?: (keyof S)[],
) => {
  if (typeof listener !== "function") {
    throw new Error(
      `resy's subscribe(...): Expected the first optional 'listener' argument to be a function. Instead received: ${listener}.`
    );
  }
  if (stateKeys !== undefined && toString.call(stateKeys) !== "[object Array]") {
    throw new Error(
      `resy's subscribe(...): Expected the last optional 'stateKeys' argument to be a array. Instead received: ${stateKeys}.`
    );
  }
};

export const setStateCallbackErrorHandle = <S extends PrimitiveState>(callback?: SetStateCallback<S>) => {
  if (callback !== undefined && typeof callback !== "function") {
    throw new Error(
      `resy's setState(...): Expected the last optional 'callback' argument to be a function. Instead received: ${callback}.`
    );
  }
};

/**
 * store被设置为某对象的原型的错误处理
 * @description 防止有对象继承了createStore生成的代理对象，
 * 同时initialState属性中又有 "属性描述对象" 的get (getter) 或者set (setter) 存取器 的写法
 * 会导致proxy中的receiver对象指向的this上下文对象变化
 * 使得 get / set 所得到的数据产生非期望的数据值
 * set不会影响数据，因为set之后会从proxy的get走，所以只要控制好get即可保证数据的正确性
 * detail course:
 * 为了杜绝这种复杂的易产生bug的问题，所以直接抛出错误，提醒开发者禁止疑难杂症的代码写法
 * 因为不禁止就要既要解决get又要解决set，两方面综合起来很麻烦，
 * 而且本身这种东西就是容易误导人或者说难以理清的写法，禁止是最好的考量
 */
export const protoPointStoreErrorHandle = (receiver: any, store: any) => {
  if (__DEV__ && receiver !== store) {
    console.error(
      "Warning: It is not recommended that store be inherited as a prototype object," +
      " because there is no this pointing to the target object corresponding to the Reflect proxy within store!"
    );
  }
};
