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
 * 同时完善了class组件自动避免rerender，并且特殊的是，它比resy本身针对hook的规避rerender的效果更强
 * withResyStore包裹的class类组件即使在其父组件更新渲染了，只要内部使用的数据没有更新，那么它本身不会rerender
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
  
  return () => {
    const [state, setState] = useState(dStoreProxy);
    
    useEffect(() => {
      return resyListener((effectState, _, nextState) => {
        // class组件内部使用到的数据属性字段数组
        const innerLinkUseFields = Array.from(dStoreSet);
        const effectStateFields = Object.keys(effectState);
        if (innerLinkUseFields.some(key => effectStateFields.includes(key as string))) {
          setState(nextState);
        }
      }, store);
    }, []);
    
    return <ClassComp state={state}/>;
  };
}
