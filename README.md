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
7. Improve and optimize the code, reduce the memory occupied by the code,
   and improve the execution efficiency of the code.
8. Added compatibility of update functions with null parameters.
9. Added the prevState parameter function of the function parameters of setState and syncUpdate.
10. Fixed bug for useStore initialization data.

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
| restore         | Reset store`s data, with re-render effect                    |
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
##### the store returned by createStore can be shared globally
```tsx
const demoStore1 = createStore({
  count: 0,
  text: "hello",
});
```

##### paradigm
createStore has automatic type inference,
but adding the identification of paradigm types
can make type recognition more accurate and perfect.
```tsx
type DemoStateType = { count: number; text?: number | string };
// In this way, the type of text can be more accurately identified as number or string or undefined
const demoStore2 = createStore<DemoStateType>({
  count: 0,
});
```

##### function return
you can return the initialization object through the function.
```tsx
const demoStore3 = createStore(() => {
  return {
    count: 0,
    time: Date.now(),
  };
});
```

##### initial function attribute
"this" pointers can be used inside the general function properties
in the initialization state properties,
and this points to the store object generated by createStore,
which has the ability to directly update data properties,
and some related methods above the store object.
The follow-up will be combined with the introduction of the relevant chapters for detailed understanding.
```tsx
const demoStore4 = createStore({
  count: 0,
  increase() {
    // this point store object, as follows example
    // The updates and usage of these APIs will be detailed in subsequent chapters
    this.count++;
    // this.setState({ count: this.count + 1 });
    // this.syncUpdate({ count: this.count + 1 });
    // this.restore();
    
    // demoStore3.count++;
    // demoStore3.setState({ count: demoStore3.count + 1 });
    // demoStore3.syncUpdate({ count: demoStore3.count + 1 });
  },
});
```

##### general use
```tsx
import { createStore } from "resy";

type StateType = {
  count: number;
  text: string;
  info: { name: string };
  ageList: { age: number }[];
  increase(): void;
  inputValue?: string;
};

// The generated store can be shared globally
const store = createStore<StateType>({
  count: 0,
  text: "hello",
  info: { name: "Jack" },
  ageList: [{age: 12}, { age: 16 }],
  increase() {
    this.count++;
  },
});
```

##### the global significance of store
<details>
<summary>about the initialReset settings item</summary>
    We usually think that the store of the state manager should be globally existed and shared all the time,
but in fact, in the process of development, the division of each module applied in our system is different from the existing stage.
Many times, some modules or most of the modules do not need to exist all the time, just like the view of the world in quantum mechanics,
so our every store state may not need to exist all the time. As a state manager,
the most important thing is how to share the state globally rather than exist globally all the time,
so the store of resy makes a separate design for this, for example,
the state of a module at a certain time is displayed at a certain stage at the current stage, with the switching of routes.
The module currently displayed in our system application will be the next unknown module to be displayed.
If we switch back to the previous module,
then the state display of the previous module should be the state presentation of this module at the time of initialization,
rather than the state presentation when it leaves before the routing switch.
This is my understanding of the general state presentation. At the same time, if it is separated from a certain module,
or there is a globally shared module, such as the user login information loginStore of the user login module,
or the global style themeStore. For this kind of real global store, it needs to exist all the time for the whole system application,
so we will set it to false through the initialReset setting item of the second parameter of createStore, otherwise,
the general module is set to true by default, and the initialReset setting item itself defaults to true.
Therefore, if it is not similar to the global state of login and theme, it generally does not need to be specially set.
</details>

##### createStore options item - initialReset
for states that need to exist globally, such as login or theme,
you need to set initialReset to true.
```tsx
const loginStore = createStore<{ userName: string; userId: number }>(
  {
    userName: "wenmu",
    userId: 0,
  },
  {
    initialReset: false,
  },
);
const themeStore = createStore<{ themeStyle: "dark" | "light" }>(
  {
    themeStyle: "dark",
  },
  {
    initialReset: false,
  },
);
```

### useStore
you can think of it as useState, but not exactly.
it is used to drive component updates re-render.<br/>

if you directly deconstruct the store for example:
<div>const { count } = store;</div>

only simple data will be obtained, which has no update render effect.

##### deconstruction usage mode
```tsx
import { useStore } from "resy";

function App() {
  const { count, text } = useStore(store);
  
  return (
    <>
      <p>{count}</p>
      <p>{text}</p>
    </>
  );
}
```

##### direct read usage mode
```tsx
import { useStore } from "resy";

function App() {
  const state = useStore(store);
  
  return (
    <>
      <p>{state.count}</p>
      <p>{state.text}</p>
    </>
  );
}
```

##### The method of deconstructing StoreUtils
the four methods of StoreUtils are setState, syncUpdate,
restore and subscribe, it can be deconstructed and used directly
from useStore, but store itself has these four methods,
which are described in more detail in the following sections.
```tsx
import { useStore } from "resy";

