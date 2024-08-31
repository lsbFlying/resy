import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createSignals, signalsComputed } from "../../src";

/** Chain attribute operation in signal mode */
test("signal-IV-1", async () => {

  const store = createSignals({
    page: {
      info: {
        pageSize: 10,
        pageNumber: 1,
      },
    },
    userInfo: {
      userName: {
        firstName: "Shan Bao",
        lastName: "Liu ",
        fullName: {
          name: "Liu Shan Bao"
        },
      },
      userId: 666,
    },
    renderPage() {
      const { info: { pageSize, pageNumber } } = this.page;
      return {
        counter: {
          dataValue: pageSize + pageNumber,
        },
      };
    },
    userAge: {
      getUserAge() {
        return signalsComputed(() => store.signals.userInfo.userId - 66);
      },
    },
    infoMap: new Map().set("name", "Jack").set("age", 12),
    mapWithRenderPage: new Map().set("renderPage", (p: string) => {
      const { page: { info: { pageSize, pageNumber } } } = store;
      return {
        counter: {
          dataValue: `${pageSize + pageNumber}_${p}`,
        },
      };
    }),
    mapWithRenderPage2: new Map().set("renderPage", (p: string) => {
      const { page: { info: { pageSize, pageNumber } } } = store;
      return (text: string) => {
        return {
          counter: {
            dataValue: `${pageSize + pageNumber}_${text}_${p}`,
          },
        };
      };
    }),
    mapWithRenderPage3: new Map().set("renderPage", (p: string) => {
      const { page: { info: { pageSize, pageNumber } } } = store.signals;
      return (text: string) => {
        return {
          counter: {
            dataValue: signalsComputed(() => `${pageSize + pageNumber}_${text}_${p}`),
          },
        };
      };
    }),
  });

  let renderCounter = 0;

  const App = () => {
    renderCounter++;

    const {
      page: { info: { pageSize, pageNumber } },
      userInfo: {
        userName: {
          firstName,
          lastName,
          fullName: {
            name
          },
        },
        userId,
      },
      renderPage, userAge, infoMap,
      mapWithRenderPage,
      mapWithRenderPage2,
      mapWithRenderPage3,
    } = store.signals;

    return (
      <>
        <p>pageSize:{pageSize}</p>
        <p>pageNumber:{pageNumber}</p>
        <p>userName:{lastName}{firstName}</p>
        <p>name:{name}</p>
        <p>userId:{userId}</p>
        <p>renderPage:{renderPage().counter.dataValue}</p>
        <p>userAge:{userAge.getUserAge()}</p>
        <p>infoMap-size:{infoMap.size}</p>
        <p>infoMap-name:{infoMap.get("name")}</p>
        <p>infoMap-age:{infoMap.get("age")}</p>
        <p>mapWithRenderPage:{mapWithRenderPage.get("renderPage")("ok").counter.dataValue}</p>
        <p>mapWithRenderPage2:{mapWithRenderPage2.get("renderPage")("world")("Hello").counter.dataValue}</p>
        <p>mapWithRenderPage2:{mapWithRenderPage2.get("renderPage")("Hello")("world").counter.dataValue}</p>
        <p>mapWithRenderPage3:{mapWithRenderPage3.get("renderPage")("world")("Hello").counter.dataValue}</p>
        <p>mapWithRenderPage3:{mapWithRenderPage3.get("renderPage")("Hello")("world").counter.dataValue}</p>
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
                  name: "文木",
                },
              },
              userId: 888,
            };
          }}
        >
          userInfoChange
        </button>
        <button
          onClick={() => {
            store.infoMap = new Map().set("name", "Jacky").set("age", 28).set("ok", "fine");
          }}
        >
          infoMapChange
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
    getByText("renderPage:21");
    getByText("userAge:600");
    getByText("infoMap-size:2");
    getByText("infoMap-name:Jack");
    getByText("infoMap-age:12");
    getByText("mapWithRenderPage:11_ok");
    getByText("mapWithRenderPage2:11_Hello_world");
    getByText("mapWithRenderPage2:11_world_Hello");
    getByText("mapWithRenderPage3:21_Hello_world");
    getByText("mapWithRenderPage3:21_world_Hello");
  });

  fireEvent.click(getByText("pageNumberChange"));
  await waitFor(() => {
    getByText("pageSize:20");
    getByText("pageNumber:2");
    getByText("userName:Liu Shan Bao");
    getByText("name:Liu Shan Bao");
    getByText("userId:666");
    getByText("renderPage:22");
    getByText("userAge:600");
    getByText("infoMap-size:2");
    getByText("infoMap-name:Jack");
    getByText("infoMap-age:12");
    getByText("mapWithRenderPage:11_ok");
    getByText("mapWithRenderPage2:11_Hello_world");
    getByText("mapWithRenderPage2:11_world_Hello");
    getByText("mapWithRenderPage3:22_Hello_world");
    getByText("mapWithRenderPage3:22_world_Hello");
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
    getByText("renderPage:22");
    getByText("userAge:822");
    getByText("infoMap-size:2");
    getByText("infoMap-name:Jack");
    getByText("infoMap-age:12");
    getByText("mapWithRenderPage:11_ok");
    getByText("mapWithRenderPage2:11_Hello_world");
    getByText("mapWithRenderPage2:11_world_Hello");
    getByText("mapWithRenderPage3:22_Hello_world");
    getByText("mapWithRenderPage3:22_world_Hello");
  });

  fireEvent.click(getByText("infoMapChange"));
  await waitFor(() => {
    console.log("renderCounter:", renderCounter);
    expect(renderCounter === 1).toBeTruthy();
    getByText("pageSize:20");
    getByText("pageNumber:2");
    getByText("userName:Bob");
    getByText("name:文木");
    getByText("userId:888");
    getByText("renderPage:22");
    getByText("userAge:822");
    getByText("infoMap-size:3");
    getByText("infoMap-name:Jacky");
    getByText("infoMap-age:28");
    getByText("mapWithRenderPage:11_ok");
    getByText("mapWithRenderPage2:11_Hello_world");
    getByText("mapWithRenderPage2:11_world_Hello");
    getByText("mapWithRenderPage3:22_Hello_world");
    getByText("mapWithRenderPage3:22_world_Hello");
  });
});
