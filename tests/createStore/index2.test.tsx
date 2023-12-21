import React, { useState } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/** Usage of object parameters for createStore */
test("createStoreNoFunction", async () => {
  type TimerStore = {
    time: number;
  };

  const counterStore = createStore({
    count: 0,
  }, {});
  const initialCount = counterStore.count;

  const timerStore = createStore<TimerStore>({
    time: Date.now(),
  });
  const initialTimeRecord = timerStore.time;

  function AppWithStore() {
    const { count } = useStore(counterStore);
    const { time } = useStore(timerStore);
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
    expect(initialTimeRecord < timerStore.time).toBeTruthy();
  });

  fireEvent.click(getByText("showChange"));
  await waitFor(() => {
    getByText("AppWithStore display none");
  });

  fireEvent.click(getByText("showChange"));
  await waitFor(() => {
    // Verified that all store data unloaded and then reloaded is rendered from the initialization object parameters
    expect(initialTimeRecord === timerStore.time).toBeTruthy();
    expect(initialCount === counterStore.count).toBeTruthy();
    // Verified that unmountRestore defaults to true
    expect(initialCount === 0).toBeTruthy();
  });
});
