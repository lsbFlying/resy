import React, { useMemo, useState } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { defineStore } from "../../src";

/** Configuration options for defineStore */
test("defineStoreWithOptions-II", async () => {
  const useUserStore = defineStore({
    userName: "",
    updateUser() {
      this.userName = "Liu";
    },
  }, {
    unmountRestore: true,
  });

  let userStore;

  function AppWithStore() {
    const { userName, updateUser, store } = useUserStore();
    useMemo(() => userStore = store, [store]);

    return (
      <>
        <p>{userName}</p>
        <button onClick={updateUser}>userNameChange</button>
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
    // Verified that when the configuration option of defineStore unmountRestore is configured as true,
    // the data of store is not permanent and will be reset with the unloaded cycle of the store
    // Therefore, when the unmountRestore configuration item is set to true,
    // it is equivalent to not writing the options configuration project. The internal default is true.
    expect(userStore!.userName === "").toBeTruthy();
  });
});
