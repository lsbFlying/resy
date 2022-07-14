<div align="center">
<h1>resy</h1>

**Re**act **st**ate **ea**sy

<h1>一款简单的react状态管理器</h1>

[![GitHub license](https://img.shields.io/github/license/lsbFlying/resy?style=flat-square)](https://github.com/lsbFlying/resy/blob/master/LICENSE)
[![npm type definitions](https://img.shields.io/npm/types/typescript?color=orange&style=flat-square)](https://github.com/lsbFlying/resy/blob/master/src/index.ts)
[![npm](https://img.shields.io/npm/v/resy?color=blueviolet&style=flat-square)](https://www.npmjs.com/package/resy)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/resy?color=yellowgreen&style=flat-square)](https://bundlephobia.com/result?p=resy)
</div>

---

## 特点
- 支持hook组件与class组件
- 细粒度更新，更完善的规避re-render
- 易掌握，学习成本几乎为0

## 安装
```sh
npm i resy
```

## 概览
resy需要react版本 v >= 16.8；resy有五个API，分别是：
- resy：用于生成一个全局状态数据的存储容器
- resyUpdate：用于更新或者批量更新状态数据
- resySyncState：在异步操作更新数据之后需要同步获取最新数据的方法
- resyListener：用于订阅监听resy生成的store数据的变化
- resyView：帮助组件具备 "更完善的规避re-render的方式" 的能力

## resy 生成全局共享数据
```tsx
import React from "react";
import { resy } from "resy";

/**
 * 关于resy这个核心API的介绍：
 *
 * @description 
 * A、resy这个核心API使用时，
 * 初始化状态编写的时候最好加上一个自定义的准确的范型类型，
 * 虽然resy会有类型自动推断，但是对于数据状态类型可能变化的情况下还是不够准确的
 *
 * B、resy有第二个参数：unmountClear
 * unmountClear参数主要是为了在某模块卸载的时候自动清除初始化数据，
 * 恢复数据为初始化传入的state数据
 * 之所以会有unmountClear这样的参数设计是因为resy为了极简的使用便利性，
 * 一般是放在某个文件中进行调用返回一个store
 * 但是之后再进入该模块之后都是走的Node.js的import的缓存了，
 * 即没有再次执行resy方法了导致数据状态始终保持
 * 也就是在 "静态模板" 的实现方式下，函数是不会再次运行的
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
// 生成的这个store可以全局共享
const store = resy<ResyStore>(
  {
    count: 0,
    text: "123qwe",
    testObj: { name: "Paul" },
    testArr: [{age: 12}, { age: 16 }],
    testFun: () => { console.log("testFun") },
  },
  // 第二个参数，默认为true
  // false,
);

function App() {
  /**
   * 注意：resy生成的store的数据读取（解构）需要在组件顶层解构
   * 它本质上依然是useState的调用，而对于想要读取（解构）store
   * 的数据进行相关逻辑处理或者使用等，可以使用"resySyncState"
   * 该api可以获取最新的安全的数据供开发使用，后续详细介绍
   * store本身数据的读取或解构是用于驱动组件更新
   */
  const {
    count, text, testObj: { name }, testArr, testFun,
  } = store;
  
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

## 赋值更新
```tsx
function App() {
  const {
    count, text, testObj: { name }, testArr, testFun,
  } = store;
  
  function btn2() {
    // 可以直接赋值更新（最简单的更新方式）
    store.count = count + 1;
    /**
     * 注意：这里count的number类型的更新不建议使用自增/自减运算符
     * 比如store.count++或者store.count--等；
     * 因为在"resy 生成全局共享数据"这一块有过说明
     * resy本身生成的全局状态数据的本质还是useState的使用
     * 它需要符合react的hook调用时序规则
     * 但是store.count++或者store.count--这种方式依然有效
     * 是因为resy本身对这种方式做了兼容的处理，但是推荐
     * store.count = count + 1;或者store.count = count - 1;
     * 这样安全更新使用
     */
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
    store.testArr = [{ age: 7 }];
    
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
      <button onClick={testFun}>测试按钮</button><br/>
      {testArr.map(item => `年龄：${item}`)}<br/>
      <button onClick={btn2}>按钮2</button>
    </>
  );
}
```

## resyUpdate 批量更新
```tsx
import { resyUpdate } from "resy";

function App() {
  
  function btnClick() {
    /**
     * @description resyUpdate是为了批量更新孕育而出的方法
     * 但同样可以单次更新，如果是在循环中更新
     * 则resyUpdate直接给callback，在callback中写循环更新即可
     */
    // @example A
    resyUpdate(store, {
      count: count + 1,
      text: "456asd",
    }, (dStore) => {
      // dStore：即deconstructedStore，已解构的数据，可安全使用
      // 可以理解dStore即为this.setState中的回调中的this.state
      // 同时这一点也弥补了：
      // hook组件中setState后只能通过useEffect来获取最新数据的方式
      console.log(dStore);
    });
    // B的方式可以在回调函数中直接写循环更新，更方便某些复杂的业务逻辑的更新
    // @example B
    // resyUpdate(store, () => {
    //   store.count = count + 1;
    //   store.text = "456asd";
    // }, (dStore) => {
    //   console.log(dStore);
    // });
  }
  
  return (
    <button onClick={btnClick}>resyUpdate更新按钮</button>
  );
}
```

## resySyncState 获取同步最新数据
```tsx
import { resySyncState } from "resy";

function App() {
  
  function btnClick() {
    /**
     * 如果是resyUpdate，可以有回调获取最新同步数据
     * 但是如果是单次更新也没有使用resyUpdate
     * 那么可以使用"resySyncState"这个api来获取最新同步数据
     * 
     * 同时这个api可以在"非驱动组件更新"(即非函数组件顶层)的任何地方使用
     * 来获取最新同步数据，进行相应的业务逻辑处理
     */
    store.text = "456asd";
    const latestState = resySyncState(store);
    console.log(latestState);
  }
  
  return (
    <button onClick={btnClick}>测试按钮</button>
  );
}
```

## resyListener 订阅监听
```tsx
import React, { useEffect } from "react";
import { resyListener } from "resy";

function App() {
  const { count } = store;
  
  useEffect(() => {
    /**
     * @param listener 监听订阅的回调函数
     * @param store 监听订阅具体的某一个store容器的数据状态变化
     * @param listenerKey 监听的具体的某一个store容器的某一个数据字段的变化
     * 如果没有则默认监听store的任何一个数据的变化
     * @return Callback 返回取消监听的函数
     */
    const cancelListener = resyListener((
      effectState, prevState, nextState,
    ) => {
      /**
       * effectState：当前变化的数据
       *   prevState：变化之前的数据
       *   nextState：变化之后的数据
       */
      console.log("count", effectState, prevState, nextState);
    }, store, "count");
  
    // 取消订阅监听
    // cancelListener();
    return cancelListener;
  }, []);
  
  function btnClick() {
    store.count = count + 1;
  }
  
  return (
    <>
      <p>{count}</p>
      <button onClick={btnClick}>测试按钮</button>
    </>
  );
}
```

## resy 自身特性的规避re-render
```tsx
import React from "react";
import { resy, resySyncState } from "resy";

const store = resy({
  count: 123,
  text: "123qwe",
  countAddFun: () => {
    const { count } = resySyncState(store);
    store.count = count + 1;
  },
});

// count数据状态的变化不会引起Text的re-render
function Text() {
  const { text } = store;
  return <p>{text}</p>;
}

// text数据状态的变化不会引起Count的re-render
function Count() {
  const { count } = store;
  return <p>{count}</p>;
}

/**
 * 没有额外的多余的渲染避免re-render不代表-"父组件渲染了子组件仍然不渲染"，
 * re-render是指：
 * 如果A、B同级别，同级别A的或者A的子级别组件的数据变化渲染了不会导致B组件渲染
 * 如果是父组件渲染了子级别必然渲染，毕竟只是仅仅额外避免了re-render，
 * 还不是像solid.js那样 "真正的react" 哪里变化 "更新" 哪里
 */
function App() {
  const { countAddFun } = store;
  return (
    <>
      <Text/>
      <Count/>
      <button onClick={countAddFun}>按钮+</button>
      <button onClick={() => {
        const { count } = resySyncState(store);
        store.count = count - 1;
      }}>按钮-</button>
    </>
  );
}
```

## resyView 更完善的规避re-render
```tsx
// store 单独文件（引用路径设定为xxx）
import { resy, resySyncState } from "resy";

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
    const { count } = resySyncState(store);
    store.count = count + 1;
  },
});

export default store;
```

```tsx
// resyView对class组件的支持

// ClassCom 类组件的单独文件（引用路径设定为yyy）
import React from "react";
import { resyView, ResyStateToProps } from "resy";
import store, { StoreType } from "xxx";

class ClassCom extends React.PureComponent<ResyStateToProps<StoreType>> {
  /**
   * 首先，store中的count与text、hookComTestState数据属性
   * 无法影响ClassCom的rerender
   * 其次父组件App的appTestState变化也无法影响ClassCom的rerender
   * 只有ClassCom本身引用的classComTestState数据才会影响自身的渲染
   *
   * 也就是说resyView形成的规避re-render的效果
   * 比resy本身自带的规避rerender的效果更完善
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

// HookCom hook组件的单独文件（引用路径设定为zzz）
import React from "react";
import { resyView, ResyStateToProps } from "resy";
import store, { StoreType } from "xxx";

const HookCom = (props: ResyStateToProps<StoreType>) => {
  // resyView会将store数据挂载到props上新增的state属性上
  const { hookComTestState } = props.state;
  /**
   * 首先，store中的count与text、classComTestState数据属性
   * 无法影响HookCom的rerender
   * 其次父组件App的appTestState变化也无法影响HookCom的rerender
   * 只有HookCom本身引用的hookComTestState数据才会影响自身的渲染
   *
   * 也就是说resyView形成的规避rerender的效果
   * 比resy本身自带的规避rerender的效果更完善
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
import store from "xxx";
import ClassCom from "yyy";
import HookCom from "zzz";

// count数据状态的变化不会引起Text的re-render
function Text() {
  const { text } = store;
  return <p>{text}</p>;
}

// text数据状态的变化不会引起Count的re-render
function Count() {
  const { count } = store;
  return <p>{count}</p>;
}

function App() {
  const {
    appTestState, classComTestState, hookComTestState, countAddFun,
  } = store;
  
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
        const { count } = resySyncState(store);
        store.count = count - 1;
      }}>按钮-</button>
      <br/>
      <ClassCom/>
      <HookCom/>
    </>
  );
}

/**
 * resyView 的创建初衷：
 * resy本身是为hook而生的，但是还是需要对class组件进行支持
 * 毕竟class组件与hook组件不是非此即彼，class组件的存在还是很有必要的
 * class组件依然具有很好的性能与代码健壮读写能力(其实就性能而言class是高于hook)
 * hook可以认为是react如虎添翼/锦上添花，但是不能把class组件作为虎腿而卸掉
 * 至少目前来看二者两分天下才是对代码更友好健康的方式
 * 同时resy本身具备的规避re-render的特性一定程度上优化了渲染
 * 但是还不够完善，即父组件的更新依然会导致子组件无脑re-render
 * resyView就是为了解决这种问题，同时降低了开发者的心智负担
 * 相较于开发者额外确定class类组件的SCU或者Hook组件的useMemo
 * 所需要控制选择的属性数据字段这种心智负担而言，resyView可就太轻松了
 */
```

## License
[MIT License](https://github.com/lsbFlying/resy/blob/master/LICENSE) (c) [刘善保](https://github.com/lsbFlying)

