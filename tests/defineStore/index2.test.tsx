import React, { useMemo, useState } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { defineStore } from "../../src";

/** Usage of object parameters for defineStore */
test("defineStoreNoFunction", async () => {
  type TimerStore = {
    time: number;
  };

  const initialCount = 0;

  const useCunterStore = defineStore({
    count: initialCount,
  }, {});

  const initialTimeRecord = Date.now();
  const useTimerStore = defineStore<TimerStore>({
    time: initialTimeRecord,
  });

  let counterStoreTemp;
  let timerStoreTemp;

  function AppWithStore() {
    const { count, store: counterStore } = useCunterStore();
    useMemo(() => counterStoreTemp = counterStore, [counterStore]);

    const { time, store: timerStore } = useTimerStore();
    useMemo(() => timerStoreTemp = timerStore, [timerStore]);

    return (
      <>
        <p>{count}</p>
        <p>{time}</p>
        <button onClick={() => {
          counterStore.count++;
        }}>countChange</button>
        <button onClick={() => {
          timerStore.time = Date.now() + 1000;
        }}>timeChange</button>
      </>
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

  fireEvent.click(getByText("countChange"));
  await waitFor(() => {
    getByText("1");
  });

  fireEvent.click(getByText("timeChange"));
  await waitFor(() => {
    expect(initialTimeRecord < timerStoreTemp!.time).toBeTruthy();
  });

  fireEvent.click(getByText("showChange"));
  await waitFor(() => {
    getByText("AppWithStore display none");
  });

  fireEvent.click(getByText("showChange"));
  await waitFor(() => {
    // Verified that all store data unloaded and then reloaded is rendered from the initialization object parameters
    expect(initialTimeRecord === timerStoreTemp!.time).toBeTruthy();
    expect(initialCount === counterStoreTemp!.count).toBeTruthy();
    // Verified that unmountRestore defaults to true
    expect(initialCount === 0).toBeTruthy();
  });
});
