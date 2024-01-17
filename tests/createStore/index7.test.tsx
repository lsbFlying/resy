import React, { useState } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/** Usage of function parameters for createStore */
test("createStoreWithFunction-III", async () => {

  const timerStore = createStore<{ time: number }>(
    () => ({
      time: Date.now(),
    }),
    {
      unmountRestore: false,
    },
  );

  const initialTimeRecord = timerStore.time;

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
    // Verified that the reinitialization of the function parameters in createStore
    // is independent of the unmountRestore configuration
    expect(initialTimeRecord < timerStore.time).toBeTruthy();
  });
});
