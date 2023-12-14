import React, { useState } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/** Usage of object parameters for createStore */
test("createStoreNoFunction", async () => {
  type TimerStore = {
    time: number;
  };

  const timerStore = createStore<TimerStore>({
    time: Date.now(),
  });
  const initialTimeRecord = timerStore.time;

  function AppWithStore() {
    const { time } = useStore(timerStore);
    return (
      <>
        <p>{time}</p>
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
  });
});
