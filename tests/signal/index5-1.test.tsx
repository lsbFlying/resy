import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createSignals, signalsComputed, useSignalsComputed } from "../../src";

/** Test the usage scenarios of signalsComputed */
test("signal-V-1", async () => {

  const store = createSignals({
    count: 0,
  });

  let renderCounter = 0;
  const App = () => {
    renderCounter++;
    const { count } = store.signals;

    const doubleCount = signalsComputed(() => count * 2);

    const objectCount = signalsComputed(() => {
      return {
        origin: count.value,
      };
    });

    const arrayCount = signalsComputed(() => {
      return [count.value, 2];
    });

    const setCount = signalsComputed(() => {
      return new Set<number>().add(count.value).add(3);
    });

    const mapCount = signalsComputed(() => {
      return new Map<"count", number>().set("count", count.value);
    });

    const useDoubleCount = useSignalsComputed(() => count * 2);

    const complexCount = signalsComputed(() => {
      return doubleCount + useDoubleCount + 1;
    });

    const useComplexCount = useSignalsComputed(() => {
      return complexCount + 1;
    });

    const sc = signalsComputed(() => {
      const dv = doubleCount.value;
      const dt = doubleCount.truthy;
      const df = doubleCount.falsy;
      const dto = doubleCount.typeOf();
      const ds = Object.prototype.toString.call(doubleCount);
      const oc = "origin" in objectCount;
      const restObject = { ...objectCount.value };
      const restArray = [...arrayCount].join("");
      const restSet = [...setCount].join("");
      const restMap = [...mapCount].flat().join("");
      return `${dv}_${dt}_${df}_${dto}_${ds}_${oc}_${restObject.origin}_${restArray}_${restSet}_${restMap}`;
    });

    return (
      <>
        <p>count:{count}</p>
        <p>no-update-effect-count:{count * 2}</p>
        <p>doubleCount:{doubleCount}</p>
        <p>use-doubleCount:{useDoubleCount}</p>
        <p>complexCount:{complexCount}</p>
        <p>use-complexCount:{useComplexCount}</p>
        <p>sc:{sc}</p>
        <button
          onClick={() => {
            store.count++;
          }}
        >
          add
        </button>
        <button
          onClick={() => {
            store.count--;
          }}
        >
          subtract
        </button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("add"));
  await waitFor(() => {
    expect(renderCounter === 1).toBeTruthy();
    getByText("count:1");
    getByText("no-update-effect-count:0");
    getByText("doubleCount:2");
    getByText("use-doubleCount:2");
    getByText("complexCount:5");
    getByText("use-complexCount:6");
    getByText("sc:2_true_false_Number_[object Number]_true_1_12_13_count1");
  });

  fireEvent.click(getByText("subtract"));
  await waitFor(() => {
    expect(renderCounter === 1).toBeTruthy();
    getByText("count:0");
    getByText("no-update-effect-count:0");
    getByText("doubleCount:0");
    getByText("use-doubleCount:0");
    getByText("complexCount:1");
    getByText("use-complexCount:2");
    getByText("sc:0_false_true_Number_[object Number]_true_0_02_03_count0");
  });
});
