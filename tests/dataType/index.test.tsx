import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/** basic usage for different data types */
test("dataType", async () => {
  type Store = {
    count: number;
    text: string;
    faker: boolean;
    textProblem?: string;
    labelProblem: undefined | string;
    landName?: null | string;
    user: {
      name: string;
      id: number;
      type: "normal" | "vip";
    };
    heights: number[];
    studentNames: Set<string>;
    info: Map<string, string>;
    addOrSubtract(): void;
    promiseLogin(): Promise<{ userName: string }>;
    proxyLogin: { userName: string };
  };

  const store = createStore<Store>({
    count: 0,
    text: "hello world",
    faker: false,
    labelProblem: undefined,
    landName: "mock",
    user: {
      name: "Liu",
      id: 999,
      type: "normal",
    },
    heights: [155, 168, 174, 182, 197],
    studentNames: new Set(["Jackie Chan", "Jet Li"]),
    info: new Map([
      ["name", "Li"],
      ["sex", "man"],
    ]),
    addOrSubtract() {
      store.count++;
    },
    async promiseLogin() {
      return Promise.resolve({ userName: "unknown" });
    },
    proxyLogin: new Proxy({ userName: "" }, {}),
  });

  const App = () => {
    const {
      count, text, faker, textProblem,
      labelProblem, landName,
      user: { name, id, type }, heights,
      studentNames, info, promiseLogin,
    } = useStore(store);

    return (
      <>
        <p>{count}</p>
        <p>{text}</p>
        <p>{faker ? "I`m faker" : "real"}</p>
        <p>{textProblem}</p>
        <p>{labelProblem ?? "beautiful world!"}</p>
        <p>{
          landName === null
            ? "The land has sunk"
            : landName === undefined
              ? "The land has disappeared"
              : landName
        }</p>
        <p>user-name:{name};id:{id};type:{type}</p>
        <p>{heights}</p>
        <p>{studentNames.has("Bruce Li") ? "BL" : "JJ"}</p>
        <p>{info.get("name") === "Chan" ? "name:Chan;sex:man" : "name:Li;sex:man"}</p>
        <button onClick={() => {
          store.count = 7;
        }}>countChange</button>
        <button onClick={() => {
          store.text = "Hello World!!!";
        }}>textChange</button>
        <button onClick={() => {
          store.faker = true;
        }}>fakerChange</button>
        <button onClick={() => {
          store.textProblem = "text no problem and exit";
        }}>textProblemChange</button>
        <button onClick={() => {
          store.labelProblem = "disaster will destroyed world! we need save earth!";
        }}>labelProblemBad</button>
        <button onClick={() => {
          store.labelProblem = undefined;
        }}>labelProblemBetter</button>
        <button onClick={() => {
          store.landName = null;
        }}>landNameDestroy</button>
        <button onClick={() => {
          store.landName = undefined;
        }}>landNameDisplay</button>
        <button onClick={() => {
          store.user = {
            ...store.user,
            type: "vip",
          };
        }}>userChange</button>
        <button onClick={() => {
          store.heights = [
            ...store.heights,
            172,
          ];
        }}>heightsChange</button>
        <button onClick={() => {
          const studentNamesTemp = new Set(studentNames);
          studentNamesTemp.add("Bruce Li");
          store.studentNames = studentNamesTemp;
        }}>studentNamesChange</button>
        <button onClick={() => {
          const infoTemp = new Map(info);
          infoTemp.set("name", "Chan");
          store.info = infoTemp;
        }}>infoChange</button>
        <button onClick={() => {
          store.addOrSubtract = () => {
            store.count--;
          };
          store.addOrSubtract();
        }}>addOrSubtractChange</button>
        <button onClick={async () => {
          const res = await promiseLogin();
          if (res.userName === "unknown") {
            store.promiseLogin = async () => (
              Promise.resolve({ userName: store.user.name })
            );
            const res2 = await store.promiseLogin();
            expect(res2.userName === "Liu").toBeTruthy();
          }
        }}>promiseLoginBtn</button>
        <button onClick={() => {
          store.proxyLogin = new Proxy({ userName: "" }, {
            get(target: { userName: string }, p: string | symbol, receiver: any): any {
              if (p === "userName") return store.user.name;
              return Reflect.set(target, p, receiver);
            },
          });
          expect(store.proxyLogin.userName === "Liu").toBeTruthy();
        }}>proxyLoginBtn</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("countChange"));
  await waitFor(() => {
    getByText("7");
  });

  fireEvent.click(getByText("textChange"));
  await waitFor(() => {
    getByText("Hello World!!!");
  });

  fireEvent.click(getByText("fakerChange"));
  await waitFor(() => {
    getByText("I`m faker");
  });

  fireEvent.click(getByText("textProblemChange"));
  await waitFor(() => {
    getByText("text no problem and exit");
  });

  fireEvent.click(getByText("labelProblemBad"));
  await waitFor(() => {
    getByText("disaster will destroyed world! we need save earth!");
  });

  fireEvent.click(getByText("labelProblemBetter"));
  await waitFor(() => {
    getByText("beautiful world!");
  });

  fireEvent.click(getByText("landNameDestroy"));
  await waitFor(() => {
    getByText("The land has sunk");
  });

  fireEvent.click(getByText("landNameDisplay"));
  await waitFor(() => {
    getByText("The land has disappeared");
  });

  fireEvent.click(getByText("userChange"));
  await waitFor(() => {
    getByText("user-name:Liu;id:999;type:vip");
  });

  fireEvent.click(getByText("heightsChange"));
  await waitFor(() => {
    getByText("155168174182197172");
  });

  fireEvent.click(getByText("studentNamesChange"));
  await waitFor(() => {
    getByText("BL");
  });

  fireEvent.click(getByText("infoChange"));
  await waitFor(() => {
    getByText("name:Chan;sex:man");
  });

  fireEvent.click(getByText("addOrSubtractChange"));
  await waitFor(() => {
    getByText("6");
  });

  fireEvent.click(getByText("promiseLoginBtn"));
  fireEvent.click(getByText("proxyLoginBtn"));
});
