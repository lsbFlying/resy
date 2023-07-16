<div align="center">
<img src="./resy-logo.svg" alt="resy">
<h3>A simple react state manager</h3>
<h4>Support React Native、Mini Apps (such as taro, rax, remax etc)</h4>

[![GitHub license](https://img.shields.io/github/license/lsbFlying/resy?style=flat-square)](https://github.com/lsbFlying/resy/blob/master/LICENSE)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/lsbFlying/resy/test.yml?branch=master&color=blue&style=flat-square)](https://github.com/lsbFlying/resy/actions/workflows/test.yml)
[![Codecov](https://img.shields.io/codecov/c/github/lsbFlying/resy?style=flat-square)](https://codecov.io/gh/lsbFlying/resy)
[![npm type definitions](https://img.shields.io/npm/types/typescript?color=orange&style=flat-square)](https://github.com/lsbFlying/resy/blob/master/src/index.ts)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/resy?color=brightgreen&style=flat-square)](https://bundlephobia.com/result?p=resy)
[![react](https://img.shields.io/badge/React-%3E%3D16.8.0-green.svg?style=flat-square)](https://img.shields.io/badge/React-%3E%3D16.0.0-green.svg?style=flat-square)
[![npm](https://img.shields.io/npm/v/resy?color=blue&style=flat-square)](https://www.npmjs.com/package/resy)

[comment]: <> ([![npm]&#40;https://img.shields.io/npm/dm/resy?style=flat-square&#41;]&#40;https://img.shields.io/npm/dm/resy?style=flat-square&#41;)
</div>

<details>
<summary>
<strong>changed logs - releases what's Changed</strong>
</summary>

🌟`v8.1.0`：<br/>
1. Improved the type support of this inside the function.
2. The proxy processing of store is optimized, and the security and stability of store are increased.
3. Optimization improves the check code.
4. Improve and optimize the processing of multiple store connection data of class components by view.
5. New api for restore reset data has been added.
6. Fixed a bug in useConciseState where the setState and syncUpdate update parameters
   of the store were missing errors for the store.

🌟`v8.0.0`：<br/>
1. Adjust the parameter position of the isDeepEqual function of "view",
   and adjust the position of the listener function parameter of the "subscribe" listening callback.
2. Due to the unfriendly usage of the useStoreWithRef API, it was removed.
3. Adjust and optimize the execution time of initialReset
   to make the reset logic more in line with intuitive expectations.
4. The use mode of "view" is changed to the use mode of currying to optimize the freedom of the use scene.
5. Adjusted and optimized the modularity of the scheduling system, making scheduling more coordinated.
   At the same time, removed the "\_\_privatization\_\_" internal configuration properties.
6. Improved the coordination of updates,
   and increased the absolute advantage of reading the latest value of data through the store.
7. Optimized scheduling batch processing for rendering.

🌟`v7.1.1`：<br/>
1. Fixed bug that did not correspond to the latest data parameters of setState's callback function.
2. Optimized scheduling adjustment for update batches of scheduler.
3. Improved the use of function types of the state parameter of setState.
4. Added useStoreWithRef support for not passing refData parameters.

🌟`v7.1.0`：<br/>
1. Added a new api for useStoreWithRef.

🌟`v7.0.0`：<br/>
1. Adjusted the timing of initialization reset data, change unmountReset to initialReset,
   fixed conflicts between reset execution and promise data reset.
2. Remove useStore hookInitialState params and fixed execution logic of viewInitialReset.
3. Improved the use of "this" context object in function data.
4. Improved the data storage and reading of additional stores in useConciseState.
5. Remove "react-fast-compare"
   and modify the parameter of the isDeepEqual function of view to the usage of a custom function

🌟`v6.0.0`：<br/>
1. Fixed the influence of adjusting the accessor get and set of the attribute description object
   on the inheritance of store.
2. Increase the use of the "this" context object within the function data.
3. Remove the functional compatibility of initialization parameters for "createStore" and "useConciseState".

🌟`v5.2.1`：<br/>
1. Release the call of useConciseStore to the set/sub/sync functions of store.

🌟`v5.2.0`：<br/>
1. Added a new function in useConciseState that can parse store attributes.

🌟`v5.1.3`：<br/>
1. Fix logical bug with inconsistent data reset and data usage scenarios.

🌟`v5.1.2`：<br/>
1. Fixed bug for data unloading and reset logic for full scene types.

🌟`v5.1.1`：<br/>
1. Fixed logical bug of "view" internal resetState.<br/>

🌟`v5.1.0`：<br/>
1. Add non-required function of "useConciseState" initialState parameters.<br/>

🌟`v5.0.1`：<br/>
1. Remove redundant and useless processing scheduling,
   simplify and improve the execution of scheduling batches.<br/>

🌟`v5.0.0`：<br/>
1. Optimized code to fix bug with incomplete data of batch-triggered subscription changes
   in setState mixing scenarios.<br/>
2. Fixed bug for the way createStore is used as the state of privatized data.<br/>
3. Added the "useConciseState" hook to simplify the "use of data state localization".<br/>
4. Added "syncUpdate" synchronous update api.<br/>
5. Compatible with many function return types.

🌟`v4.0.5`：<br/>
1. Improved merge updates for all mixed scenarios of setState and direct updates.

🌟`v4.0.4`：<br/>
1. Fixed direct update of bug that could not be updated in similar next round update batches in useEffect.<br/>
2. Optimize the execution of the "add" function in direct update mode.<br/>
3. Optimized merge updates in scenarios where direct updates are partially mixed with setState batch updates.

🌟`v4.0.3`：<br/>
1. Fixed the logic of comparing props of view's deepEqual to avoid the problem of components updating rendering
   due to different reference addresses of props<br/>
2. Improved and optimized the execution performance of data subscription listening "subscribe" code.

🌟`v4.0.2`：<br/>
1. Fixed processing bug with empty logical data for view's getDerivedStateFromProps.<br/>
2. Fixed bug that failed to update due to missing acquisition of data reference fields
   caused by possible complex reference logic within components of view packages

🌟`v4.0.1`：<br/>
1. Reduce the use of the hookInitialState initialization hook parameter of useStore
to set the corresponding key value multiple times, increase code efficiency.

🌟`v4.0.0`：<br/>
1. Starting from version v4.0.0, resy has officially entered a stage of stable development.
Api has been named and will not be changed easily.
At the same time, the code tends to be stable and strengthened.<br/>
🌟🌟🌟🌟🌟🌟You are welcome to use the website.🌟🌟🌟🌟🌟🌟

</details>

<details>
<summary>The reason for naming resy</summary>
First of all,the original meaning of "resy" is "react state easy",
and secondly,the internal data sharing of "resy" is not the transfer of data,
but the acquisition of atomized data from a unified store container for data regeneration,
more like a regeneration system,
which happens to take the name "resy"
formed by the combination of the first and last letters of the two letters.
</details>

### Features
- 😎 Create simple
- 😎 Sharing freedom
- 😎 Easy to use
- 😎 Can be global or local
- 😎 Fine-grained update
- 😎 Automate SCU and memo processing

### Install
```sh
npm i resy

# yarn add resy
# pnpm add resy
```

### Overview
resy requires the version of react v >= 16.8, resy has eight API, which are:

| API             | Description                                                  |
|-----------------|--------------------------------------------------------------|
| createStore     | Create a store container for global state                    |
| useStore        | Use state from the store container generated by createStore  |
| setState        | Update data                                                  |
| syncUpdate      | Synchronously update data                                    |
| restore         | reset store`s data, with re-render effect                    |
| useConciseState | Concise version of useState                                  |
| subscribe       | Subscribe for changes in store data generated by createStore |
| view            | Help components to automatically process SCU and memo        |

### Usage
```tsx
import { createStore, useStore } from "resy";

const store = createStore({ count: 0 });

function App() {
  const { count } = useStore(store);
  return (
    <>
      {count}
      <button onClick={() => store.count++}>+</button>
    </>
  );
}
```

[![Edit on CodeSandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/resy-igo13u?file=/src/App.js)

### createStore
```tsx
import { createStore } from "resy";

type StateType = {
  count: number;
  text: string;
  testObj: { name: string };
  testArr: { age: number }[];
  testFun(): void;
  testCount: 0,
  testText: "Hello-World",
};

// The generated store can be shared globally
const store = createStore<StateType>(
  {
    count: 0,
    text: "hello",
    testObj: { name: "Jack" },
    testArr: [{age: 12}, { age: 16 }],
    testFunc() {
      // store.count++;
      // store.setState({ count: store.count + 1 });
      // store.syncUpdate({ count: store.count + 1 });
      
      // this point store object, example:
      this.count++;
      this.setState({ count: this.count + 1 });
      this.syncUpdate({ count: this.count + 1 });
    },
  },
  {
    /**
     * It seems that this attribute configuration contradicts my viewpoint
     * that the store can be accessed globally,
     * It seems difficult for me to explain its function, but it is so sincere and simple.
     * Firstly, the store can indeed be accessed globally,
     * but it is an important issue when the data in this store can remain in a state.
     * Therefore, the "initialReset" configuration is designed to address this issue.
     * 
     * For example, if a topic configures such data, then you can set initialReset to true,
     * because the theme needs to exist all the time in the system,
     * it will never disappear, and so can data such as login information.
     * 
     * Generally speaking,
     * if it is not global persistent data such as theme or login,
     * we do not have to set initialReset.
     */
    initialReset: true,
  },
);
```

### useStore
```tsx
import React from "react";
import { useStore } from "resy";

function App() {
  /**
   * @description You can think of it as useState, but not exactly.
   * It is used to drive component updates re-render.
   * 
   * If you directly deconstruct the store for example: 
   * const { count } = store;
   * Only simple data will be obtained, which has no update effect
   */
  const {
    count, text, testObj: { name }, testArr, testFunc, inputValue,
  } = useStore(store);
  
  // or:
  // const state = useStore(store);
  // <p>{state.count}</p>
  
  function btn2() {
    // Updates can be assigned directly (simple update method)
    store.count++;
    store.text = "456asd";
    /**
     * Direct attribute chained updates are not allowed,
     * because resy only maps the data attributes of the first layer
     * Currently, there is no in-depth recursive agent for performance reasons.
     * The following update method is invalid.
     * 
     * This also inherits the idea of react updating data,
     * and has no feeling for chained updates.
     */
    // store.testObj.name = "Jack";
    store.testObj = { name: "Jack" }; // Effective update
    // Similarly, arrays are not allowed to update data by directly changing the index value,
    // and the following update method is invalid
    // store.testArr[0] = { age: 7 };
    store.testArr = [{age: 7}]; // Effective update
  }
  
  return (
    <>
      <p>{count}</p>
      <p>{text}</p>
      <p>{name}</p>
      <button onClick={testFunc}>btn1</button>
      <br/>
      {testArr.map(item => `Age：${item}`)}<br/>
      <button onClick={btn2}>btn2</button>
    </>
  );
}
```

### setState
```tsx
import React from "react";
import { useStore } from "resy";

function App() {
  const {
    count, text,
    // you can also deconstruct setState directly, or use store.setState,
    // and syncUpdate, subscribe, these two api are the same and will be introduced in detail later.
    // setState,
  } = useStore(store);
  
  function btnClick() {
    /**
     * setState and a single direct update are asynchronous,
     * the callback function of setState can obtain the latest data.
     *
     * setState use objects as the data update method to have more robust coding capabilities.
     * The update method of function input parameters makes setState more robust.
     */
    // @example A
    store.setState({
      count: 999,
      text: "BNM",
    }, nextState => {
      /**
       * @param nextState：The currently updated data, so the following value is 999, not 1000.
       * This is the very important feature of the nextState parameter.
       *
       * This is different from the this.setState of the class component in react.
       * This is determined by the characteristics of resy,
       * because the store of its own resy has the ability to obtain the latest data values,
       * so the ability to obtain periodic update results is particularly special,
       * and it is also important.
       */
      console.log(nextState.count); // 999
      // But you can get the final updated data results through store.
      console.log(store.count); // 1000
    });
    store.setState({
       count: 1000,
    }, nextState => {
      console.log(nextState.count); // 1000
    });
    /**
     * The B way can write more complex update logic in the function
     * Of course, you can say that I can write the logic of updating data before setState,
     * which is no problem, of course you can do it,
     * but this way only gives developers a higher degree of freedom to update data,
     * and if there is a very complex and general update logic,
     * then I can deal with it in a general function,
     * so that this general function can be used as a parameter of setState directly.
     */
    // @example B
    // store.setState(() => {
    //   // Returns the data object that will eventually be updated
    //   // through the calculation of complex business logic
    //   return {
    //     count: count + 1,
    //     text: "B-Way-setState-with-function",
    //   };
    // }, (nextState) => {
    //   console.log(nextState.count, nextState.text);
    // });
    /**
     * @example C
     * @description Although you can write your code in this way,
     * it is not recommended because this is not the trigger point for
     * the creation of setState's function arguments.
     * In fact, if you have business logic for circular updates,
     * you can also directly use "store.x = y" for a single update.
     */
    // store.setState(() => {
    //   store.count++;
    //   store.text = "C-Way-setState-with-function";
    //   return {};
    // });
  }
  
  return (
    <>
      <div>{count}</div>
      <div>{text}</div>
      <button onClick={btnClick}>btn</button>
    </>
  );
}
```

### syncUpdate
```tsx
import React from "react";
import { useStore, syncUpdate } from "resy";

function App() {
  const { inputValue } = useStore(store);
  
  function inputChange(event: React.ChangeEvent<HTMLInputElement>) {
    /**
     * be careful：The update of this controlled input/textarea needs to be updated synchronously,
     * otherwise, due to asynchronous updates such as "store.setState" or "store[key] = newValue",
     * it will cause input/textarea unable to input characters in languages other than English.
     * be careful："syncUpdate" is a helpless solution to the conflict between
     * resy update scheduling mechanism and react's update execution mechanism for text input.
     */
    store.syncUpdate({
      inputValue: event.target.value,
    });
    // @example B:
    // store.syncUpdate(() => {
    //   return {
    //     inputValue: event.target.value,
    //   };
    // });
    /**
     * @example C
     * @description Although you can write your code in this way,
     * it is not recommended because this is not the trigger point for
     * the creation of syncUpdate's function arguments.
     * In fact, if you have business logic for circular updates,
     * you can also directly use "store.x = y" for a single update.
     */
     // @example C:
     // store.syncUpdate(() => {
     //   store.inputValue = event.target.value;
     //   return {};
     // });
  }
  
  return (
    <input value={inputValue} onChange={inputChange}/>
  );
}
```

### useConciseState
```tsx
import React from "react";
import { useConciseState } from "resy";

const initialState = {
  count: 123,
  text: "hello-consice",
};

function App() {
  const {
    count, text, store, setState,
    // syncUpdate, subscribe,
  } = useConciseState(initialState);
  // useConciseState is equivalent to the following usage
  // const [count, setCount] = useState(123);
  // const [text, setText] = useState("hello-consice");
  
  console.log(store.count);
  
  function addClick() {
    setState({
      count: count + 1,
      text: "ASD",
    });
    /**
     * The store read by deconstruction from useConciseState
     * still has the effect of the store generated by createStore.
     * You can use store.setState/syncUpdate/subscribe.
     */
    // store.setState({
    //   count: count + 1,
    //   text: "ASD",
    // });
  }
  
  return (
    <>
      <div onClick={addClick}>{count}</div>
      <div>{text}</div>
    </>
  );
}
```

### subscribe
```tsx
import React from "react";
import { useEffect } from "react";
import { useStore } from "resy";

function App() {
  const { count } = useStore(store);
  
  // Here is an example of a function component.
  // If it is a class component, it can be used in componentDidMount.
  useEffect(() => {
    /**
     * @description subscribe is a method to mount on each store
     *
     * @param listener: subscription monitoring callback function
     * @param stateKeys: subscription listens for changes in certain data fields of a specific store.
     * If empty, default listens for changes in any one of the data in store.
     * @return Unsubscribe: unsubscribe to the function of listening
     */
    const unsubscribe = store.subscribe((
      effectState, prevState, nextState,
    ) => {
      /**
       * effectState：Currently changing data
       *   nextState：Data after change
       *   prevState：Data before change
       */
      console.log(effectState, prevState, nextState);
    }, ["count", "text"]);
    
    // unsubscribe();
    return () => {
      unsubscribe();
      // ... to do else anything
    };
  }, []);
  
  function btnClickA() {
    store.count++;
  }
	
  function btnClickB() {
    store.text = "control btn-b click update text state value";
  }
	
  function btnClickC() {
    store.setState({
      count: count + 1,
      text: "control btn-c click update text state value",
    });
  }
  
  return (
    <>
      <p>{count}</p>
      <button onClick={btnClickA}>btn-A</button><br/>
      <button onClick={btnClickB}>btn-B</button><br/>
      <button onClick={btnClickC}>btn-C</button>
    </>
  );
}
```

### avoid "redundant re-render"
```tsx
import React from "react";
import { createStore, useStore } from "resy";

const store = createStore({
  count: 0,
  text: "hello",
  countAddFun: () => {
    store.count++;
  },
});

// Changes in the state of count data will not cause re-render in Text
function Text() {
  const { text } = useStore(store);
  return <p>{text}</p>;
}

// Changes in the state of text data will not cause re-render in Count
function Count() {
  const { count } = useStore(store);
  return <p>{count}</p>;
}

function App() {
  const { countAddFun, name } = useStore(store);
  /**
   * updates to each other's data between text and count
   * will not affect the re-rendering of each other's components.
   * but after the state of their common parent component App, such as name has changed.
   * it will still force the re-rendering of the Text and Count components.
   * this kind of rendering is unnecessary. We can use "view" to avoid it.
   * continue to see the introduction to view in the next section.
   */
  return (
    <>
      <Text/>
      <Count/>
      <div>{name}</div>
      <button onClick={() => { store.name = "app"; }}>btn-name</button>
      <button onClick={countAddFun}>btn+</button>
      <button
        onClick={() => {
          store.count--;
        }}
      >
        btn-
      </button>
    </>
  );
}
```

### view
```markdown
view is an HOC of automatic memo and SCU,
it automatically avoids the extra re-render of the component.

A: the original intention of creation.
   resy itself is created for hook, but class components
still need to be supported. class components still have good
performance and code robustness as well as read and write capabilities.
so view itself is created to be compatible with the use of class components,
and it can still be used against hook components.

B: implementation principle.
   support for Comp components is achieved by wrapping class components
with a layer of hook and transforming them into hook components.
it naturally supports hook,Comp or hook components.

C: optimize rendering.
    view connects the store data generated by resy,
so that Comp components can share store. at the same time,
the Comp component is improved to automatically avoid extra re-render,
and the special. it is more effective in avoiding extra re-render
than the resy itself. that is, if the Comp component of the view package
updates the rendering even in its parent component. as long as the data
used internally is not updated, it will not render
itself and generate additional re-render.

D: Corey use.
    The use of Corey optimizes the degree of freedom of the scene.

Summary: compared with resy's own feature of avoiding extra re-render,
         view is more perfect for avoiding redundant re-render.
The perfect point is:
    Components wrapped by view,
    as long as the data in the parent component is not used.
    Then even if the parent component is updated,
    the component of the view package will not re-render.
```

```tsx
import React from "react";
import { useStore, MapStateToProps, view } from "resy";

/**
 * view is support for class components requires props.
 * You can write "MapStateToProps<StateType>"
 * in the paradigm of the component's inherited component PureComponent/ComponentMap.
 * The state data mounted on props can be used through this.props.state.
 */
class ClassCom extends React.Component<MapStateToProps<StateType>> {
  render() {
    const { count, text } = this.props.state;
    return (
      <div>{count}{text}</div>
    );
  }
}

const TestView = view(
  ClassCom,
  // You can customize the contrast function to control whether to update the rendering
  // It is similar to React.memo 's propsAreEqual.
  // (next, prev) => {
  //   const { props: nextProps, state: nextState } = next;
  //   const { props: prevProps, state: prevState } = prev;
  //   // some conditon
  //   if (xxx) {
  //     return true;
  //   }
  //   return false;
  // }
)(store);

function HookCom() {
  const { count, text } = useStore(store);
  return (
    <div>{count}{text}</div>
  );
}
const TestView2 = view(HookCom)();

// You can deal with hook components in the following ways
function HookCom2(props: MapStateToProps<StateType>) {
  const { count, text } = props.state;
  return (
    <div>{count}{text}</div>
  );
}
const TestView3 = view(HookCom2)(store);

/**
 * resy本身对于hook组件使用多个store天然支持
 * 比如直接在hook组件内部使用useStore去引用不同的store
 * 但是针对class组件去引用不同的store
 * 需要如下方式：
 */
const loginStore = createStore<{userName: string}>({ userName: "resy" });
const themeStore = createStore<{theme: "light" | "dark"}>({ theme: "light" });

class ClassCom2 extends React.Component<
  MapStateToProps<{ loginState: {userName: string}, themeState: {theme: "light" | "dark"} }>
> {
  render() {
    const { loginState: { userName }, themeState: { theme } } = this.props.state;
    return (
      <div>
         userName{userName}<br/>
         theme:{theme}
      </div>
    );
  }
}
const TestView4 = view(ClassCom2)({
   loginState: loginStore,
   themeState: themeStore,
});

/**
 * 1、name data update, will not cause TestView re-render
 * 2、name data update, will not cause TestView2 re-render
 */
function App() {
  const { countAddFun, name } = useStore(store);
  
  return (
    <>
      <Text/>
      <Count/>
      <TestView/>
      <TestView2/>
      <TestView3/>
      <TestView4/>
      <div>{name}</div>
      <button onClick={() => { store.name = "app"; }}>btn-name</button>
      <button onClick={countAddFun}>btn+</button>
      <button
        onClick={() => {
          store.count--;
        }}
      >
        btn-
      </button>
    </>
  );
}
```

### License
[MIT License](https://github.com/lsbFlying/resy/blob/master/LICENSE) (c) [刘善保](https://github.com/lsbFlying)

