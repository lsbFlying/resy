<div align="center">
<h1>resy</h1>

**Re**act **st**ate **ea**sy

<h3>A simple react state manager</h3>

[![GitHub license](https://img.shields.io/github/license/lsbFlying/resy?style=flat-square)](https://github.com/lsbFlying/resy/blob/master/LICENSE)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/lsbFlying/resy/CI?color=red&style=flat-square)](https://github.com/lsbFlying/resy/actions?query=workflow%3ATest)
[![npm type definitions](https://img.shields.io/npm/types/typescript?color=orange&style=flat-square)](https://github.com/lsbFlying/resy/blob/master/src/index.ts)
[![npm](https://img.shields.io/npm/v/resy?color=blue&style=flat-square)](https://www.npmjs.com/package/resy)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/resy?color=brightgreen&style=flat-square)](https://bundlephobia.com/result?p=resy)

[简体中文](./README.md) · English
</div>

---

### Features
- Support hook components and class components 🪩
- Fine grained update, better avoid re-render 🪩
- Easy to master, and the learning cost is almost zero 🪩

### Install
```sh
npm i resy

# yarn add resy
```

### overview
Resy requires react version V >= 16.8; Resy has five APIs, which are:
- resy：Storage container for generating a global status data
- resyUpdate：Used to update or batch update status data
- resySyncState：The method of obtaining the latest data synchronously after asynchronously updating data
- resyListener：Used to subscribe and listen for changes in store data generated by resy
- resyView：Help components have the ability to "better avoid re-render"

### resy — Generate global shared data
```tsx
import React from "react";
import { resy } from "resy";

/**
 * About resy, the core API:
 *
 * @description 
 * A、When resy is used,
 * It is best to add a customized and accurate template type when writing the initialization state,
 * Although resy has automatic type inference, it is not accurate enough when the data state type may change
 *
 * B、Resy has the second parameter：unmountClear
 * The unmountclear parameter is mainly used to automatically clear data when a module is unloaded,
 * Restore the data to initialize the incoming state data.
 * The reason why there is a parameter design like unmountclear is that resy is for the convenience of minimalism,
 * Generally, it is called in a file to return a store,
 * However, after entering the module, the node will be left JS import cache,
 * That is, the core API method resy is not executed again, resulting in the data state being maintained all the time,
 * That is, under the implementation of "static template", resy, the core API, will not run again,
 * But this is not a bad thing, because as a globally controllable and referential state memory,
 * it is beneficial to have such a capability.
 * For example, the logged in user information data, as a data that can be shared by all global modules, well reflects this,
 * However, this kind of data that is truly shared by the whole world is relatively small,
 * In most cases, there is not so much data to share globally,
 * Therefore, unmountclear parameter is set to true by default, which is in line with normal use,
 * It will be set to false unless it encounters global data such as the login information data above.
 */
// Data paradigm type interface
type ResyStore = {
  count: number;
  text: string;
  testObj: { name: string };
  testArr: { age: number }[];
  testFun: () => void;
};
// The generated store can be shared globally and can be imported directly
const store = resy<ResyStore>(
  {
    count: 0,
    text: "123qwe",
    testObj: { name: "Paul" },
    testArr: [{age: 12}, { age: 16 }],
    testFun: () => { console.log("testFun") },
  },
  // The second parameter is true by default
  // false,
);

function App() {
  /**
   * Note: the data reading (deconstruction) of the store generated by resy needs to be deconstructed at the top level of the component first
   * Because it is still essentially a call to usestate, it is deconstructed at the top level of components to drive component rendering updates
   * For the data that you want to read (deconstruct) the store, perform relevant logical processing or use,
   * You can use "resysyncstate" - this API can obtain the latest secure data for development and use, which will be described in detail later.
   * At the same time, it also shows that the store generated by resy cannot be used for class components,
   * However, class components can be supported through resyview, which will be introduced in detail later.
   */
  const {
    count, text, testObj: { name }, testArr, testFun,
  } = store;
  
  return (
    <>
      <p>{count}</p>
      <p>{text}</p>
      <p>{name}</p>
      <button onClick={testFun}>Test Button</button><br/>
      {testArr.map(item => `Age：${item}`)}
    </>
  );
}
```

### Direct update
```tsx
function App() {
  const {
    count, text, testObj: { name }, testArr, testFun,
  } = store;
  
  function btn2() {
    // It can be updated by direct assignment (the simplest update method)
    store.count = count + 1;
    /**
     * Note: the auto increment / Auto decrement operator is not recommended for the update of number type of count here
     * For example, store.count++ or store.count-- etc;
     * Because it is explained in "resy generates global shared data"
     * The essence of global state data generated by resy itself is the use of usestate
     * It needs to conform to the hook call timing rules of react
     * But store.count++ or store.count-- this method is still effective
     * Because resy handles this method in a compatible way,
     * Recommend store count = count + 1; Or store count = count - 1;
     * In this way, the security update is used.
     */
    store.text = "456asd";
    /**
     * Direct attribute chain update is not allowed
     * Because resy proxy only maps the data attributes of the first layer
     * For performance reasons, deep recursive proxy is not currently available
     * The following update methods are invalid
     */
    // store.testObj.name = "Jack";
    // New value assignment required (valid update)
    store.testObj = {
      name: "Jack",
    };
    /**
     * Similarly, arrays are not allowed to update data by directly changing the index value
     * In this way, the security update is used.
     */
    // store.testArr[0] = { age: 7 };
    // Also need new value assignment required (valid update)
    store.testArr = [{ age: 7 }];
    
    /**
     * Summary: basic data types can be directly assigned and updated, and the update method of reference data types requires new reference values,
     * Then you can directly overwrite the update with the new value,
     * Or use object assign/... Extension operators etc,
     * They also generate new reference addresses and new data values.
     */
  }
  
  return (
    <>
      <p>{count}</p>
      <p>{text}</p>
      <p>{name}</p>
      <button onClick={testFun}>Test Button</button><br/>
      {testArr.map(item => `Age：${item}`)}<br/>
      <button onClick={btn2}>Button2</button>
    </>
  );
}
```

### resyUpdate — Batch update
```tsx
import { resyUpdate } from "resy";

function App() {
  
  function btnClick() {
    /**
     * @description resyupdate is a method conceived for batch update,
     * But it can also be updated in a single time. If it is updated in a cycle
     * then resyupdate directly to the callback, and write the cyclic update in the callback.
     */
    // @example A
    resyUpdate(store, {
      count: count + 1,
      text: "456asd",
    }, (dStore) => {
      // dStore：That is, the deconstructed store. The deconstructed data can be used safely
      // It can be understood that dStore is this in the callback function of "this.setstate" state
      // At the same time, this also makes up for:
      // In the hook component, the latest data can only be obtained through useeffect after setstate
      console.log(dStore);
    });
    // B way can directly write circular updates in the callback function,
    // which is more convenient for the update of some complex business logic
    // @example B
    // resyUpdate(store, () => {
    //   store.count = count + 1;
    //   store.text = "456asd";
    // }, (dStore) => {
    //   console.log(dStore);
    // });
  }
  
  return (
    <button onClick={btnClick}>Button</button>
  );
}
```

### resySyncState — Get the latest synchronized data
```tsx
import { resySyncState } from "resy";

function App() {
  
  function btnClick() {
    /**
     * If it is resyupdate, there can be a callback to get the latest synchronization data,
     * But if it is a single update, resyupdate is not used,
     * then you can use the API "resysyncstate" to get the latest synchronization data.
     * 
     * At the same time, this API can be used anywhere in the "non driven component update" (that is, the top level of non functional components)
     * To obtain the latest synchronization data and carry out corresponding business logic processing.
     */
    store.text = "456asd";
    const latestState = resySyncState(store);
    console.log(latestState);
  }
  
  return (
    <button onClick={btnClick}>Button</button>
  );
}
```

### resyListener — Subscription listening
```tsx
import React, { useEffect } from "react";
import { resyListener } from "resy";

function App() {
  const { count } = store;
  
  useEffect(() => {
    /**
     * @param listener: Callback function of subscription listening
     * @param store: Subscribe to monitor the data status changes of a specific store container
     * @param listenerKey: Subscribe to the change of a data field of a specific store container monitored
     * If not, the default is to listen for any data changes in the store.
     * @return Callback: Return the function of unsubscribing
     */
    const cancelListener = resyListener((
      effectState, prevState, nextState,
    ) => {
      /**
       * effectState：Current changing data
       *   prevState：Data before change
       *   nextState：Data after change
       */
      console.log("count", effectState, prevState, nextState);
    }, store, "count");
  
    // Unsubscribe
    // cancelListener();
    return cancelListener;
  }, []);
  
  function btnClick() {
    store.count = count + 1;
  }
  
  return (
    <>
      <p>{count}</p>
      <button onClick={btnClick}>Button</button>
    </>
  );
}
```

### resy — Avoidance of its own characteristics re render
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

// The change of count data state will not cause the re render of text
function Text() {
  const { text } = store;
  return <p>{text}</p>;
}

// Text the change of data status will not cause the re render of count
function Count() {
  const { count } = store;
  return <p>{count}</p>;
}

/**
 * No extra rendering to avoid re render does not mean - "the parent component renders the child component and still does not render",
 * Re render refers to:
 * If a and B are at the same level, the data of components at the same level a or sub level a is rendered, it will not lead to the rendering of B components,
 * If the parent component renders the child level, it must render. After all, it only avoids re render,
 * Not like solid JS, where the "real react" changes and "updates".
 */
function App() {
  const { countAddFun } = store;
  return (
    <>
      <Text/>
      <Count/>
      <button onClick={countAddFun}>Button +</button>
      <button
        onClick={() => {
          const { count } = resySyncState(store);
          store.count = count - 1;
        }}
      >
        Button -
      </button>
    </>
  );
}
```

### resyView — Better avoid re render
```tsx
// store single file
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
// resyview support for class components

// ClassCom single file
import React from "react";
import { resyView, ResyStateToProps } from "resy";
import store, { StoreType } from "xxx";

class ClassCom extends React.PureComponent<ResyStateToProps<StoreType>> {
  /**
   * First of all, count and text, hookcomteststate data attributes in the store
   * Cannot affect the rerender of classcom
   * Secondly, the change of the appteststate of the parent component app cannot affect the renewal of classcom
   * Only the classcomteststate data referenced by classcom itself will affect its rendering
   *
   * That is to say, resyview has the effect of avoiding re render
   * It is more perfect than resy's own effect of avoiding rerender
   */
  render() {
    // resyview will mount the store data to the new state attribute on props
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
// resyView support for hook components

// HookCom single file
import React from "react";
import { resyView, ResyStateToProps } from "resy";
import store, { StoreType } from "xxx";

const HookCom = (props: ResyStateToProps<StoreType>) => {
  // resyview will mount the store data to the new state attribute on props
  const { hookComTestState } = props.state;
  /**
   * First of all, count and text, classcomteststate data attributes in the store
   * Cannot affect hookcom's render
   * Secondly, the change of the appteststate of the parent component app cannot affect the renewal of hookcom
   * Only the hookcomteststate data referenced by hookcom itself will affect its rendering
   *
   * That is to say, resyview has the effect of avoiding rerender
   * It is more perfect than resy's own effect of avoiding rerender
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

// The change of count data state will not cause the re render of text
function Text() {
  const { text } = store;
  return <p>{text}</p>;
}

// Text the change of data status will not cause the re render of count
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
   * Summary: compared with resy's own characteristics, re render
   * Resyview handles circumvented re render more perfectly
   *
   * The perfection lies in:
   * The first thing is clear,
   * Resyview has the feature of avoiding re render of resy itself
   * Second, the core point of perfection is that even if the parent component is updated
   * As long as resyview wraps the component itself
   * The attribute data of the update reason is not used in the parent component
   * Then the components wrapped by resyview will not be re rendered
   */
  return (
    <>
      <div onClick={appTestClick}>{appTestState}</div>
      <div onClick={classComTestStateClick}>{classComTestState}</div>
      <div onClick={hookComTestStateClick}>{hookComTestState}</div>
      <Text/>
      <Count/>
      <button onClick={countAddFun}>Button +</button>
      <button
        onClick={() => {
          const { count } = resySyncState(store);
          store.count = count - 1;
        }}
      >
        Button -
      </button>
      <br/>
      <ClassCom/>
      <HookCom/>
    </>
  );
}

/**
 * resyview was created for:
 * Resy itself is born for hook, but it still needs to support class components
 * After all, class components and hook components are not either one or the other. The existence of class components is still necessary
 * Class components still have good performance and robust code reading and writing ability (in fact, class is higher than hook in terms of performance)
 * Hook can be regarded as be a tiger with wings added or the icing on the cake of react, but the class component cannot be removed as a tiger leg
 * At least for now, it's a more friendly and healthy way to code
 * At the same time, resy itself has the feature of avoiding re-render, which optimizes rendering to a certain extent
 * However, it is not perfect, that is, the update of parent components will still lead to mindless re render of child components
 * Resyview is designed to solve this problem and reduce the mental burden of developers
 * Compared with the developers, the usememo of SCU or hook components of class components is determined additionally
 * Resyview is too easy for the mental burden of controlling the selected attribute data fields
 */
```

### License
[MIT License](https://github.com/lsbFlying/resy/blob/master/LICENSE) (c) [刘善保](https://github.com/lsbFlying)
