import { _RE_DEV_SY_, USE_STORE_KEY } from "./static";
import type { State, ValueOf, MapType } from "./model";

/**
 * map转object
 * @description 解决回调参数如果是map的proxy代理的话无法做扩展运算的问题
 */
export function mapToObject<S extends State>(map: MapType<S>): S {
  return [...map.entries()].reduce((obj, [key, value]) => ((obj as S)[key] = value, obj), {}) as S;
}

/**
 * object转map
 * @description 相较于简洁的object.entries方式效率更高
 */
export function objectToMap<S extends State>(obj: S) {
  const map: MapType<S> = new Map();
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      map.set(key, obj[key]);
    }
  }
  return map;
}

// store传的不是由resy本身的createStore创建产生的store的错误处理
export function storeErrorHandle<S extends State>(store: S) {
  if (_RE_DEV_SY_ && !store[USE_STORE_KEY as keyof S]) {
    throw new Error("The store parameter is not created by resty's createStore！");
  }
}

// 数据更新参数报错处理
export function stateErrorHandle<S extends State>(
  stateParams: Partial<S>,
  fnName: "setState" | "syncUpdate" | "createStore",
) {
  if (
    _RE_DEV_SY_ && (
      (
        Object.prototype.toString.call(stateParams) !== "[object Object]"
        && Object.prototype.toString.call(stateParams) !== "[object Function]"
      )
    )
  ) {
    throw new Error(
      `resy's ${fnName}(...): takes an object of state variables to update or`
      + ` a function which returns an object of state variables.`
    );
  }
  if (
    _RE_DEV_SY_
    && Object.prototype.toString.call(stateParams) === "[object Object]"
    && (stateParams as Partial<S>)[USE_STORE_KEY as keyof S]
  ) {
    throw new Error(
      `resy's ${fnName}(...): takes a store of generated by resy's createStore that's has no update significance!`
    );
  }
}

/**
 * @description 很难想象什么样的复杂的逻辑需要处理函数属性的更新，
 * 更何况本身resy还要处理函数属性的this问题，
 * 所以这里就禁用函数属性的更新，并以报错处理提示开发人员
 */
export function fnPropUpdateErrorHandle<S extends State>(key: keyof S, val: ValueOf<S>) {
  if (_RE_DEV_SY_ && typeof val === "function") {
    throw new Error(
      `"${key as string}" is a function.`
      + " I didn't expect the scenario where function attributes need to be updated," +
      " and the this inside the function points to the problem and the complexity of type parsing," +
      " and because JavaScript itself is not a pure object-oriented language." +
      " so resy temporarily prohibits function update operations!"
    );
  }
}