function App() {
  const {
    count, text,
    // The use of these api will be described in detail later.
    setState, syncUpdate, restore, subscribe,
  } = useStore(store);
  
  return (
    <>
      <p>{count}</p>
      <p>{text}</p>
    </>
  );
}
```

##### direct assignment update
```tsx
import { useStore } from "resy";

function App() {
  const { count, text } = useStore(store);
  
  // Updates can be assigned directly
  function btn2() {
    store.count++;
    store.text = "456asd";
  }
  
  return (
    <>
      <p>{count}</p>
      <p>{text}</p>
    </>
  );
}
```

##### Invalid update
direct attribute chained updates are not allowed,
because resy only maps the data attributes of the first layer.
currently, there is no in-depth recursive agent for performance reasons.
```tsx
import { useStore } from "resy";

function App() {
  const {
    info: { name }, ageList, inputValue,
  } = useStore(store);
  
  function btn2() {
    // store.info.name = "Jack";   // Invalid update
    // store.ageList[0] = { age: 7 };   // Invalid update
    
    store.info = { name: "Jack" }; // Effective update
    store.ageList = [{age: 7}];   // Effective update
  }
  
  return (
    <>
      <p>{name}</p>
      {ageList.map(item => `Age：${item}`)}<br/>
      <button onClick={btn2}>btn2</button>
    </>
  );
}
```

### setState
```tsx
import { useStore } from "resy";

function App() {
  const { count, text } = useStore(store);
  
  return (
    <>
      <div>{count}</div>
      <div>{text}</div>
      <button
        onClick={() => {
          store.setState({
            text: "demo-setState",
            count: count + 1,
          });
        }}
      >
        btn
      </button>
    </>
  );
}
```

##### setState's callback
```tsx
import { useStore } from "resy";

function App() {
  const { text } = useStore(store);
  
  return (
    <button
      onClick={() => {
        store.setState({
          text: "cur-text",
        }, nextState => {
          console.log(nextState.text === "cur-text"); // true
        });
      }}
    >
      {text}
    </button>
  );
}
```

##### parameters of callback for setState
the difference between the callback of setState
and the callback of this.setState of class components

* reading this.state in the callback function of this.setState
  in the class component obtains the latest data in the current round of updates.
```tsx
import { Component } from "react";

class TestClassX extends Component {
  state = { count: 0, text: "class-x" };
  
  render() {
    const { count, text } = this.state;
    return (
      <>
        {count},{text}
        <button
          onClick={() => {
            this.setState({
              text: "Try",
            }, () => {
              console.log(this.state.count === 9);  // true
            });
            this.setState({ count: 9 });
          }}
        >
          btn
        </button>
      </>
    );
  }
}
```  

* however, the nextState of the callback function
  of resy's setState is the latest data in the current synchronization phase,
  but it does not belong to the latest data after the final round of updates.
```tsx
import { useStore, createStore } from "resy";

const store = createStore({count: 0, text: "hello"});

function App() {
  const { text } = useStore(store);
  
  return (
    <button
      onClick={() => {
        store.setState({
          text: "cur-text",
        }, nextState => {
          console.log(nextState.text === "cur-text"); // true
          console.log(nextState.count === 0); // true
          console.log(store.count === 9); // true
        });
        store.setState({count: 9});
      }}
    >
      {text}
    </button>
  );
}
```

##### parameters of the function type of setState
```tsx
import { useStore } from "resy";

const store = createStore({count: 0, text: "hello"});

function App() {
  const { count, text } = useStore(store);
  
  function btnClick1() {
    store.setState(() => {
      // Returns the object that will eventually be updated
      // through the calculation of complex business logic
      return {
        count: count + 1,
        text: "B-Way-setState-with-function",
      };
    });
  }
  
  function btnClick2() {
    store.count = 9;
    // The prevState parameter of the function
    store.setState(prevState => {
      console.log(prevState.count === 0);  // true
      console.log(store.count === 9);  // true
      return {
        text: "ok",
      };
    });
  }
  
  return (
    <>
      <div>{count}</div>
      <div>{text}</div>
      <button onClick={btnClick1}>btn-1</button>
      <button onClick={btnClick2}>btn-2</button>
    </>
  );
}
```

### syncUpdate
the update of this controlled input/textarea needs to be updated synchronously,
otherwise, due to asynchronous updates such as "store.setState" or "store[key] = newValue",
it will cause input/textarea unable to input characters in languages other than English.
"syncUpdate" is a helpless solution to the conflict between
resy update scheduling mechanism and react's update execution mechanism for text input.
```tsx
import { useStore, syncUpdate } from "resy";

