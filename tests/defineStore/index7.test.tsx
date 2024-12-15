import React, { useMemo, useState } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { defineStore } from "../../src";

/** Usage of function parameters for defineStore */
test("defineStoreWithFunction-III", async () => {

  let initialExec = true;
  const initialTimeRecord = Date.now();
  const useTimerStore = defineStore<{ time: number }>(
    () => {
      if (initialExec) {
        initialExec = false;
        return {
          time: initialTimeRecord,
        };
      }
      return {
        time: Date.now(),
      };
    },
    {
      unmountRestore: false,
    },
  );

  let timerStore;

  function AppWithStore() {
    const { time, store } = useTimerStore();
    useMemo(() => timerStore = store, [store]);

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
    // Verified that the reinitialization of the function parameters in defineStore
    // is independent of the unmountRestore configuration
    expect(initialTimeRecord < timerStore!.time).toBeTruthy();
  });
});
