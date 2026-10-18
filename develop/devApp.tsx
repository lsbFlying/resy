import { createStore, ComponentWithStore } from "../src";
import React from "react";

// let fineGrainedCounterNormal = 0;

const store = createStore({
  count: 0,
  text: "hello world",
  readyOk: false,
  readyOk2: false,
  info: {
    personInfo: {
      ageInfo: {
        age: 12,
        level: "teen",
      },
      nameInfo: {
        name: "Liu-Shan-Bao",
      },
      bodyInfo: {
        heightInfo: {
          height: 170,
          reach: 170,
        },
        weightInfo: {
          weight: 64,
          level: "bantamweight",
        },
      },
    },
    nationality: "China",
  },
}, { immutable: true });

// // changes in the state of count data will not cause re-render in Text
// function Text() {
//   // console.log("render-Text");
//   const { text } = useStore(store);
//   // console.log("render-Text-after");
//
//   useEffect(() => {
//     console.log("useEffect-Text");
//   }, []);
//
//   fineGrainedCounterNormal++;
//   return <p>{text}</p>;
// }
//
// // changes in the state of text data will not cause re-render in Count
// function Count() {
//   // console.log("render-Count");
//   const { count } = useStore(store);
//   // console.log("render-Count-after");
//
//   useEffect(() => {
//     console.log("useEffect-Count");
//   }, []);
//
//   fineGrainedCounterNormal++;
//   return <p>{count}</p>;
// }

// const App = () => {
//   // console.log("render-App");
//   const { readyOk, readyOk2 } = useStore(store);
//   // 隐式调用useHandle，useStore写完执行完之后默认隐式调用useHandle，但是不用写useHandle
//   // useHandle();
//   // console.log("render-App-after");
//
//   useEffect(() => {
//     console.log("useEffect-App");
//   }, []);
//
//   fineGrainedCounterNormal++;
//   return (
//     <>
//       <Count />
//       <Text />
//       <p>{readyOk ? "ok" : "loading"}</p>
//       <button onClick={() => {
//         store.count++;
//       }}>countChange</button>
//       <button onClick={() => {
//         store.text = "good bye";
//       }}>textChange</button>
//       <button onClick={() => {
//         store.readyOk = true;
//       }}>alreadyChange</button>
//     </>
//   );
// };

class App extends ComponentWithStore {

  store = this.connectStore(store);

  render() {
    const { count, text, info } = this.store;

    const { personInfo } = info;
    const { bodyInfo } = personInfo;
    const { heightInfo } = bodyInfo;
    const { height, reach } = heightInfo;

    return (
      <>
        <p>count:{count}</p>
        <p>text:{text}</p>
        <p>height:{height}</p>
        <p>reach:{reach}</p>
        <button onClick={() => {
          // this.store.count++;
          console.time("reach");
          // store.info.personInfo.bodyInfo.heightInfo.reach = Math.floor(Math.random() * 1000);
          this.store.info.personInfo.bodyInfo.heightInfo.reach = Math.floor(Math.random() * 1000);
          console.timeEnd("reach");
        }}>add
        </button>
        <button onClick={() => {
          this.store.text = "hello";
        }}>text
        </button>
      </>
    );
  }
}

export default App;