function App() {
  const { inputValue } = useStore(store);
  
  function inputChange(event: React.ChangeEvent<HTMLInputElement>) {
    store.syncUpdate({
      inputValue: event.target.value,
    });
    // @example B
    // store.syncUpdate(prevState => {
    //   // prevState is same as setState's prevState.
    //   return {
    //     inputValue: event.target.value,
    //   };
    // });
  }
  
  return (
    <input value={inputValue} onChange={inputChange}/>
  );
}
```

### subscribe
to some extent, we can use useEffect's dependency array to subscribe to data,
but resy's subscribe is actually slightly different from useEffect,
and it can also make up for and improve many functions that useEffect can't deal with.
```tsx
import { useEffect } from "react";
import { useStore } from "resy";

function App() {
  const { count } = useStore(store);
  
  // Here is an example of a function component.
  // If it is a class component, it can be used in componentDidMount.
  useEffect(() => {
    /**
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

### useConciseState
the existence of useConciseState is mainly for the improvement of state management
for data state localization and hook state simplification,
which makes up for most state management can only carry out large-scale module state management,
and makes up for and improve the lack of privatized processing capacity of local states.
at the same time, the most convenient and obvious core characteristic of useConciseState
is the coding mode of simplifying state processing.
```tsx
import { useConciseState } from "resy";

const initialState = {
  count: 123,
  text: "hello-consice",
};

function App() {
  const {
    count, text, setState,
  } = useConciseState(initialState);
  
  return (
    <>
      <div
        onClick={() => {
          setState({
             count: count + 1,
             text: "ASD",
          });
        }}
      >
        {count}
      </div>
      <div>{text}</div>
    </>
  );
}
```

restore、syncUpdate、subscribe these api can also be deconstructed and used directly.
```tsx
import { useEffect } from "react";
import { useConciseState } from "resy";

function App() {
  const {
    count, text, restore, syncUpdate, subscribe,
  } = useConciseState(initialState);
  
  useEffect(() => {
    return subscribe((effectState) => {
      console.log(effectState);
    }, ["text"]);
  }, []);
  
  return (
    <>
      <input
        value={text}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          syncUpdate({text: event.target.value});
        }}
      />
      <div onClick={() => restore()}>reset-btn</div>
      <div>{text}</div>
    </>
  );
}
```

* you can deconstruct and read store directly from useConciseState,
  and you can call various methods that store has through store,
  such as store.setState, store.syncUpdate, store.restore, store.subscribe.

* the greatest help of deconstructing reading store from useConciseState
  is to combat the dependency forgetting problem of hook's dependency array,
  because the data read from store is always up-to-date,
  so you don't have to worry about the mental burden caused by hook dependency array.
```tsx
import { useEffect, useMemo } from "react";
import { useConciseState } from "resy";

function App() {
  const {
    count, text, store,
  } = useConciseState(initialState);

  useEffect(() => {
    return store.subscribe((effectState) => {
      console.log(effectState);
    }, ["count"]);
  }, []);
  
  const countTemp = useMemo(() => {
    // don't worry if the dependency array is empty,
    // because the data read through store will always be up to date.
    return store.count + 9;
  }, []);
  
  return (
    <>
      <div onClick={() => restore()}>{countTemp}</div>
      <div onClick={() => { store.count++; }}>add-btn</div>
      <div onClick={() => { store.setState({ text: "ok" }) }}>{text}</div>
      <input
        value={text}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          store.syncUpdate({text: event.target.value});
        }}
      />
      <div onClick={() => store.restore()}>reset-btn</div>
    </>
  );
}
```

### Fine-grained update
updates to each other's data between text and count
will not affect the re-rendering of each other's components.
but after the state of their common parent component App, such as name has changed.
it will still force the re-rendering of the Text and Count components.
this kind of rendering is unnecessary. We can use "view" to avoid it.
continue to see the introduction to view in the next section.
```tsx
import { useStore } from "resy";

// changes in the state of count data will not cause re-render in Text
function Text() {
  const { text } = useStore(store);
  return <p>{text}</p>;
}

// changes in the state of text data will not cause re-render in Count
function Count() {
  const { count } = useStore(store);
  return <p>{count}</p>;
}

function App() {
  const { increase, name } = useStore(store);
  
  return (
    <>
      <Text/>
      <Count/>
      <div>{name}</div>
      <button onClick={() => { store.name = "app"; }}>btn-name</button>
      <button onClick={increase}>btn+</button>
      <button onClick={() => { store.count-- }}>btn-</button>
    </>
  );
}
```

### view
<details>
<summary>
view api summary
</summary>
view is a HOC of automatic memo and SCU,
it automatically avoids the extra re-render of the component.

A: the original intention of creation.<br/>

resy itself is created for hook, but class components
still need to be supported. class components still have good
performance and code robustness as well as read and write capabilities.
so view itself is created to be compatible with the use of class components,
and it can still be used against hook components.

B: implementation principle.<br/>

by wrapping class components with a layer of memo and transforming
them into hook components, support for class components can be realized.

C: optimize rendering.<br/>

view connects the store data generated by resy,
so that class components can share store. at the same time,
the component is improved to automatically avoid extra re-render,
and the special. it is more effective in avoiding extra re-render
than the resy itself. that is, if the component of the view package
updates the rendering even in its parent component. as long as the data
used internally is not updated, it will not render
itself and generate additional re-render.

D: corey use.<br/>

the use of Corey optimizes the degree of freedom of the scene.

E: characteristics: <br/>

1、support for class components.<br/>
2、support for class components to connect multiple store data.<br/>
3、automatically circumvents extra re-render.<br/>
</details>

##### support for class components
```tsx
import React from "react";
import { useStore, MapStateToProps, view } from "resy";

class ClassCom extends React.Component<MapStateToProps<StateType>> {
  render() {
    // The data is hung on the state property of the props of the class component
    const { count, text } = this.props.state;
    return (
      <div>{count}{text}</div>
    );
  }
}

const TestView = view(ClassCom)(store);
```

##### view for hook mode I
simply wrap the hook component, the internal useStore is still used normally.
because useStore is normally used inside the hook component,
so you don't need to fill in store in the return function of view.
```tsx
function HookCom() {
  const { count, text } = useStore(store);
  return (
    <div>{count}{text}</div>
  );
}
const TestView2 = view(HookCom)();
```

* name data update, will not cause TestView re-render
* name data update, will not cause TestView2 re-render
```tsx
function App() {
  const { increase, name } = useStore(store);
  
  return (
    <>
      <Text/>
      <Count/>
      <TestView/>
      <TestView2/>
      <div>{name}</div>
      <button onClick={() => { store.name = "app"; }}>btn-name</button>
      <button onClick={increase}>btn+</button>
      <button onClick={() => { store.count-- }}>btn-</button>
    </>
  );
}
```

##### view for hook mode II
you can also use the data hung on the state attribute of props
to complete the rendering execution,
but then you need to enter store in the return function of view,
as follows:
```tsx
function HookCom2(props: MapStateToProps<StateType>) {
  const { count, text } = props.state;
  return (
    <div>{count}{text}</div>
  );
}
const TestView3 = view(HookCom2)(store);
```

##### multiple store for class components
resy itself has natural support for the ability of hook components to use multiple store,
for example, you can use useStore directly inside the hook component to reference different store.
but refer to different store for class components, the following methods are required:
```tsx
import React from "react";

const loginStore = createStore<{ userName: string }>({
   userName: "resy",
});
const themeStore = createStore<{ theme: "light" | "dark" }>({
   theme: "light",
});

class ClassCom2 extends React.Component<
  MapStateToProps<{ loginState: { userName: string }, themeState: { theme: "light" | "dark" } }>
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
```

##### view api's type recognition support for props
```tsx
import React from "react";
import { useStore, MapStateToProps, view } from "resy";

type ComPropsType = { name: string };

// the second type parameter of the MapStateToProps paradigm type is the type of props.
class ClassComProps extends React.Component<
  MapStateToProps<StateType, ComPropsType>
> {
  render() {
    const { state: { count, text }, name } = this.props;
    return (
      <div>{count}{text}{name}</div>
    );
  }
}

// you can add a props type interface to the generic type of view.
const TestComPropsView = view<ComPropsType>(ClassComProps)(store);

function App() {
   return (
     <ClassComProps name="ClassComPropsName"/>
   );
}
```

##### view's equal function handle
the second function parameter of view api is the advanced encapsulation
of React.memo's propsAreEqual function,
which is essentially a custom comparison of the similarities
and differences between props and state.
```tsx
const TestEqualView = view<ComPropsType>(
  ClassComProps,
  // it is similar to React.memo's propsAreEqual.
  (next, prev) => {
    const { props: nextProps, state: nextState } = next;
    const { props: prevProps, state: prevState } = prev;
    // some conditon
    if (
      nextProps.name === "ClassComPropsName"
      || prevProps.name === "ClassComPropsName"
    ) {
      return false;
    }
    return (
      nextState.count === prevState.count
      || nextState.text === prevState.text
    );
  }
)(store);
```

### License
[MIT License](https://github.com/lsbFlying/resy/blob/master/LICENSE) (c) [刘善保](https://github.com/lsbFlying)

