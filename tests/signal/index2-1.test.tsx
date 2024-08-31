import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createSignals, signalsComputed } from "../../src";

/** Normal operation of signal mode */
test("signal-II-1", async () => {

  const store = createSignals({
    page: {
      pageSize: 10,
      pageNumber: 1,
    },
    userInfo: {
      userName: "Liu Shan Bao",
      userId: 666,
    },
    renderPage() {
      return {
        counter: this.page.pageSize + this.page.pageNumber,
      };
    },
    userAge: {
      getUserAge() {
        return signalsComputed(() => store.signals.userInfo.userId - 66);
      },
    },
  });

  let renderCounter = 0;

  const App = () => {
    renderCounter++;

    const {
      page,
      userInfo: { userName, userId },
      renderPage, userAge,
    } = store.signals;

    return (
      <>
        <p>pageSize:{page.pageSize}</p>
        <p>pageNumber:{page.pageNumber}</p>
        <p>userName:{userName}</p>
        <p>userId:{userId}</p>
        <p>renderPage:{renderPage().counter}</p>
        <p>userAge:{userAge.getUserAge()}</p>
        <button
          onClick={() => {
            store.page = {
              ...store.page,
              pageSize: 20,
            };
          }}
        >
          pageSizeChange
        </button>
        <button
          onClick={() => {
            store.page = {
              ...store.page,
              pageNumber: 2,
            };
          }}
        >
          pageNumberChange
        </button>
        <button
          onClick={() => {
            store.userInfo = {
              userName: "Bob",
              userId: 888,
            };
          }}
        >
          userInfoChange
        </button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("pageSizeChange"));
  await waitFor(() => {
    getByText("pageSize:20");
    getByText("pageNumber:1");
    getByText("userName:Liu Shan Bao");
    getByText("userId:666");
    getByText("renderPage:21");
    getByText("userAge:600");
  });

  fireEvent.click(getByText("pageNumberChange"));
  await waitFor(() => {
    getByText("pageSize:20");
    getByText("pageNumber:2");
    getByText("userName:Liu Shan Bao");
    getByText("userId:666");
    getByText("renderPage:22");
    getByText("userAge:600");
  });

  fireEvent.click(getByText("userInfoChange"));
  await waitFor(() => {
    console.log("renderCounter:", renderCounter);
    expect(renderCounter === 1).toBeTruthy();
    getByText("pageSize:20");
    getByText("pageNumber:2");
    getByText("userName:Bob");
    getByText("userId:888");
    getByText("renderPage:22");
    getByText("userAge:822");
  });
});
