import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore, useStore } from "../../src";

/** The simplest basic use */
test("delete update", async () => {
  type Store = {
    count?: number;
    text?: string;
    faker?: boolean;
    user?: {
      name: string;
      id: number;
      type: "normal" | "vip";
    };
    heights?: number[];
    studentNames?: Set<string>;
    info?: Map<string, string>;
    testFun?(): void;
    proxyLogin?: { userName: string };
  };

  const store = createStore<Store>({
    count: 0,
    text: "hello world",
    faker: false,
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
    testFun() {
      console.log("testFun");
    },
    proxyLogin: new Proxy({ userName: "" }, {}),
  });

  let counter = 0;

  const App = () => {
    const {
      count, text, faker, user,
      heights, studentNames, info,
      testFun, proxyLogin,
    } = useStore(store);
    counter++;
    return (
      <>
        <p>{count ?? -999}</p>
        <p>{text ?? "no-text"}</p>
        <p>{faker ?? "no-faker"}</p>
        <p>{user?.name ?? "no-user"}</p>
        <p>{heights ?? "no-heights"}</p>
        <p>{studentNames?.has("Jet Li") ? "Jet Li" : "no-studentNames"}</p>
        <p>{info?.get("name") ?? "no-info"}</p>
        <p>{testFun ? "testFun" : "no-testFun"}</p>
        <p>{proxyLogin?.userName ?? "no-proxyLogin"}</p>
        <button onClick={() => {
          delete store.count;
          delete store.text;
          delete store.faker;
          delete store.user;
          delete store.heights;
          delete store.studentNames;
          delete store.info;
          delete store.testFun;
          delete store.proxyLogin;
        }}>deleteAction</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("deleteAction"));
  await waitFor(() => {
    getByText("-999");
    getByText("no-text");
    getByText("no-faker");
    getByText("no-user");
    getByText("no-heights");
    getByText("no-studentNames");
    getByText("no-info");
    getByText("no-testFun");
    getByText("no-proxyLogin");
    expect(counter === 2).toBeTruthy();
  });
});
