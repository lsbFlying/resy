import React, { useMemo, useState } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { defineStore } from "../../src";

/** Usage of function parameters for defineStore */
test("defineStoreWithFunction-II", async () => {

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
      unmountRestore: true,
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
    // verify that the function argument of defineStore and the configuration item of unmountRestore
    // of options correctly execute the reset recovery logic when configured as true.
    // at the same time, it is also reported that the configuration item of
    // unmountRestore of options defaults to true when options is not configured.
    expect(initialTimeRecord < timerStore!.time).toBeTruthy();
  });
});
