import React, { useState } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/** Usage of function parameters for createStore */
test("createStoreWithFunction-II", async () => {

  const timerStore = createStore<{ time: number }>(
    () => ({
      time: Date.now(),
    }),
    {
      unmountRestore: true,
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
    // verify that the function argument of createStore and the configuration item of unmountRestore
    // of options correctly execute the reset recovery logic when configured as true.
    // at the same time, it is also reported that the configuration item of
    // unmountRestore of options defaults to true when options is not configured.
    expect(initialTimeRecord < timerStore.time).toBeTruthy();
  });
});
