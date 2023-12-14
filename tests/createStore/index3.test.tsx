import React, { useState } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/** Configuration options for createStore */
test("createStoreWithOptions-I", async () => {
  const userStore = createStore({
    userName: "",
  }, {
    unmountRestore: false,
  });

  function AppWithStore() {
    const { userName } = useStore(userStore);
    return (
      <>
        <p>{userName}</p>
        <button onClick={() => {
          userStore.userName = "Liu";
        }}>userNameChange</button>
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

  fireEvent.click(getByText("userNameChange"));
  await waitFor(() => {
    getByText("Liu");
  });

  fireEvent.click(getByText("showChange"));
  await waitFor(() => {
    getByText("AppWithStore display none");
  });

  fireEvent.click(getByText("showChange"));
  await waitFor(() => {
    // Verified that when the configuration option of createStore unmountRestore is configured as false,
    // the data of store is permanent and will not be reset with the unloaded cycle of the component or store
    expect(userStore.userName === "Liu").toBeTruthy();
  });
});
