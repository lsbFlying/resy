import React, { useEffect, useState } from "react";
import { ResyType, State } from "./model";
import { getResySyncStateKey } from "./static";
import { resyListener } from "./utils";

export interface WithResyStateToProps<T extends ResyType> extends State {
  state: T;
}

/**
 * withResyStore
 *
 * @description
 * A：通过将class组件包裹一层hook，转变成hook组件，从而实现对class组件的支持
 *
 * B：resy本身是为hook而生的，但是还是需要对class组件进行支持
 * 毕竟class组件与hook组件不是非此即彼，class组件的存在还是很有必要的
 * class组件依然具有很好的性能与代码健壮读写能力(其实就性能而言class是高于hook)
 * hook可以认为是react如虎添翼/锦上添花，但是不能把class组件作为虎腿而卸掉
 * 至少目前来看二者两分天下才是对代码更友好健康的方式
 *
 * C：withResyStore连接了resy生成的store数据，使得class组件可以共享store
 * 同时完善了class组件自动避免rerender
 */
export function withResyStore<S extends ResyType>(store: S, ClassComp: React.ComponentClass<WithResyStateToProps<S>>) {
  const dStore = store[getResySyncStateKey as any as string] as S;
  
  // dStore代理的Set
  const dStoreSet = new Set();
  
  // 给dStore做一个代理，从而让其知晓class组件内部使用了哪些数据
  const dStoreProxy = new Proxy(dStore, {
    get: (target: S, key: keyof S) => {
      dStoreSet.add(key);
      return target[key];
    },
  } as ProxyHandler<S>) as S;
  
  const HookComp = () => {
    const [state, setState] = useState(dStoreProxy);
    
    useEffect(() => {
      return resyListener((_, prevState, nextState) => {
        // console.log(dStoreSet);
  
        const prevStateKeys = Object.keys(prevState);
        const nextStateKeys = Object.keys(nextState);
        // if (
        //   [...dStoreSet].includes() && (
        //     nextStateKeys.length !== prevStateKeys.length ||
        //     nextStateKeys.some((key: keyof S) => prevStateKeys[key] !== nextStateKeys[key])
        //   )
        // ) {
        //   setState(nextState);
        // }
      }, store);
    }, []);
    
    return <ClassComp state={state}/>;
  };
  return HookComp;
}
