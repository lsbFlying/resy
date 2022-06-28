<div align="center">
<h1>resy</h1>

**Re**act **st**ate **ea**sy

<h1>一款简单的react状态管理器</h1>
</div>

---

## Introduction
<p>
fork form resso, at the same time reference valtio
</p>

## Install
```sh
npm i resy
```

## Usage

```tsx
/**
 * resy有四个API，如下所示，
 * 常规情况下一般不需要复杂的运用到resyMemo/resyListener
 * 最常用的还是resy/resyUpdate与这两个api
 * 甚至到了React V18+的版本都不需要用resyUpdate这个api
 * resy完全可以融合使用react本身具有的hook使用
 * resyMemo的出现只是为了解决报错问题，后续会详细介绍
 */
import { resy, resyUpdate, resyMemo, resyListener } from "resy";
import { useEffect } from "react";

/**
 * @description A、初始化状态编写的时候最好加上一个自定义的准确的范型类型，
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
type ResyStore = {
  count: number,
  text: string,
  testObj: { name: string },
};
const store = resy<ResyStore>({
  count: 0,
  text: "123qwe",
  testObj: { name: "Paul" },
});

/**
 * resy 是自动细粒度更新，哪里使用属性数据参与渲染哪里更新，避免了re-render
 */
function App() {
  // store的数据读取（解构）需要在组件顶层使用，它本质上依然是useState该hook的调用
  const { count, text, testObj: { name } } = store;
  
  useEffect(() => {
    /**
     * @description resyListener的存在是必要的，它的作用并不类比于useEffect，
     * 而是像subscribe或者addEventListener的效果，监听订阅数据的变化，
     * 不会像effect那样初始化执行一次
     * 且核心关键点在于它可以监听不同store的数据变化
     * 并且它是更具数据的变化才触发执行
     * 并不会像useEffect那样进行数据前后的对比
     *
     * @param listener 监听订阅的回调函数
     *
     * @param store 监听订阅具体的某一个store容器的数据状态变化，
     * 无则默认监听resy产生的所有store的变化
     *
     * @param listenerKey 监听的具体的某一个store容器的某一个数据字段的变化
     *
     * @return Callback 返回取消监听的函数
     */
    const cancelListener = resyListener((
      effectState,
      prevState,
      nextState,
    ) => {
      console.log("count", effectState, prevState, nextState);
    }, store, "count");
    
    // 取消订阅监听
    // cancelListener();
    return cancelListener;
  }, []);
  
  /**
   * @description 对useMemo使用store属性读取导致报错hook使用规则的兼容，
   * 事实上只要不在useMemo中使用resy返回的store进行解构读取属性值就不会报错hook规则
   * 且useMemo中如果是返回的JSX/TSX也不会报错hook规则，
   * 我们尽量在useMemo中不使用resy的store的属性读取即可
   */
  const memoRes = resyMemo(store, (dStore) => {
    // console.log(dStore);
    // 传入store也是为了解构store生成安全的可读数据对象dStore
    const {count} = dStore;
    return `count:${count}`;
  }, [count]);
  
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
           * 即不允许直接属性链式更新，因为resy只代理映射了第一层的数据属性
           * 目前出于性能考量暂不深度递归代理，后续会再考虑是否深度递归代理
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
      <button onClick={() => {
        // 可以直接赋值更新
        // store.count++;
        // store.text = "456asd";
        
        /**
         * @description resyUpdate是为了批量更新孕育而出的方法，
         * 但同样可以单次更新，巧合的是React-v18中已经自动做了批处理更新，
         * 所以这里算是给v<18以下的React版本做一个兼容吧
         * 如果是在循环中更新，则resyUpdate直接给callback，
         * 在callback中写循环更新即可
         * @example A
         * resyUpdate(() => {
         *   store.count = 123;
         *   store.text = "updateText";
         * });
         * @example B1
         * resyUpdate(store, {
         *   count: 123,
         *   text: "updateText",
         * });
         * @example B2  (在B1的使用方式下可以衍生B2这种使用方式，通过回调回去最新数据)
         * resyUpdate(store, {
         *   count: 123,
         *   text: "updateText",
         * }, (dStore) => {
         *   // dStore：即deconstructedStore，已解构的数据，可安全使用
         *   console.log(dStore);
         * });
         */
        // resyUpdate(() => {
        //   store.count++;
        //   store.text = "456asd";
        // });
        /**
         * 异步操作更新数据之后如果紧接着就想拿到最新的数据值
         * 可以直接使用store.testObj即可获取到更新后的最新值
         * 
         * <------->resy中使用store[key]永远可以获取到最新数据<------->
         * 
         * 但是我们不建议这样获取最新数据
         * 可以通过B2的使用方式来获取最新数据
         */
        resyUpdate(store, {
          count: count++,
          text: "456asd",
        }, (dStore) => {
          console.log(dStore);
        });
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

