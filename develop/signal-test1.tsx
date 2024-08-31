import React, { Profiler, useState } from "react";
import { createSignals } from "../src";

interface Model {
  count: number;
  text: string;
  names: string[];
}

const store = createSignals<Model>({
  count: 0,
  text: "hello",
  names: ["张三", "李四", "王二麻", "小明", "小红", "小华"],
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
          names.map((name, index) => (
            <div key={`${name}_${index}`}>name：{name}</div>
          ))
        }
      </div>
      <button id="signal" onClick={() => {
        store.count++;
        store.text = `${Math.floor(Math.random() * 1000000000)}`;
        store.names = Array(6).fill(null).map(() => (
          `${Math.floor(Math.random() * 1000000000)}`
        ));
      }}>add</button>
    </div>
  );
};

const statePerformanceActual: number[] = [];
const statePerformanceBase: number[] = [];
const statePerformanceComputed: number[] = [];

const AppState = () => {
  const [count, setCount] = useState(0);
  const [text, setText] = useState("hello");
  const [names, setNames] = useState(["张三", "李四", "王二麻", "小明", "小红", "小华"]);
  // console.log("AppState");
  return (
    <div className="center">
      <p>AppState-count：{count}</p>
      <p>AppState-text：{text}</p>
      <div className="names">
        {
          names.map((name, index) => (
            <div key={`${name}_${index}`}>name：{name}</div>
          ))
        }
      </div>
      <button id="state" onClick={() => {
        setCount(prevState => prevState + 1);
        setText(`${Math.floor(Math.random() * 1000000000)}`);
        setNames(Array(6).fill(null).map(() => (
          `${Math.floor(Math.random() * 1000000000)}`
        )));
      }}>add</button>
    </div>
  );
};

/**
 * @description As can be seen from the layout update, that is, under the same update isomorphism scenario,
 * signal has gained significant advantages.
 *
 * and the reference test results are as follows:
 * signal-actualAverage: 0.04101717964758556
 * signal-baseAverage: 0.023055538899593216
 * signal-computedAverage: 0.05934681306743414
 * state-actualAverage: 1.3909090892835096
 * state-baseAverage: 1.6000000048767438
 * state-computedAverage: 1.590909096327695
 */
const SignalTest1 = () => (
  <>
    <Profiler
      id="AppState"
      onRender={(_d, _, actualDuration, baseDuration, startTime, commitTime) => {
        signalsPerformanceActual.push(actualDuration);
        signalsPerformanceBase.push(baseDuration);
        signalsPerformanceComputed.push(commitTime - startTime);
      }}
    >
      <AppState />
    </Profiler>
    <Profiler
      id="AppSignal"
      onRender={(_d, _, actualDuration, baseDuration, startTime, commitTime) => {
        statePerformanceActual.push(actualDuration);
        statePerformanceBase.push(baseDuration);
        statePerformanceComputed.push(commitTime - startTime);
      }}
    >
      <AppSignal />
    </Profiler>
    <div>
      <button
        onClick={() => {
          const btn = document.getElementById("signal");
          Array(50).fill(null).forEach(() => {
            const id = requestAnimationFrame(() => {
              cancelAnimationFrame(id);
              btn?.click();
            });
          });
        }}
      >
        signal-test
      </button>
      <button
        onClick={() => {
          const btn = document.getElementById("state");
          Array(50).fill(null).forEach(() => {
            const id = requestAnimationFrame(() => {
              cancelAnimationFrame(id);
              btn?.click();
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
  </>
);

export default SignalTest1;
