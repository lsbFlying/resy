import React, {useEffect, useState} from "react";
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
 * 同时完善了class组件的shouldComponentUpdate（SCU），让class组件自动避免rerender
 */
export function withResyStore<S extends ResyType>(store: S, Component: React.ComponentClass<WithResyStateToProps<S>>) {
  const dStore = store[getResySyncStateKey as any as string] as S;
  return function () {
    const [state, setState] = useState(dStore);
    
    useEffect(() => {
      return resyListener((_E, _P, nextState) => {
        setState(nextState);
      }, store);
    }, []);
    
    return <Component state={state}/>;
  };
}
