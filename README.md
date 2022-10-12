<div align="center">
<h1>resy</h1>

**re**act **s**tate eas**y**

<h3>一款简单的react状态管理器</h3>
<h4>支持React Native、SSR、小程序（有平台兼容处理的如Taro、rax或remax等）</h4>

[![GitHub license](https://img.shields.io/github/license/lsbFlying/resy?style=flat-square)](https://github.com/lsbFlying/resy/blob/master/LICENSE)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/lsbFlying/resy/CI?color=blue&style=flat-square)](https://github.com/lsbFlying/resy/actions/workflows/test.yml)
[![Codecov](https://img.shields.io/codecov/c/github/lsbFlying/resy?style=flat-square)](https://codecov.io/gh/lsbFlying/resy)
[![npm type definitions](https://img.shields.io/npm/types/typescript?color=orange&style=flat-square)](https://github.com/lsbFlying/resy/blob/master/src/index.ts)
[![npm](https://img.shields.io/npm/v/resy?color=blue&style=flat-square)](https://www.npmjs.com/package/resy)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/resy?color=brightgreen&style=flat-square)](https://bundlephobia.com/result?p=resy)

简体中文 · [English](./README-EN.md)
</div>

---

### 特点
- 支持hook组件与class组件 😎
- 细粒度更新，更完善地规避冗余的re-render 😎
- 简单易用，学习成本几乎为0 😎

### 安装
```sh
npm i resy

# yarn add resy
```

### 概览
resy需要react版本 v >= 16.8；resy有五个API，分别是：
- createStore：创建一个全局状态数据的存储容器
- useStore：从createStore生成的状态存储容器中使用state数据
- setState：更新数据
- subscribe：订阅监听createStore生成的store数据的变化
- pureView：帮助组件具备 "更完善的规避re-render的方式" 的能力

### createStore、useStore
```tsx
import { createStore, useStore } from "resy";

// 数据范型类型接口
type Store = {
  count: number;
  text: string;
  testObj: { name: string };
  testArr: { age: number }[];
  testFun: () => void;
};
// 生成的这个store可以全局共享，直接引入store即可
const store = createStore<Store>(
  {
    count: 0,
    text: "123qwe",
    testObj: { name: "Paul" },
    testArr: [{age: 12}, { age: 16 }],
    testFun: () => {
      store.count++;
      console.log("testFun");
    },
  },
  /**
   * 默认为true
   * true：默认模块卸载时自动恢复初始化数据状态
   * false：模块卸载时也不恢复初始化数据，保持数据状态
   * 常规使用场景设置为true即可
   * 特殊使用场景如login登录信息数据
   * 或theme主题数据属于全局状态数据可以设置为false
   */
  // false,
);

function App() {
  /**
   * useStore用于组件的驱动更新，如果不用useStore直接使用store，
   * 则只能获取纯数据而无法驱动组件更新重新渲染
   */
  const {
    count, text, testObj: { name }, testArr, testFun,
  } = useStore(store);
  
  // 或者: const state = useStore(store);
  // state.count; ...等等
  
  return (
    <>
      <p>{count}</p>
      <p>{text}</p>
      <p>{name}</p>
      <button onClick={testFun}>测试按钮</button><br/>
      {testArr.map(item => `年龄：${item}`)}
    </>
  );
}
```

```tsx
import { useMemo } from "react";
import { createStore, useStore } from "resy";

const initialState = {
  count: 123,
};

function App() {
  /**
   * 下面的使用方式，使得resy的useStore在效果上等价于react原生的useState
   */
  // 将store数据储存容器私有化
  const store = useMemo(() => createStore(initialState), []);
  
  const { count } = useStore(store);
  
  function addClick() {
    store.count++;
  }
  
  return (
    <>
      <p>{count}</p>
      <button onClick={}>测试按钮</button><br/>
    </>
  );
}
```

### 直接更新
```tsx
import { useStore } from "resy";

function App() {
  const {
    count, text, testObj: {name}, testArr, testFun,
  } = useStore(store);
  
  function btn2() {
    /**
     * 需要说明的是resy是具备自动批处理更新的
     * 且resy的批处理更新可以弥补React V18以下的版本
     * 在React管理不到的地方如Promise或者setTimeout等也有批处理更新的效果
     */
    // 可以直接赋值更新（最简单的更新方式）
    store.count++;
    store.text = "456asd";
    /**
     * 不允许直接属性链式更新，因为resy只代理映射了第一层的数据属性
     * 目前出于性能考量暂不深度递归代理，如下更新方式无效
     */
    // store.testObj.name = "Jack";
    // 需要新值赋值（有效更新）
    store.testObj = {
      name: "Jack",
    };
    // 同样，数组也不允许通过直接更改索引值的方式更新数据，如下更新方式无效
    // store.testArr[0] = { age: 7 };
    // 也需要新值赋值（有效更新）
    store.testArr = [{age: 7}];
  }
  
  return (
    <>
      <p>{count}</p>
      <p>{text}</p>
      <p>{name}</p>
      <button onClick={testFun}>测试按钮</button>
      <br/>
      {testArr.map(item => `年龄：${item}`)}<br/>
      <button onClick={btn2}>按钮2</button>
    </>
  );
}
```

### setState 更新数据
```tsx
function App() {
  function btnClick() {
    /**
     * 1、resy需要setState最主要的原因是需要setState的回调功能
     * 它的回调函数的参数是最新的数据，或者在回调函数中通过store.来获取最新数据
     * 因为resy的更新是异步的，于是需要同步获取数据时就需要setState的回调
     * 它相当于class组件中的this.setState的回调
     * 其次，setState本身的使用方式在编码的时候具备很好的读写能力、
     * 对象数据更新的便捷以及可以直接写循环更新的能力都让setState具备更强的生命力
     * 同时也弥补了hook数据状态异步更新后无法立即获取最新数据的缺憾
     *
     * 2、setState是挂载在每一个resy生成的store容器上面的方法
     */
    // @example A
    store.setState({
      count: count++,
      text: "456asd",
    }, (state) => {
      // state：最新的数据值
      // 可以理解state即为"this.setState"的回调函数中的this.state
      // 同时这一点也弥补了：
      // hook组件中setState后只能通过useEffect来获取最新数据的方式
      console.log(state.count, state.text);
      // 或者使用store.来获取最新数据值
      // console.log(store.count, store.text);
    });
    // B的方式可以在回调函数中直接写循环更新，更方便某些复杂的业务逻辑的更新
    // @example B
    // store.setState(() => {
    //   store.count++;
    //   store.text = "456asd";
    // }, (state) => {
    //   console.log(state.count, state.text);
    // });
  }
  
  return (
    <button onClick={btnClick}>按钮</button>
  );
}
```

### subscribe 订阅监听
```tsx
import { useEffect } from "react";
import { useStore } from "resy";

function App() {
  const { count } = useStore(store);
  
  // 这里以函数组件举例，如果是class组件可以在componentDidMount中使用
  useEffect(() => {
    /**
     * @description subscribe也是挂载在每一个resy生成的store容器上面的方法
     *
     * @param listener 订阅监听的回调函数
     * @param stateKeys 订阅监听的具体的某一个store容器的某些数据字段的变化
     * 如果为空则默认监听store的任何一个数据的变化
     * @return Unsubscribe 返回取消订阅监听的函数
     */
    const unsubscribe = store.subscribe((
      effectState, prevState, nextState,
    ) => {
      /**
       * effectState：当前变化的数据
       *   prevState：变化之前的数据
       *   nextState：变化之后的数据
       */
      console.log(effectState, prevState, nextState);
    }, ["count", "text"]);
    
    // 取消订阅监听
    // unsubscribe();
    return unsubscribe;
  }, []);
  
  function btnClickA() {
    store.count++;
  }
	
  function btnClickB() {
    store.text = "qweiop123";
  }
	
  function btnClickC() {
    store.count++;
    store.text = "098123kjhkhdfs";
  }
  
  return (
    <>
      <p>{count}</p>
      <button onClick={btnClickA}>按钮A</button><br/>
      <button onClick={btnClickB}>按钮B</button><br/>
      <button onClick={btnClickC}>按钮C</button>
    </>
  );
}
```

### resy自身特性的规避re-render
```tsx
import { createStore, useStore } from "resy";

const store = createStore({
  count: 123,
  text: "123qwe",
  countAddFun: () => {
    store.count++;
  },
});

// count数据状态的变化不会引起Text的re-render
function Text() {
  const { text } = useStore(store);
  return <p>{text}</p>;
}

// text数据状态的变化不会引起Count的re-render
function Count() {
  const { count } = useStore(store);
  return <p>{count}</p>;
}

/**
 * 没有额外的多余的渲染避免re-render不代表-"父组件渲染了子组件仍然不渲染"，
 * re-render是指：
 * 如果A、B同级别，同级别A的或者A的子级别组件的数据变化渲染了不会导致B组件渲染
 * 如果是父组件渲染了子组件在没有SCU或者useMemo的情况下必然渲染
 */
function App() {
  const { countAddFun } = useStore(store);
  return (
    <>
      <Text/>
      <Count/>
      <button onClick={countAddFun}>按钮+</button>
      <button
        onClick={() => {
          store.count--;
        }}
      >
        按钮-
      </button>
    </>
  );
}
```

### pureView 更完善的规避re-render
```markdown
    总结：相较于resy自身特性的re-render
        pureView处理规避的re-render更加完善
        完善的点在于：
        即使父组件更新了，只要pureView包裹的组件本身
        没有使用到父组件中更新缘由的属性数据
        那么pureView包裹的组件就不会re-render
```

```tsx
import { createStore } from "resy";

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

export default store;
```

```tsx
// pureView对class组件的支持
import React from "react";
import { pureView, ResyStateToProps } from "resy";
import store, { Store } from "store";

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
      <div>{classComTestState}</div>
    );
  }
}

export default pureView(store, ClassCom);
```

```tsx
// pureView对hook组件的支持
import React from "react";
import { pureView, ResyStateToProps } from "resy";
import store, { Store } from "store";

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
    <div>{hookComTestState}</div>
  );
}

export default pureView(store, HookCom);
```

```tsx
import React from "react";
import { useStore } from "resy";

// count数据状态的变化不会引起Text的re-render
function Text() {
  const { text } = useStore(store);
  return <p>{text}</p>;
}

// text数据状态的变化不会引起Count的re-render
function Count() {
  const { count } = useStore(store);
  return <p>{count}</p>;
}

function App() {
  const {
    appTestState, classComTestState, hookComTestState, countAddFun,
  } = useStore(store);
  
  function appTestClick() {
    store.appTestState = `${Math.random()}~appTestState~`;
  }
  
  function classComTestStateClick() {
    store.classComTestState = `*${Math.random()}classComTestState*`;
  }
  
  function hookComTestStateClick() {
    store.hookComTestState = `!${Math.random()}hookComTestState!`;
  }
  
  return (
    <>
      <div onClick={appTestClick}>{appTestState}</div>
      <div onClick={classComTestStateClick}>{classComTestState}</div>
      <div onClick={hookComTestStateClick}>{hookComTestState}</div>
      <Text/>
      <Count/>
      <button onClick={countAddFun}>按钮+</button>
      <button onClick={() => {
        store.count--;
      }}>按钮-</button>
      <br/>
      <ClassCom/>
      <HookCom/>
    </>
  );
}
```

### License
[MIT License](https://github.com/lsbFlying/resy/blob/master/LICENSE) (c) [刘善保](https://github.com/lsbFlying)

