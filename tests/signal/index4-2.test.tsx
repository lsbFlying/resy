import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createSignals, signalsComputed } from "../../src";

/** Chain attribute operation in signal mode */
test("signal-IV-2", async () => {

  const store = createSignals({
    page: {
      info: {
        pageSize: 10,
        pageNumber: 1,
        renderPage() {
          const { page: { info: { pageSize, pageNumber } } } = store.signals;
          return signalsComputed(() => `pageSize:${pageSize};pageNumber:${pageNumber}`);
        },
      },
    },
    userInfo: {
      userName: {
        firstName: "Shan Bao",
        lastName: "Liu ",
        fullName: {
          name: "Liu Shan Bao",
          renderName() {
            const { userInfo: { userName: { fullName: { name } } } } = store.signals;
            return signalsComputed(() => `renderName:${name}`);
          },
        },
      },
      userId: 666,
    },
  });

  let renderCounter = 0;

  const App = () => {
    renderCounter++;

    const {
      page: { info: { pageSize, pageNumber, renderPage, } },
      userInfo: {
        userName: {
          firstName,
          lastName,
          fullName: {
            name,
            renderName,
          },
        },
        userId,
      },
    } = store.signals;

    return (
      <>
        <p>pageSize:{pageSize}</p>
        <p>pageNumber:{pageNumber}</p>
        <p>pageRenderPage:{renderPage()}</p>
        <p>userName:{lastName}{firstName}</p>
        <p>name:{name}</p>
        <p>renderName:{renderName()}</p>
        <p>userId:{userId}</p>
        <button
          onClick={() => {
            store.page = {
              info: {
                ...store.page.info,
                pageSize: 20,
              },
            };
          }}
        >
          pageSizeChange
        </button>
        <button
          onClick={() => {
            store.page = {
              info: {
                ...store.page.info,
                pageNumber: 2,
              },
            };
          }}
        >
          pageNumberChange
        </button>
        <button
          onClick={() => {
            store.userInfo = {
              userName: {
                lastName: "",
                firstName: "Bob",
                fullName: {
                  ...store.userInfo.userName.fullName,
                  name: "文木",
                },
              },
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
    getByText("name:Liu Shan Bao");
    getByText("userId:666");
    getByText("pageRenderPage:pageSize:20;pageNumber:1");
    getByText("renderName:renderName:Liu Shan Bao");
  });

  fireEvent.click(getByText("pageNumberChange"));
  await waitFor(() => {
    getByText("pageSize:20");
    getByText("pageNumber:2");
    getByText("userName:Liu Shan Bao");
    getByText("name:Liu Shan Bao");
    getByText("userId:666");
    getByText("pageRenderPage:pageSize:20;pageNumber:2");
    getByText("renderName:renderName:Liu Shan Bao");
  });

  fireEvent.click(getByText("userInfoChange"));
  await waitFor(() => {
    console.log("renderCounter:", renderCounter);
    expect(renderCounter === 1).toBeTruthy();
    getByText("pageSize:20");
    getByText("pageNumber:2");
    getByText("userName:Bob");
    getByText("name:文木");
    getByText("userId:888");
    getByText("pageRenderPage:pageSize:20;pageNumber:2");
    getByText("renderName:renderName:文木");
  });
});
