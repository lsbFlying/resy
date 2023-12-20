import React, { useState } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/** Usage of function parameters for createStore */
test("createStoreWithFunction-I", async () => {
  type TimerStore = {
    time: number;
  };

  const timerStore = createStore<TimerStore>(() => {
    // You can handle some necessary or complex logic in the function,

    /** Simulate necessary or complex logic start */
    let initialTime = Date.now();
    // Odd
    if (initialTime % 2 !== 0) {
      // One seconds fast
      initialTime += 1000;
    // even
    } else {
      // Two seconds fast
      initialTime += 2000;
    }
    /** Simulate necessary or complex logic end */

    // console.log("initialTime", initialTime);
    // and finally return an initialized data object
    return {
      time: initialTime,
    };
  });

  const initialTimeRecord = timerStore.time;
  // console.log("initialTimeRecord", initialTimeRecord);

  function AppWithStore() {
    const { time } = useStore(timerStore);
    return (
      <p>{time}</p>
    );
  }

  const App = () => {
    const [showAppWithStore, setShowAppWithStore] = useState(true);

    return (
      <>
        {/* Simulate the unloading of all data in the store */}
        {
          showAppWithStore
            ? <AppWithStore />
            : <p>AppWithStore display none</p>
        }
        <button onClick={() => {
          setShowAppWithStore(!showAppWithStore);
        }}>showChange</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("showChange"));
  await waitFor(() => {
    getByText("AppWithStore display none");
  });

  fireEvent.click(getByText("showChange"));
  await waitFor(() => {
    // It is verified that if the store unload cycle is a function parameter,
    // the rendering will start with the object returned by the function again as the initialization data.
    // console.log("showChange-again", initialTimeRecord, timerStore.time);
    const id = setTimeout(() => {
      clearTimeout(id);
      console.log(initialTimeRecord, timerStore.time);
      expect(initialTimeRecord < timerStore.time).toBeTruthy();
    }, 0);
  });
});
