<div align="center">
<h1>resy</h1>

**Re**act **st**ate **ea**sy

<h1>一款简单的react状态管理器</h1>
</div>

---

## Introduction
<p>
resy 的特点：<br/>
1、支持hook组件与class组件<br/>
2、自动细粒度更新，哪里使用数据参与渲染哪里更新，避免了re-render<br/>
3、掌握easy，学习成本几乎为0
</p>

## Install
```sh
npm i resy
```

## Usage

```tsx
/**
 * 总体概览：
 * resy有五个API，分别是：
 *
 *          resy：用于生成一个全局状态数据的存储容器
 *
 *    resyUpdate：用于更新或者批量更新状态数据
 *
 * resySyncState：在异步操作更新数据之后需要同步获取最新数据的方法
 *
 *  resyListener：用于订阅监听resy生成的store数据的变化
 *
 * withResyStore：用于class组件获取resy生成的状态数据
 *
 */
import { resy, resyUpdate, resySyncState, resyListener } from "resy";
import { useEffect } from "react";

/**
 * 关于resy这个核心API的介绍：
 * 
 * @description A、resy这个核心API使用时，
 * 初始化状态编写的时候最好加上一个自定义的准确的范型类型，
 * 虽然resy会有类型自动推断，但是对于数据状态类型可能变化的情况下还是不够准确的
 *
 * @description B、 resy有第二个参数：unmountClear
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
  count: number,
  text: string,
  testObj: { name: string },
};
const store = resy<ResyStore>(
  {
    count: 0,
    text: "123qwe",
    testObj: { name: "Paul" },
  },
  // 第二个参数，默认为true
  // false,
);

function App() {
  // 注意：resy生成的store的数据读取（解构）需要在组件顶层使用，它本质上依然是useState该hook的调用
  const { count, text, testObj: { name } } = store;
  
  useEffect(() => {
    /**
     * @param listener 监听订阅的回调函数
     *
     * @param store 监听订阅具体的某一个store容器的数据状态变化
     *
     * @param listenerKey 监听的具体的某一个store容器的某一个数据字段的变化
     * 如果没有则默认监听store的任何一个数据的变化
     *
     * @return Callback 返回取消监听的函数
     */
    const cancelListener = resyListener((effectState, prevState, nextState) => {
      // effectState：当前变化的数据；prevState：变化之前的数据；nextState：变化之后的数据
      console.log("count", effectState, prevState, nextState);
    }, store, "count");
    
    // 取消订阅监听
    // cancelListener();
    return cancelListener;
  }, []);
  
  return (
    <>
      <p>{count}</p>
      <p>{text}</p>
      <p>{memoRes}</p>
      <p>{name}</p>
      <button
        onClick={() => {
          /**
           * 如下更新方式无效
           * 即不允许直接属性链式更新
           * 因为resy只代理映射了第一层的数据属性
           * 目前出于性能考量暂不深度递归代理
           */
          // store.testObj.name = "Jack";
          // 需要新值赋值
          store.testObj = {
            name: "Jack",
          };
        }}
      >
        名称按钮
      </button>
      <button
        onClick={() => {
          // 可以直接赋值更新
          // store.count++;
          // store.text = "456asd";
          /**
            * @description resyUpdate是为了批量更新孕育而出的方法
            * 但同样可以单次更新
            * 如果是在循环中更新
            * 则resyUpdate直接给callback
            * 在callback中写循环更新即可
            * 
            * @example A
            * resyUpdate(() => {
            *   store.count = 123;
            *   store.text = "updateText";
            * }, (dStore) => {
            *   // dStore：即deconstructedStore，已解构的数据，可安全使用
            *   // 可以理解dStore即为this.setState中的回调中的this.state
            *   // 同时这一点也弥补了hook组件中setState后没有回调获取最新数据的遗憾
            *   console.log(dStore);
            * });
            * @example B
            * resyUpdate(store, {
            *   count: 123,
            *   text: "updateText",
            * }, (dStore) => {
            *   console.log(dStore);
            * });
            */
          // resyUpdate(() => {
          //   store.count++;
          //   store.text = "456asd";
          // }, (dStore) => {
          //   console.log(dStore);
          // });
          /**
            * 异步操作更新数据之后如果紧接着就想拿到最新的数据值
            * 
            * 可以直接使用resySyncState(store)即可获取到更新后的最新值
            * 
            * 也可以通过回调函数的方式来获取最新数据
            */
          resyUpdate(store, {
            count: count++,
            text: "456asd",
          }, (dStore) => {
            console.log(dStore);
          });
          /**
            * 与valtio使用了相反的使用模式，valtio是在组件顶层使用自定义hook包裹组件
            * 使用useSnapshot进行驱动更新，而直接使用数据进行获取最新数据
            * 而这里我想着使用的简便化，就省略了驱动更新hook，而是使用了直接的数据解构
            * 相反的在需要获取同步最新数据的时候使用resySyncState进行获取
            */
          const latestState = resySyncState(store);
          console.log(latestState);
        }}
      >
        按钮+
      </button>
    </>
  );
}
```

## Re-render
```tsx
const store = resy({
  count: 123,
  text: "123qwe",
  countAddFun: () => store.count++,
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
      <button onClick={() => store.count--}>按钮-</button>
    </>
  );
}
```

## License
[MIT License](https://github.com/lsbFlying/resy/blob/master/LICENSE) (c) [刘善保](https://github.com/lsbFlying)

