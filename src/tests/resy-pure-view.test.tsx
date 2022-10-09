import React, {useEffect} from "react";
import { expect, test } from "vitest";
import { createStore, useStore, ResyStateToProps, pureView } from "../index";
import { fireEvent, render } from "@testing-library/react";
import { act } from "react-dom/test-utils";

export type Store = {
  appTestState: string;
  classComTestState: string;
  hookComTestState: string;
  count: number;
  text: string;
  countAddFun: () => void,
};

const store = createStore({
  appTestState: "appTestState",
  classComTestState: "classComTestState",
  hookComTestState: "hookComTestState",
  count: 123,
  text: "123qwe",
  countAddFun: () => {
    store.count++;
  },
});

class ClassCom extends React.PureComponent<ResyStateToProps<Store>> {
  /**
   * 首先，store中的count与text、hookComTestState数据属性
   * 无法影响ClassCom的re-render
   * 其次父组件App的appTestState变化也无法影响ClassCom的re-render
   * 只有ClassCom本身引用的classComTestState数据才会影响自身的渲染
   *
   * 也就是说pureView形成的规避re-render的效果
   * 比resy本身自带的规避re-render的效果更完善
   */
  render() {
    // pureView会将store数据挂载到props上新增的state属性上
    const { classComTestState } = this.props.state;
    console.log(classComTestState);
    return (
      <div>PureView ClassCom{classComTestState}</div>
    );
  }
}

const PureClassCom = pureView(store, ClassCom);

const HookCom = (props: ResyStateToProps<Store>) => {
  // pureView会将store数据挂载到props上新增的state属性上
  const { hookComTestState } = props.state;
  /**
   * 首先，store中的count与text、classComTestState数据属性
   * 无法影响HookCom的re-render
   * 其次父组件App的appTestState变化也无法影响HookCom的re-render
   * 只有HookCom本身引用的hookComTestState数据才会影响自身的渲染
   *
   * 也就是说pureView形成的规避re-render的效果
   * 比resy本身自带的规避re-render的效果更完善
   */
  console.log(hookComTestState);
  return (
    <div>PureView HookCom{hookComTestState}</div>
  );
}

const PureHookCom = pureView(store, HookCom);

// count数据状态的变化不会引起Text的re-render
function Text() {
  const { text } = useStore(store);
  useEffect(() => {
    return store.subscribe((effectState) => {
      store.text = `Text：${effectState.appTestState}`;
    }, ["appTestState"]);
  }, []);
  return <p>{text}</p>;
}

// text数据状态的变化不会引起Count的re-render
function Count() {
  const { count } = useStore(store);
  useEffect(() => {
    return store.subscribe(() => {
      store.count = 1099;
    }, ["appTestState"]);
  }, []);
  return <p>{count}</p>;
}

test("resy-pure-view", async () => {
  
  const App = () => {
    const {
      appTestState, classComTestState, hookComTestState, countAddFun,
    } = useStore(store);
    
    useEffect(() => {
      return store.subscribe((effectState) => {
        if (effectState.classComTestState) {
          store.count = 18756;
        }
        if (effectState.hookComTestState) {
          store.text = "567";
        }
      });
    }, []);
  
    function appTestClick() {
      store.appTestState = `${Math.random()}~appTestState~`;
    }
  
    function classComTestStateClick() {
      store.classComTestState = `*${Math.random()}classComTestState*`;
    }
  
    function hookComTestStateClick() {
      store.hookComTestState = `!${Math.random()}hookComTestState!`;
    }
  
    /**
     * 总结：相较于resy自身特性的re-render
     * pureView处理规避的re-render更加完善
     *
     * 完善的点在于：
     * 即使父组件更新了，只要pureView包裹的组件本身
     * 没有使用到父组件中更新缘由的属性数据
     * 那么pureView包裹的组件就不会re-render
     */
    return (
      <>
        <p>{appTestState}</p>
        <div onClick={appTestClick}>app btn</div>
        <p>{classComTestState}</p>
        <div onClick={classComTestStateClick}>class btn</div>
        <p>{hookComTestState}</p>
        <div onClick={hookComTestStateClick}>hook btn</div>
        <Text/>
        <Count/>
        <button onClick={countAddFun}>btn+</button>
        <button onClick={() => { store.count--; }}>btn-</button>
        <button onClick={() => { store.setState({}); }}>btn empty</button>
        <PureClassCom/>
        <PureHookCom/>
      </>
    );
  };
  
  const { getByText } = render(<App />);
  
  await act(() => {
    fireEvent.click(getByText("app btn"));
  });
  expect(getByText(`Text：${store.appTestState}`)).toBeInTheDocument();
  expect(getByText("1099")).toBeInTheDocument();
  expect(getByText("classComTestState")).toBeInTheDocument();
  expect(getByText("hookComTestState")).toBeInTheDocument();
  
  await act(() => {
    fireEvent.click(getByText("class btn"));
  });
  expect(getByText("18756")).toBeInTheDocument();
  
  await act(() => {
    fireEvent.click(getByText("hook btn"));
  });
  expect(getByText("567")).toBeInTheDocument();
  
  await act(() => {
    fireEvent.click(getByText("btn empty"));
  });
  expect(getByText("567")).toBeInTheDocument();
});
