import React, { memo, Profiler, useState } from "react";
import { createSignals } from "../src";
import { buildData } from "./Tpp";

const store = createSignals({
  count: 0,
  text: "hello",
  names: buildData(1000),
  age: 12,
});

const signalsPerformanceActual: number[] = [];
const signalsPerformanceBase: number[] = [];
const signalsPerformanceComputed: number[] = [];

const AppSignal = () => {
  const { count, text, names } = store.signals;
  // console.log("AppSignal");
  return (
    <div className="center">
      <p>AppSignal-count：{count}</p>
      <p>AppSignal-text：{text}</p>
      <div className="names">
        {
          names.map(item => (
            <div key={item.id}>name：{item.label}</div>
          ))
        }
      </div>
      <button id="signal" onClick={() => {
        store.count++;
        store.text = `${Math.floor(Math.random() * 1000000000)}`;
        const data = store.names.slice();
        for (let i = 0; i < data.length; i += 10) {
          const r = data[i];
          data[i] = { id: r.id, label: r.label + " !!!" };
        }
        store.names = data;
      }}>add</button>
    </div>
  );
};

const AppSignalWrap = () => {
  const { age } = store.signals;
  return (
    <div className="center">
      <div>AppSignalWrap-age：{age}</div>
      <AppSignal />
      <button
        id="signal-wrap"
        onClick={() => {
          store.age++;
        }}
      >
        add
      </button>
    </div>
  );
};

const statePerformanceActual: number[] = [];
const statePerformanceBase: number[] = [];
const statePerformanceComputed: number[] = [];

const AppState = () => {
  const [count, setCount] = useState(0);
  const [text, setText] = useState("hello");
  const [names, setNames] = useState(buildData(1000));
  // console.log("AppState");
  return (
    <div className="center">
      <p>AppState-count：{count}</p>
      <p>AppState-text：{text}</p>
      <div className="names">
        {
          names.map(item => (
            <div key={item.id}>name：{item.label}</div>
          ))
        }
      </div>
      <button id="state" onClick={() => {
        setCount(prevState => prevState + 1);
        setText(`${Math.floor(Math.random() * 1000000000)}`);
        const data = names.slice();
        for (let i = 0; i < data.length; i += 10) {
          const r = data[i];
          data[i] = { id: r.id, label: r.label + " !!!" };
        }
        setNames(data);
      }}>add</button>
    </div>
  );
};

const AppStateMemo = memo(AppState, () => true);

const AppStateWrap = () => {
  const [age, setAge] = useState(12);
  return (
    <div className="center">
      <div>AppStateWrap-age：{age}</div>
      <AppStateMemo />
      <button
        id="state-wrap"
        onClick={() => {
          setAge(prevAge => prevAge + 1);
        }}
      >
        add
      </button>
    </div>
  );
};

/**
 * @description In this scenario where the seed element does not need to be updated,
 * the advantage of signal is very obvious.
 * Compared to the test results of signal-test1, the advantage gap has widened even more.
 *
 * and the reference test results are as follows:
 * signal-actualAverage: 0.05038549610683236
 * signal-baseAverage: 0.2298426896164121
 * signal-computedAverage: 0.07003729959434071
 * state-actualAverage: 20.94999998807907
 * state-baseAverage: 21.049999997019768
 * state-computedAverage: 21.549999997019768
 *
 * 🌟 More importantly, whether it is signal test1 or signal test2,
 * the testing experience of signal is smoother compared to state,
 * which is an advantage for situations where there is no use of related APIs such as transition in React18.
 *
 * 🌟 Secondly, we can also see that this is only the advantage of the signal itself.
 * If we further optimize the virtual DOM and comparison algorithms inside React,
 * we can achieve the performance effect of solid.js.
 *
 * 🌟 The use of signal mode has significant performance advantages over conventional useStore or ComponentWithStore,
 * and the performance records of conventional useStore or ComponentWithStore are not shown here.
 * Local testing has found that they are almost the same as useState, with slight advantages but unclear.
 * However, the performance improvement of signal mode is clearly visible.
 */
const SignalTest2 = () => (
  <>
    <div className="center">
      <button
        onClick={() => {
          const btn = document.getElementById("signal");
          const btnWrap = document.getElementById("signal-wrap");
          Array(50).fill(null).forEach(() => {
            const id = requestAnimationFrame(() => {
              cancelAnimationFrame(id);
              btn?.click();
              btnWrap?.click();
            });
          });
        }}
      >
        signal-test
      </button>
      <button
        onClick={() => {
          const btn = document.getElementById("state");
          const btnWrap = document.getElementById("state-wrap");
          Array(50).fill(null).forEach(() => {
            const id = requestAnimationFrame(() => {
              cancelAnimationFrame(id);
              btn?.click();
              btnWrap?.click();
            });
          });
        }}
      >
        state-test
      </button>
      <button
        onClick={() => {
          const actualSignalAverage = signalsPerformanceActual.reduce(
            (accumulator, currentValue) => accumulator + currentValue,
            0,
          ) / signalsPerformanceActual.length;
          const baseSignalAverage = signalsPerformanceBase.reduce(
            (accumulator, currentValue) => accumulator + currentValue,
            0,
          ) / signalsPerformanceBase.length;
          const computedSignalAverage = signalsPerformanceComputed.reduce(
            (accumulator, currentValue) => accumulator + currentValue,
            0,
          ) / signalsPerformanceComputed.length;
          console.log("signal-actualAverage:", actualSignalAverage);
          console.log("signal-baseAverage:", baseSignalAverage);
          console.log("signal-computedAverage:", computedSignalAverage);

          const actualStateAverage = statePerformanceActual.reduce(
            (accumulator, currentValue) => accumulator + currentValue,
            0,
          ) / statePerformanceActual.length;
          const baseStateAverage = statePerformanceBase.reduce(
            (accumulator, currentValue) => accumulator + currentValue,
            0,
          ) / statePerformanceBase.length;
          const computedStateAverage = statePerformanceComputed.reduce(
            (accumulator, currentValue) => accumulator + currentValue,
            0,
          ) / statePerformanceComputed.length;
          console.log("state-actualAverage:", actualStateAverage);
          console.log("state-baseAverage:", baseStateAverage);
          console.log("state-computedAverage:", computedStateAverage);

          console.log("actualAverage: state / signal", actualStateAverage / actualSignalAverage);
          console.log("baseAverage: state / signal", baseStateAverage / baseSignalAverage);
          console.log("computedAverage: state / signal", computedStateAverage / computedSignalAverage);
        }}
      >
        result
      </button>
    </div>
    <Profiler
      id="AppSignal"
      onRender={(_d, _, actualDuration, baseDuration, startTime, commitTime) => {
        statePerformanceActual.push(actualDuration);
        statePerformanceBase.push(baseDuration);
        statePerformanceComputed.push(commitTime - startTime);
      }}
    >
      <AppSignalWrap />
    </Profiler>
    <Profiler
      id="AppState"
      onRender={(_d, _, actualDuration, baseDuration, startTime, commitTime) => {
        signalsPerformanceActual.push(actualDuration);
        signalsPerformanceBase.push(baseDuration);
        signalsPerformanceComputed.push(commitTime - startTime);
      }}
    >
      <AppStateWrap />
    </Profiler>
  </>
);

export default SignalTest2;
