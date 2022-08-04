<div align="center">
<h1>resy</h1>

**re**act **s**tate eas**y**

<h3>一款简单的react状态管理器</h3>
<h4>支持React Native、SSR、小程序（有平台兼容处理的如Taro、rax或remax等）</h4>

[![GitHub license](https://img.shields.io/github/license/lsbFlying/resy?style=flat-square)](https://github.com/lsbFlying/resy/blob/master/LICENSE)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/lsbFlying/resy/CI?color=red&style=flat-square)](https://github.com/lsbFlying/resy/actions?query=workflow%3ATest)
[![npm type definitions](https://img.shields.io/npm/types/typescript?color=orange&style=flat-square)](https://github.com/lsbFlying/resy/blob/master/src/index.ts)
[![npm](https://img.shields.io/npm/v/resy?color=blue&style=flat-square)](https://www.npmjs.com/package/resy)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/resy?color=brightgreen&style=flat-square)](https://bundlephobia.com/result?p=resy)

简体中文 · [English](./README-EN.md)
</div>

---

### 特点
- 支持hook组件与class组件 😎
- 细粒度更新，更完善的规避re-render 😎
- 易掌握，学习成本几乎为0 😎

### 安装
```sh
npm i resy

# yarn add resy
```

### 概览
resy需要react版本 v >= 16.8；resy有五个API，分别是：
- resy：生成一个全局状态数据的存储容器
- useResy：驱动组件更新的hook
- resyUpdate：更新或者批量更新数据
- resyListener：订阅监听resy生成的store数据的变化
- resyView：帮助组件具备 "更完善的规避re-render的方式" 的能力

### resy、useResy
```tsx
import { resy, useResy } from "resy";

/**
 * 关于resy这个核心API的介绍：
 *
 * @description 
 * A、resy这个核心API使用时，
 * 初始化状态编写的时候最好加上一个自定义的准确的范型类型，
 * 虽然resy会有类型自动推断，但是对于数据状态类型可能变化的情况下还是不够准确的
 *
 * B、resy有第二个参数：unmountClear
 * unmountClear参数主要是为了在某模块卸载的时候自动清除数据，
 * 恢复数据为初始化传入的state数据
 * 之所以会有unmountClear这样的参数设计是因为resy为了极简的使用便利性，
 * 一般是放在某个文件中进行调用返回一个store
 * 但是之后再进入该模块之后都是走的Node.js的import的缓存了，
 * 即没有再次执行resy这个核心api方法了，导致数据状态始终保持
 * 也就是在 "静态模板" 的实现方式下，resy这个核心api是不会再次运行的
 * 但这不是一个坏事儿，因为本身store作为一个全局范围内可控可引用的状态存储器而言，
 * 具备这样的能力是有益的
 * 比如登录后的用户信息数据作为一个全局模块都可公用分享的数据而言就很好的体现了这一点
 * 但这种全局真正公用分享的数据是相对而言少数的，
 * 大部分情况下是没那么多要全局分享公用的数据的
 * 所以unmountClear默认设置为true，符合常规使用即可，
 * 除非遇到像上述登录信息数据那样的全局数据而言才会设置为false
 */
// 数据范型类型接口
type ResyStore = {
  count: number;
  text: string;
  testObj: { name: string };
  testArr: { age: number }[];
  testFun: () => void;
};
// 生成的这个store可以全局共享，直接引入store即可
const store = resy<ResyStore>(
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
  // 第二个参数，默认为true
  // false,
);

function App() {
  /**
   * 或者：const snapshot = useResy(store);
   * snapshot.count; ...etc
   * 
   * useResy用于组件的驱动更新，
   * 如果不用useResy直接使用store，
   * 则只能获取最新数据无法驱动组件更新重新渲染
   */
  const {
    count, text, testObj: { name }, testArr, testFun,
  } = useResy(store);
  
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

### 直接更新
```tsx
import { useResy } from "resy";

function App() {
  const {
    count, text, testObj: {name}, testArr, testFun,
  } = useResy(store);
  
  function btn2() {
    /**
     * 1、可以直接赋值更新（最简单的更新方式）
     * 2、其次需要说明的是resy是具备自动批处理更新的，
     * 即你使用直接更新的方式会有自动批处理更新，如下：
     * store.count++;
     * store.text = "456asd";
     * 上述方式可以具备自动化批处理更新 
     */
    store.count++;
    store.text = "456asd";
    /**
     * 不允许直接属性链式更新
     * 因为resy只代理映射了第一层的数据属性
     * 目前出于性能考量暂不深度递归代理
     * 如下更新方式无效
     */
    // store.testObj.name = "Jack";
    // 需要新值赋值（有效更新）
    store.testObj = {
      name: "Jack",
    };
    /**
     * 同样，数组也不允许通过直接更改索引值的方式更新数据
     * 如下更新方式无效
     */
    // store.testArr[0] = { age: 7 };
    // 也需要新值赋值（有效更新）
    store.testArr = [{age: 7}];
    
    /**
     * 总结：基本数据类型可以直接赋值更新，引用数据类型的更新方式需要新的引用值
     * 那么可以使用新值直接覆盖更新，
     * 或者使用Object.assign/...扩展运算符等
     * 它们也是产生新的引用地址，也是新的数据值
     */
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

### resyUpdate 批量更新
```tsx
function App() {
  function btnClick() {
    /**
     * @description 
     * 1、resy保留了resyUpdate
     * 之所以说是保留是因为在resy <= v1.9.1版本之前
     * 如果在React18以下的非批处理领域还是需要使用resyUpdate来进行批处理更新
     * 但是在resy > v1.9.1版本之后则不需要，可以直接使用如下方式
     * store.count++;
     * store.text = "456asd";
     * 会自动会批处理更新，
     *
     * 保留resyUpdate的原因是出于它本身的使用方式在编码的时候具备很好的读写能力
     * 以及对象数据更新的便捷、可以直接写循环更新、具备的回调能力都让resyUpdate具备更强的生命力，所以仍然保留
     *
     * 2、resyUpdate是挂载在每一个resy生成的store数据上面的方法
     */
    // @example A
    store.resyUpdate({
      count: count++,
      text: "456asd",
    }, (state) => {
      // state：最新的数据值
      // 可以理解state即为"this.setState"的回调函数中的this.state
      // 同时这一点也弥补了：
      // hook组件中setState后只能通过useEffect来获取最新数据的方式
      console.log(state);
    });
    // B的方式可以在回调函数中直接写循环更新，更方便某些复杂的业务逻辑的更新
    // @example B
    // store.resyUpdate(() => {
    //   store.count++;
    //   store.text = "456asd";
    // }, (dStore) => {
    //   console.log(dStore);
    // });
  }
  
  return (
    <button onClick={btnClick}>按钮</button>
  );
}
```

### resyListener 订阅监听
```tsx
import { useEffect } from "react";
import { resyListener, useResy } from "resy";

function App() {
  const { count } = useResy(store);
  
  /**
   * 这里以函数组件举例
   * 如果是class组件可以在componentDidMount中使用resyListener
   */
  useEffect(() => {
    /**
     * @param listener 订阅监听的回调函数
     * @param store 订阅监听具体的某一个store容器的数据状态变化
     * @param listenerKeys 订阅监听的具体的某一个store容器的某些数据字段的变化
     * 如果为空则默认监听store的任何一个数据的变化
     * @return Callback 返回取消订阅监听的函数
     */
    const cancelListener = resyListener((
      effectState, prevState, nextState,
    ) => {
      /**
       * effectState：当前变化的数据
       *   prevState：变化之前的数据
       *   nextState：变化之后的数据
       */
      console.log(effectState, prevState, nextState);
    }, store, ["count", "text"]);
  
    // 取消订阅监听
    // cancelListener();
    return cancelListener;
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
import { resy, useResy } from "resy";

const store = resy({
  count: 123,
  text: "123qwe",
  countAddFun: () => {
    store.count++;
  },
});

// count数据状态的变化不会引起Text的re-render
function Text() {
  const { text } = useResy(store);
  return <p>{text}</p>;
}

// text数据状态的变化不会引起Count的re-render
function Count() {
  const { count } = useResy(store);
  return <p>{count}</p>;
}

/**
 * 没有额外的多余的渲染避免re-render不代表-"父组件渲染了子组件仍然不渲染"，
 * re-render是指：
 * 如果A、B同级别，同级别A的或者A的子级别组件的数据变化渲染了不会导致B组件渲染
 * 如果是父组件渲染了子组件在没有SCU或者useMemo的情况下必然渲染，毕竟只是仅仅额外避免了re-render，
 * 还不是像solid-js那样 "真正的react" 哪里变化 "更新" 哪里
 */
function App() {
  const { countAddFun } = useResy(store);
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

### resyView 更完善的规避re-render
```tsx
/**
 * @description resyView 的创建初衷：
 * resy本身是为hook而生的，但是还是需要对class组件进行支持
 * 毕竟class组件与hook组件不是非此即彼，class组件的存在还是很有必要的
 * class组件依然具有很好的性能与代码健壮读写能力(其实就性能而言class是高于hook)
 * hook可以认为是"react"的如虎添翼或者锦上添花，但是不能把class组件作为虎腿而卸掉
 * 至少目前来看二者两分天下才是对代码更友好健康的方式
 * 同时resy本身具备的规避re-render的特性一定程度上优化了渲染
 * 但是还不够完善，即父组件的更新依然会导致子组件无脑re-render
 * resyView就是为了解决这种问题，同时降低了开发者的心智负担
 * 相较于开发者额外确定class类组件的SCU或者Hook组件的useMemo
 * 所需要控制选择的属性数据字段这种心智负担而言，resyView可就太轻松了
 */
```

```tsx
// store 单独文件
import { resy } from "resy";

export type StoreType = {
  appTestState: string;
  classComTestState: string;
  hookComTestState: string;
  count: number;
  text: string;
  countAddFun: () => void,
};

const store = resy({
  appTestState: "appTestState",
  classComTestState: "classComTestState",
  hookComTestState: "classComTestState",
  count: 123,
  text: "123qwe",
  countAddFun: () => {
    store.count++;
  },
});

export default store;
```

```tsx
// resyView对class组件的支持

// ClassCom 类组件的单独文件
import React from "react";
import { resyView, ResyStateToProps } from "resy";
import store, { StoreType } from "store";

class ClassCom extends React.PureComponent<ResyStateToProps<StoreType>> {
  /**
   * 首先，store中的count与text、hookComTestState数据属性
   * 无法影响ClassCom的re-render
   * 其次父组件App的appTestState变化也无法影响ClassCom的re-render
   * 只有ClassCom本身引用的classComTestState数据才会影响自身的渲染
   *
   * 也就是说resyView形成的规避re-render的效果
   * 比resy本身自带的规避re-render的效果更完善
   */
  render() {
    // resyView会将store数据挂载到props上新增的state属性上
    const { classComTestState } = this.props.state;
    console.log(classComTestState);
    return (
      <div>{classComTestState}</div>
    );
  }
}

export default resyView(store, ClassCom);
```

```tsx
// resyView对hook组件的支持

// HookCom hook组件的单独文件
import React from "react";
import { resyView, ResyStateToProps } from "resy";
import store, { StoreType } from "store";

const HookCom = (props: ResyStateToProps<StoreType>) => {
  // resyView会将store数据挂载到props上新增的state属性上
  const { hookComTestState } = props.state;
  /**
   * 首先，store中的count与text、classComTestState数据属性
   * 无法影响HookCom的re-render
   * 其次父组件App的appTestState变化也无法影响HookCom的re-render
   * 只有HookCom本身引用的hookComTestState数据才会影响自身的渲染
   *
   * 也就是说resyView形成的规避re-render的效果
   * 比resy本身自带的规避re-render的效果更完善
   */
  console.log(hookComTestState);
  return (
    <div>{hookComTestState}</div>
  );
}

export default resyView(store, HookCom);
```

```tsx
import React from "react";
import { useResy } from "resy";

// count数据状态的变化不会引起Text的re-render
function Text() {
  const { text } = useResy(store);
  return <p>{text}</p>;
}

// text数据状态的变化不会引起Count的re-render
function Count() {
  const { count } = useResy(store);
  return <p>{count}</p>;
}

function App() {
  const {
    appTestState, classComTestState, hookComTestState, countAddFun,
  } = useResy(store);
  
  function appTestClick() {
    store.appTestState = `${Math.random()}~appTestState~`;
  }
  
  function classComTestStateClick() {
    store.classComTestState = `*${Math.random()}classComTestState*`;
  }
  
  function hookComTestStateClick() {
    store.classComTestState = `!${Math.random()}hookComTestState!`;
  }
  
  /**
   * 总结：相较于resy自身特性的re-render
   * resyView处理规避的re-render更加完善
   * 
   * 完善的点在于：
   * 首先明确的一点是，
   * resyView本就具备resy本身的规避re-render的特性
   * 其次完善的核心点在于，即使父组件更新了
   * 只要resyView包裹的组件本身
   * 没有使用到父组件中更新缘由的属性数据
   * 那么resyView包裹的组件就不会re-render
   */
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

