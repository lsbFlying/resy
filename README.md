<div align="center">
<img src="./resy-logo.svg" alt="resy">
<h3>A simple react state manager</h3>
<h4>Support React Native、Mini Apps (such as taro, rax, remax etc)</h4>

[![GitHub license](https://img.shields.io/github/license/lsbFlying/resy?style=flat-square)](https://github.com/lsbFlying/resy/blob/master/LICENSE)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/lsbFlying/resy/test.yml?branch=master&color=blue&style=flat-square)](https://github.com/lsbFlying/resy/actions/workflows/test.yml)
[![Codecov](https://img.shields.io/codecov/c/github/lsbFlying/resy?style=flat-square)](https://codecov.io/gh/lsbFlying/resy)
[![npm type definitions](https://img.shields.io/npm/types/typescript?color=orange&style=flat-square)](https://github.com/lsbFlying/resy/blob/master/src/index.ts)
[![react](https://img.shields.io/badge/React-%3E%3D16.8.0-green.svg?style=flat-square)](https://img.shields.io/badge/React-%3E%3D16.0.0-green.svg?style=flat-square)
[![npm](https://img.shields.io/npm/v/resy?color=blue&style=flat-square)](https://www.npmjs.com/package/resy)
</div>

<details>
<summary>
<strong>changed logs - releases what's Changed</strong>
</summary>

🌟`v8.0.0`：<br/>
1. Optimized the undefined situation when there may be some data in refData.
2. Adjust the parameter position of the isDeepEqual function of "view",
   and adjust the position of the listener function parameter of the "subscribe" listening callback.
3. Optimized the execution efficiency of view initial reset.
4. Added useConciseState and useStoreWithRef
   initialization parameter object laziness to create expensive object usage scene.

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
| useStoreWithRef | Upgraded version of useStore and fully compatible with useStore, private data references can be mounted to the global storage container |
| setState        | Update data                                                  |
| syncUpdate      | Synchronously update data                                    |
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

[![Edit on CodeSandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/heuristic-tesla-qcbspt)

### createStore
```tsx
import { createStore } from "resy";
import { FormInstance } from "antd/es/form";

type StateType = {
  count: number;
  text: string;
  testObj: { name: string };
  testArr: { age: number }[];
  testFun(): void;
  form?: FormInstance;
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
    testFun() {
      /**
       * You can use this inside the function to get the latest data values
       * Be careful: if it is an arrow function, this points to undefined.
       * You can also obtain data attributes through store.
       * eg: console.log(store.count);
       */
      console.log("testFunCount:", this.count === store.count);
      store.count++;
      // or:
      // this.count++;
      // Similarly, it`s equivalent to store.count++;
      // The sincere purpose of compatibility and support for this pointers is to correctly point to the initialization object "initialState"
      // and achieve intuitive this pointing.
      // So this doesn't have setState, syncUpdate, and subscribe functions.
    },
  },
  {
    /**
     * This parameter is mainly used to automatically reset the data
     * during the initialization phase of the mount of a certain module.
     * For example, it will be set to false
     * when it encounters global data like login information, theme, etc.
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
    count, text, testObj: { name }, testArr, testFun, inputValue,
  } = useStore(store);
  
  // Or: const state = useStore(store);
  // state.count; ...eg
  
  function btn2() {
    // Updates can be assigned directly (simple update method)
    store.count++;
    store.text = "456asd";
    /**
     * Direct attribute chained updates are not allowed,
     * because resy only maps the data attributes of the first layer
     * Currently, there is no in-depth recursive agent for performance reasons.
     * The following update method is invalid
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
      <button onClick={testFun}>btn1</button>
      <br/>
      {testArr.map(item => `Age：${item}`)}<br/>
      <button onClick={btn2}>btn2</button>
    </>
  );
}
```

### useStoreWithRef
```tsx
import React, { useEffect } from "react";
import { useStore, useStoreWithRef } from "resy";
import { Form, Input } from "antd";

function NameTemp() {
  /**
   * A、be careful: Because it is a reference, the data of refData in useStoreWithRef cannot be updated.
   * That is, you cannot write
   * "store.form = "newFormStr";",
   * "store.setState({ form: "newFormStr" });",
   * or "store.syncUpdate({ form: "newFormStr" })".
   * These updates are invalid and will throw an error.
   *
   * B、be careful: In addition, because reference data can be written in any component,
   * you may need to add "?." when referencing in other components.
   * so generally speaking, this type of reference data is marked with "?" data type,
   * that is it maybe undefined.
   */
  const { form } = useStore(store);
  
  return (
    <>
      <span>NameTemp</span><br/>
      <button
        onClick={() => {
          form?.setFieldsValue({ fullName: "NameTemp" });
          // Or you can use store to deconstruct form directly in other execution functions.
          // store.form?.setFieldsValue({ fullName: "NameTemp" });
        }}
      >
        btnName
      </button>
    </>
  );
}

function FormWrap() {
  const [formInstance] = Form.useForm();
  const { form } = useStoreWithRef(store, {
    /**
     * Mount the ref generated by Form.useForm() to the global data storage container
     * to facilitate reading in other components or execution functions.
     */
    form: formInstance,
  });
  return (
    <Form form={form}>
      <Form.Item name="fullName" label="YourName">
        <Input/>
      </Form.Item>
    </Form>
  );
}

function App() {
   const { form } = useStore(store);
   useEffect(() => {
     console.log(form?.getFieldsValue());
   }, []);
   return (
     <>
       <FormWrap/>
       <NameTemp/>
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
    // and syncUpdate, subscribe, these two api are the same.
    // setState,
  } = useStore(store);
  
  function btnClick() {
    /**
     * A: setState and a single direct update are asynchronous,
     * the callback function of setState can obtain the latest data.
     * setState uses objects as the data update method to have more robust coding capabilities.
     * The update method of function input parameters makes setState more robust.
     *
     * B: Resy has the effect of automatic batch updating.
     * It can make up for the effect of batch updating of versions below react v18
     * for promises or setTimeout that cannot be managed by react.
     */
    // @example A
    store.setState({
      count: count + 1,
      text: "BNM",
    }, (nextState) => {
      // nextState：The latest data
      console.log(nextState.count, nextState.text);
      /**
       * be careful, you can also read store to get the latest data.
       * 🌟🌟🌟🌟🌟: For "store." There are different opinions on the use of.
       * for example:
       * store.setState({
       *   testCount: 999,
       * }, (nextState) => {
       *   console.log("first", nextState.testCount, nextState.testText, store.testCount, store.testText);
       *   // first 999 Hello-World 999 Fine-World
       *   // 🌟🌟🌟🌟🌟
       *   // You can see that the store.testText prints the data Fine-World in the next round of updates,
       *   // while the testText in the callback function nextState of this update is still Hello-World,
       *   // which is the same as the this.setState in react's class component.
       *   // Whether reading data using nextState or store may not generate bug in the code of developers
       *   // who are not familiar with these features, which requires us to know enough about our own measurement.
       *   // 🌟🌟🌟🌟🌟
       *   // From the above description,
       *   // we can more deeply understand that reading data through store can always get the latest values,
       *   // so generally speaking,
       *   // we use useStore (store) and useStoreWithRef (store) to drive components to update rendering,
       *   // and read data through store ("store." Or deconstructing store) are all operations for business logic.
       * });
       * store.setState({
       *   testText: "Fine-World",
       * }, (nextState) => {
       *   console.log("second", nextState.testCount, nextState.testText, store.testCount, store.testText);
       *   // second 999 Fine-World 999 Fine-World
       * });
       */
      // console.log(store.count, store.text);
    });
    // The B way can write circular updates in the callback function
    // to facilitate the handling of some more complex business logic.
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
     *
     * be careful：react itself, even the version of react V18,
     * There is a problem that asynchronous updates make it impossible to input text in languages other than English.
     * eg: (xxxpromise).then(() => { setState(xxx); });
     *
     * be careful：At the same time, "syncUpdate" can also be used by development partners
     * who do not like to use callbacks to get the latest data.
     * Because after it is executed, it can get the latest data through store
     * for the next step of business logic processing.
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
    // be careful: you can get the latest data by read store.
    // this is different from setState
    // console.log(store.inputValue);
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
  text: "hello-rocket",
};

function App() {
  const {
    count, text, setState, store,
    // syncUpdate, subscribe,
  } = useConciseState(initialState);
  // useConciseState is equivalent to the following usage
  // const [count, setCount] = useState(0);
  // const [text, setText] = useState("QWE");
  
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
       *   prevState：Data before change
       *   nextState：Data after change
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
Summary: compared with resy's own feature of avoiding extra re-render,
         view is more perfect for avoiding redundant re-render.

The perfect point is:
    Components wrapped by view,
    as long as the data in the parent component is not used.
    Then even if the parent component is updated,
    the component of the view package will not re-render.

But at the same time,
    it should be noted that the starting point of "view" creation is to support class components.
    Its essence is to encapsulate the memo and useMemo in combination with the internal subscription of resy.
    So, just like react for memo or useMemo,
    resy's suggestions for "view" use are the same as that of react for memo and useMemo.
    The developer is expected to control it by himself.
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

// function HookCom(props: MapStateToProps) {
//   const { count, text } = props.state;
//   return (
//     <div>{count}{text}</div>
//   );
// }
/**
 * view supports Hook components in the same way as class components through props.
 * You can also deconstruct reading using useStore (store) directly in the Hook component.
 * The effect of the two is the same, but also more convenient.
 */
function HookCom() {
  const { count, text } = useStore(store);
  return (
    <div>{count}{text}</div>
  );
}

/**
 * view
 * @description Help components automatically handle high-level HOC of SCU and memo.
 * @param store: store generated by createStore
 * @param Comp: wrapped component
 * @param isDeepEqual: The depth comparison custom function can customize the depth comparison between props
 * and state and the previous props and state to determine whether to update the rendering re-render.
 */
// const TestView = view(store, HookCom);
const TestView = view(
  store,
  ClassCom,
  // You can customize the contrast function to control whether to update the rendering
  // (next, prev) => {
  //   const { props: nextProps, state: nextState } = next;
  //   const { props: prevProps, state: prevState } = prev;
  //   // some conditon
  //   if (xxx) {
  //     return true;
  //   }
  //   return false;
  // }
);

function App() {
  const { countAddFun, name } = useStore(store);
  
  return (
    <>
      <Text/>
      <Count/>
      {/* name data update, will not cause TestView re-render */}
      <TestView/>
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

