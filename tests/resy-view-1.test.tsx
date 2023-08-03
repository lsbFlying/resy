import React, { useEffect, useState } from "react";
import { test } from "vitest";
import { createStore, useStore, MapStateToProps, view } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

export type Store = {
  appTestState: string;
  classComTestState: string;
  hookComTestState: string;
  count: number;
  text: string;
  testComTestState: {
    name: string;
    age: number;
  };
  testObj: { name: string };
  hookBooleanTest: boolean;
};

const store = createStore<Store>({
  appTestState: "appTestState",
  classComTestState: "classComTestState",
  hookComTestState: "hookComTestState",
  count: 123,
  text: "123qwe",
  testComTestState: {
    name: "liushanbao",
    age: 18,
  },
  testObj: { name: "testObjName" },
  hookBooleanTest: false,
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

const PureClassCom = view(ClassCom)({ stores: store });

const HookCom = (props: MapStateToProps<Store>) => {
  // view会将store数据挂载到props上新增的state属性上
  const { hookComTestState, hookBooleanTest } = props.state;
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
    <div>
      View HookCom{hookComTestState}<br/>
      {
        hookBooleanTest && props.state.count !== 0
          ? <span>hook123</span>
          : <span>hook456</span>
      }
    </div>
  );
}

const PureHookCom = view(HookCom)({ stores: store });

interface TestComProps { testObj: { name: string } }
// 该组件测试view的深度对比功能
const TestCom = (props: MapStateToProps<Store, TestComProps>) => {
  // view会将store数据挂载到props上新增的state属性上
  const { testComTestState } = props.state;
  const { testObj } = props;
  
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    setCount(count + 1);
    console.log("useEffect", testComTestState)
  }, [testComTestState, testObj]);
  
  console.log("PureTestCom", testComTestState);
  return (
    <div>
      <span>count：{count}</span>
      <span>testObj：{testObj.name}</span>
      name：{testComTestState.name}-age：{testComTestState.age}
    </div>
  );
}

const PureTestCom = view<TestComProps, Store>(TestCom)({
  stores: store,
  equal: (next, prev) => {
    const { props: nextProps, state: nextState } = next;
    const { props: prevProps, state: prevState } = prev;
    if (
      prevProps.testObj.name === nextProps.testObj.name
      || (
        prevState.testComTestState.name === nextState.testComTestState.name
        && prevState.testComTestState.age === nextState.testComTestState.age
      )
    ) {
      console.log(123);
      return true;
    }
    console.log(456);
    return false;
  },
});

const TestCom2 = (props: MapStateToProps<Store, TestComProps>) => {
  // view会将store数据挂载到props上新增的state属性上
  const { testComTestState } = props.state;
  const { testObj } = props;
  
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    setCount(count + 1);
  }, [testComTestState, testObj]);
  
  console.log("PureTestCom2");
  
  return (
    <div>
      <span>count2：{count}</span>
      <span>testObj2：{testObj.name}</span>
      name2：{testComTestState.name}-age2：{testComTestState.age}
    </div>
  );
}

const PureTestCom2 = view<TestComProps, Store>(TestCom2)({ stores: store });

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

test("resy-view-1", async () => {
  
  const App = () => {
    const {
      appTestState, classComTestState, hookComTestState, testObj,
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
      store.hookBooleanTest = true;
    }
    console.log("App");
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
        <div onClick={appTestClick}>app-btn</div>
        <p>{classComTestState}</p>
        <div onClick={classComTestStateClick}>class-btn</div>
        <p>{hookComTestState}</p>
        <div onClick={hookComTestStateClick}>hook-btn</div>
        <Text/>
        <Count/>
        <button onClick={() => { store.count = 0; }}>btn-zero</button>
        <button onClick={() => { store.setState({}); }}>btn-empty</button>
        <button onClick={() => {
          store.setState({
            testComTestState: { name: "liushanbao", age: 18 },
          });
        }}>viewDeepEqual-1</button>
        <button onClick={() => {
          store.setState({
            testObj: { name: "testObjName" },
            testComTestState: Object.assign({}, store.testComTestState),
          });
        }}>viewDeepEqual-2</button>
        <PureClassCom/>
        <PureHookCom/>
        <PureTestCom testObj={testObj}/>
        <PureTestCom2 testObj={testObj}/>
      </>
    );
  };
  
  const { getByText } = render(<App/>);
  
  fireEvent.click(getByText("app-btn"));
  await waitFor(() => {
    getByText(`Text：${store.appTestState}`)
    getByText("1099");
    getByText("classComTestState");
    getByText("hookComTestState");
  });
  
  fireEvent.click(getByText("class-btn"));
  await waitFor(() => {
    getByText("18756");
  });
  
  fireEvent.click(getByText("hook-btn"));
  await waitFor(() => {
    getByText("567");
    getByText("hook123");
  });
  
  fireEvent.click(getByText("btn-zero"));
  await waitFor(() => {
    getByText("hook456");
  });
  
  fireEvent.click(getByText("btn-empty"));
  await waitFor(() => {
    getByText("567");
  });
  
  fireEvent.click(getByText("viewDeepEqual-1"));
  await waitFor(() => {
    getByText("count：1");
    getByText("count2：2");
  });

  fireEvent.click(getByText("viewDeepEqual-2"));
  await waitFor(() => {
    getByText("count：1");
    getByText("count2：3");
  });
});
