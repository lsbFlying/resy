import React, {useEffect, useState} from "react";
import { expect, test } from "vitest";
import { createStore, useStore, MapStateToProps, view } from "../index";
import { fireEvent, render } from "@testing-library/react";
import { act } from "react-dom/test-utils";

export type Store = {
  appTestState: string;
  classComTestState: string;
  hookComTestState: string;
  count: number;
  text: string;
  countAddFun: () => void;
  testComTestState: {
    name: string;
    age: number;
  };
  testObj: { name: string };
};

const store = createStore<Store>({
  appTestState: "appTestState",
  classComTestState: "classComTestState",
  hookComTestState: "hookComTestState",
  count: 123,
  text: "123qwe",
  countAddFun: () => {
    store.count++;
  },
  testComTestState: {
    name: "liushanbao",
    age: 18,
  },
  testObj: { name: "testObjName" },
});

class ClassCom extends React.PureComponent<MapStateToProps<Store>> {
  /**
   * 首先，store中的count与text、hookComTestState数据属性
   * 无法影响ClassCom的re-render
   * 其次父组件App的appTestState变化也无法影响ClassCom的re-render
   * 只有ClassCom本身引用的classComTestState数据才会影响自身的渲染
   *
   * 也就是说view形成的规避re-render的效果
   * 比resy本身自带的规避re-render的效果更完善
   */
  render() {
    // view会将store数据挂载到props上新增的state属性上
    const { classComTestState } = this.props.state;
    console.log(classComTestState);
    return (
      <div>View ClassCom{classComTestState}</div>
    );
  }
}

const PureClassCom = view(store, ClassCom);

const HookCom = (props: MapStateToProps<Store>) => {
  // view会将store数据挂载到props上新增的state属性上
  const { hookComTestState } = props.state;
  /**
   * 首先，store中的count与text、classComTestState数据属性
   * 无法影响HookCom的re-render
   * 其次父组件App的appTestState变化也无法影响HookCom的re-render
   * 只有HookCom本身引用的hookComTestState数据才会影响自身的渲染
   *
   * 也就是说view形成的规避re-render的效果
   * 比resy本身自带的规避re-render的效果更完善
   */
  console.log(hookComTestState);
  return (
    <div>View HookCom{hookComTestState}</div>
  );
}

const PureHookCom = view(store, HookCom);

const TestCom = (props: MapStateToProps<Store> & { testObj: { name: string } }) => {
  // view会将store数据挂载到props上新增的state属性上
  const { testComTestState } = props.state;
  const { testObj } = props;
  
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    setCount(count + 1);
    console.log("useEffect", testComTestState)
  }, [testComTestState]);
  
  /**
   * 该组件测试view的深度对比功能
   */
  console.log("PureTestCom", testComTestState);
  return (
    <div>
      <span>数量：{count}</span>
      <span>testObj：{testObj.name}</span>
      名字：{testComTestState.name}-年龄：{testComTestState.age}
    </div>
  );
}

const PureTestCom = view(store, TestCom, true);

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
      appTestState, classComTestState, hookComTestState, countAddFun, testObj,
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
     * view处理规避的re-render更加完善
     *
     * 完善的点在于：
     * 即使父组件更新了，只要view包裹的组件本身
     * 没有使用到父组件中更新缘由的属性数据
     * 那么view包裹的组件就不会re-render
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
        <button onClick={() => {
          store.setState({ testComTestState: { name: "liushanbao", age: 18 } });
        }}>viewDeepEqual</button>
        <button onClick={() => {
          store.setState({ testComTestState: { name: "liushanbao", age: 19 } });
        }}>viewDeepEqual2</button>
        <button onClick={() => {
          store.setState({ testObj: { name: "testObjName" } });
        }}>viewDeepEqual3</button>
        <button onClick={() => {
          store.setState({ testObj: { name: "qweiop" } });
        }}>viewDeepEqual4</button>
        <PureClassCom/>
        <PureHookCom/>
        <PureTestCom testObj={testObj}/>
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
  
  await act(() => {
    fireEvent.click(getByText("viewDeepEqual"));
  });
  expect(getByText("数量：1")).toBeInTheDocument();
  
  await act(() => {
    fireEvent.click(getByText("viewDeepEqual2"));
  });
  expect(getByText("数量：2")).toBeInTheDocument();
  
  await act(() => {
    fireEvent.click(getByText("viewDeepEqual3"));
  });
  expect(getByText("testObj：testObjName")).toBeInTheDocument();
  
  await act(() => {
    fireEvent.click(getByText("viewDeepEqual4"));
  });
  expect(getByText("testObj：qweiop")).toBeInTheDocument();
});
