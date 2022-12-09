<div align="center">
<h1>resy</h1>

**re**act **s**tate eas**y**

<h3>一款简单的react状态管理器</h3>
<h4>支持React Native、SSR、小程序（如Taro、rax或remax等）</h4>

[![GitHub license](https://img.shields.io/github/license/lsbFlying/resy?style=flat-square)](https://github.com/lsbFlying/resy/blob/master/LICENSE)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/lsbFlying/resy/CI?color=blue&style=flat-square)](https://github.com/lsbFlying/resy/actions/workflows/test.yml)
[![Codecov](https://img.shields.io/codecov/c/github/lsbFlying/resy?style=flat-square)](https://codecov.io/gh/lsbFlying/resy)
[![npm type definitions](https://img.shields.io/npm/types/typescript?color=orange&style=flat-square)](https://github.com/lsbFlying/resy/blob/master/src/index.ts)
[![npm](https://img.shields.io/npm/v/resy?color=blue&style=flat-square)](https://www.npmjs.com/package/resy)

简体中文 · [English](./README-EN.md)
</div>

---

##### 版本说明
<details>
<summary>changed logs</summary>

🌟`v5.0.0`：<br/>
1、优化了代码，修复了setState的混用场景的批量触发的订阅变化的数据不完备的bug；<br/>
2、修复了createStore作为私有化数据状态使用的的方式的bug；<br/>
3、新增了 "usePrivateStore" 钩子简化了状态数据私有化的使用方式；<br/>
4、新增了 "syncUpdate" 同步更新api；

🌟`v4.0.5`：<br/>
完善了setState与直接更新的所有混用场景的合并更新

🌟`v4.0.4`：<br/>
1、修复了直接更新在useEffect中相近的下一轮的更新批次中无法得到更新的bug<br/>
2、优化直接更新方式的add函数的执行<br/>
3、优化了直接更新与setState批量更新混用的场景中的合并更新

🌟`v4.0.3`：<br/>
1、修复了view的deepEqual的对比props的逻辑，避免了组件因为props的引用地址的不同产生额外更新渲染的问题；<br/>
2、完善优化了数据订阅监听"subscribe"代码的执行性能。

🌟`v4.0.2`：<br/>
1、修复了view的getDerivedStateFromProps的逻辑数据为空的处理bug；<br/>
2、修复了view包裹的组件内部可能的复杂引用逻辑导致的数据引用字段的获取缺失，进而导致的更新失效的bug；

🌟`v4.0.1`：修复了useStore的hookInitialState初始化hook参数的使用时，
可能存在的多次设置对应的key值问题

🌟`v4.0.0`：resy自v4.0.0版本开始，正式进入稳定发展的开始，api已完成命名不会轻易变更，
同时代码也趋于稳定与强化，欢迎大家使用🌟🌟🌟🌟🌟

</details>

### 特点
- 简单创建 😎
- 自由共享 😎
- 方便使用 😎
- 可全局也可局部 😎
- 细粒度更新 😎
- 更完善的规避冗余的re-render 😎

### 安装
```sh
npm i resy

# yarn add resy
```

### 概览
resy需要react版本 v >= 16.8；resy有七个API，分别是：
- createStore：创建一个全局状态数据的存储容器
- useStore：从createStore生成的状态存储容器中使用state数据
- usePrivateStore：该hook内部会自动执行createStore，将其创建的store变为私有化状态数据容器
- setState：更新数据
- syncUpdate：同步更新数据
- subscribe：订阅监听createStore生成的store数据的变化
- view：帮助组件具备 "更完善的规避re-render的方式" 的能力

### createStore、useStore、usePrivateStore
```tsx
import { createStore, useStore } from "resy";

// 数据范型类型接口
type Store = {
  count: number;
  text: string;
  testObj: { name: string };
  testArr: { age: number }[];
  testFun: () => void;
  inputValue: string;
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
    inputValue: "",
  },
  // 常规而言options配置项不需要配置，可不填
  {
    /**
     * 默认为true
     * true：默认模块卸载时自动恢复初始化数据状态
     * false：模块卸载时也不恢复初始化数据，保持数据状态
     * 常规使用场景设置为true即可
     * 特殊使用场景如login登录信息数据
     * 或theme主题数据属于全局状态数据可以设置为false
     */
    unmountReset: true,
    /**
     * @description 该参数主要是为了createStore创建的store成为私有化数据状态容器
     * 它可以用如下方式：
     * const privateStore = useMemo(() => createStore({ count: 0, text: "QWE }, { privatization: true }), []);
     * 或者： const privateStore = usePrivateStore({ count: 0, text: "QWE });
     * const { count, text, setState } = useStore(privateStore);  // 或者setState不解构直接使用store.setState
     * 作用实现其实就是原生的useState：
     * const [count, setCount] = useStore(privateStore);
     * const [text, setText] = useStore(privateStore);
     *
     * notes: privatization参数需要结合useMemo或者usePrivateStore使用才可以达到数据状态私有化的效果
     */
    privatization: false,
  },
);

function App() {
  /**
   * useStore用于组件的驱动更新，如果不用useStore直接使用store，
   * 则只能获取纯数据而无法驱动组件更新重新渲染
   */
  const {
    count, text, testObj: { name }, testArr, testFun, inputValue,
  } = useStore(store);
  
  // 或者: const state = useStore(store);
  // state.count; ...等等
  
  function inputChange(event: React.ChangeEvent<HTMLInputElement>) {
    /**
     * todo：这种受控input一类的输入框的更新需要同步更新
     * 否则由于store.setState或者store.xxx = newValue这种异步更新
     * 会导致输入文本域无法输入英文以外的语言字符文本
     * todo："syncUpdate" 算是resy更新调度机制与react本身针对文本输入的
     * 更新执行机制冲突的一个无奈的解决办法吧
     *
     * todo notes：react 本身，甚至是 react V18+ 的版本
     * 都存在异步更新导致输入不了英文以外的语言文本的问题
     * eg: (xxxpromise).then(() => { setState(xxx); });
     * 
     * todo：同时，同步更新也可以供给不喜欢用回调回去最新数据值的开发小伙伴使用
     * 因为它执行完之后可以通过store拿到最新的数据值进行下一步的业务逻辑处理
     */
    store.syncUpdate({
      inputValue: event.target.value,
    });
  }
  
  return (
    <>
      <p>{count}</p>
      <p>{text}</p>
      <p>{name}</p>
      <input value={inputValue} onChange={inputChange}/>
      <button onClick={testFun}>测试按钮</button><br/>
      {testArr.map(item => `年龄：${item}`)}
    </>
  );
}
```

```tsx
import { useMemo } from "react";
import { createStore, useStore, usePrivateStore } from "resy";
import { Form } from "antd";
import { FormInstance } from "antd/es/form";

const initialState = {
  count: 123,
  text: "QWE",
};

const store = createStore<{
  count: number;
  text: string;
  form?: FormInstance<{ sortNumber: number }>;
}>(initialState);

function App() {
  /**
   * 将store数据储存容器私有化
   * 下面的使用方式，使得resy的useStore在效果上等价于react原生的useState:
   * const [count, setCount] = useStore(privateStore);
   * const [text, setText] = useStore(privateStore);
   */
  // const privateStore = useMemo(() => createStore({ count: 0, text: "QWE }, { privatization: true }), []);
  // 上下这两句代码等效，usePrivateStore钩子是上面代码的实现
  // const privateStore = usePrivateStore(initialState);
  
  // 或者setState不解构直接使用store.setState
  // const { count, text, setState } = useStore(privateStore);
  /**
   * useStore同时还具有初始化数据的参数
   * 尽管createStore在传入初始化默认数据时已经有过默认数据
   * 但是如果初始化默认数据是需要某些hooks产生
   * 此时则需要使用useStore的第二个参数 ———— 初始化数据参数
   */
  const { count, form } = useStore(
    store,
    {
      form: Form.useForm<{ sortNumber: number }>()[0],
    },
  );
  
  function addClick() {
    store.count++;
    form?.setFieldsValue({
      sortNumber: 9999,
    });
  }
  
  return (
    <Form form={form} components={false}>
      <p>{count}</p>
      <button onClick={}>测试按钮</button><br/>
      <Form.Item name="sortNumber">
        <InputNumber/>
      </Form.Item>
    </Form>
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
     * A: 需要说明的是resy是具备自动批处理更新的
     * 且resy的批处理更新可以弥补React V18以下的版本
     * 在React管理不到的地方如Promise或者setTimeout等也有批处理更新的效果
     * 
     * B: 大多数情况下setState与单次直接更新都是异步的，
     * 但是有些极端少数情况会在中间某一批次的更新中变成同步更新，
     * 这样做是为了保证更新的流畅性与协调度。
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
     * 1、resy需要setState最主要的原因是需要回调callback获取更新后的最新数据
     * 以及setState本身的使用方式在编码的时候具备很好的读写能力，
     * 支持扩展运算符的对象数据更新的便捷、函数入参的循环更新的宽泛，
     * 都让setState具备更强的生命力
     *
     * 2、setState的批量更新跟直接更新一样也是异步的，
     * 所以需要回调函数callback的入参nextState来获取取最新数据，
     * 或者在回调内部直接通过读取store获取最新数据
     * 
     * 3、大多数情况下setState与单次直接更新都是异步的，
     * 但是有些极端少数情况会在中间某一批次的更新中变成同步更新，
     * 这样做是为了保证更新的流畅性与协调度
     */
    // @example A
    store.setState({
      count: count++,
      text: "456asd",
    }, (nextState) => {
      // state：最新的数据值
      console.log(nextState.count, nextState.text);
      // 或者此时也可以使用store.来获取最新数据值
      // console.log(store.count, store.text);
    });
    // B的方式可以在回调函数中直接写循环更新，更方便某些复杂的业务逻辑的更新
    // @example B
    // store.setState(() => {
    //   store.count++;
    //   store.text = "456asd";
    // }, (nextState) => {
    //   console.log(nextState.count, nextState.text);
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

### view 更完善的规避re-render
```markdown
总结：相较于resy自身规避额外re-render的特性
    view处理规避额外的re-render更加完善
完善的点在于：
    即使父组件更新了，只要view包裹的组件本身
    没有使用到父组件中更新缘由的属性数据
    那么view包裹的组件就不会re-render
```
```tsx
/**
 * view
 *
 * @param store resy生成的store数据状态储存容器
 * @param Comp 被包裹的组件
 * @param deepEqual props、state深度对比
 * 它会深对比props与state和之前的props、state状态进行对比
 * 是否开启需要开发者自己衡量所能带来的性能收益，常规情况下不需要开启此功能
 * 除非遇到很重量级的组件渲染很耗费性能则开启可以通过JS的计算减轻页面更新渲染的负担
 */
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
// view对class组件的支持
import React from "react";
import { view, MapStateToProps } from "resy";
import store, { Store } from "store";

/**
 * view对class组件的支持方式需要通过props
 * 可在组件的继承组件PureComponent/ComponentMap的范型中
 * 写StateToProps<Store>即可通过this.props.state使用
 * props上挂在的store中的state数据
 */
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
      <div>{classComTestState}</div>
    );
  }
}

export default view(store, ClassCom);
```

```tsx
// view对hook组件的支持
import React from "react";
import { view, MapStateToProps, useStore } from "resy";
import store, { Store } from "store";

/**
 * view对Hook组件的支持方式可以像class组件那样通过props
 * 也可以不用props直接在Hook组件中使用const { ... } = useStore(store);
 * 两者的效果是一样的，也是最简单方便的，这里举例一个props的例子
 * 实际开发中我们可以简化使用直接在Hook组件中使用const { ... } = useStore(store);
 */
const HookCom = (props: MapStateToProps<Store>) => {
  // view会将store数据挂载到props上新增的state属性上
  const { hookComTestState } = props.state;
  
  // 在Hook组件中可以直接使用，与props效果一样
  // const { hookComTestState } = useStore(store);
  
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
    <div>{hookComTestState}</div>
  );
}

export default view(store, HookCom);
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

