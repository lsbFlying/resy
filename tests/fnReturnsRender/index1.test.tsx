import React from "react";
import { test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore } from "../../src";

/** Function returns rendering */
test("fnReturnsRender-I", async () => {
  type Store = {
    count: number;
    doubleCount(): number;
    text: string;
    getTextPro(): string;
    firstName: string;
    fullName(): string;
  };

  const store = createStore<Store>({
    count: 0,
    doubleCount() {
      const { count } = this.useStore();
      return count * 2;
    },
    text: "ok",
    getTextPro() {
      const { text } = this.useStore();
      return `${text}-world`;
    },
    firstName: "Bao",
    fullName() {
      return `Liu${this.firstName}`;
    },
  });

  const Count = () => {
    // Since the count state data is not referenced within store.useStore(),
    // the count referenced inside the doubleCount function also needs to be obtained from useStore
    // if it is to have an effect on updating the rendering.
    const { doubleCount } = store.useStore();

    return (
      <>
        <p>doubleCount:{doubleCount()}</p>
        <button onClick={() => {
          store.count++;
        }}>count-change</button>
      </>
    );
  };

  const Text = () => {
    // The getTextPro function internally calls useStore,
    // so here, even when directly using store,
    // there will be an effect on state updating and rendering.
    const { getTextPro } = store;

    return (
      <>
        <p>{getTextPro()}</p>
        <button onClick={() => {
          store.text = "hello";
        }}>text-change</button>
      </>
    );
  };

  const Name = () => {
    // Because the fullName function internally references firstName,
    // there is no need for the fullName function to intentionally call useStore to track the state.
    const { firstName, fullName } = store.useStore();

    return (
      <>
        <p>firstName:{firstName}</p>
        <p>fullName:{fullName()}</p>
        <button onClick={() => {
          store.firstName = "ShanBao";
        }}>name-change</button>
      </>
    );
  };

  const App = () => (
    <>
      <Count />
      <Text />
      <Name />
    </>
  );

  const { getByText } = render(<App />);

  fireEvent.click(getByText("count-change"));
  await waitFor(() => {
    getByText("doubleCount:2");
  });

  fireEvent.click(getByText("text-change"));
  await waitFor(() => {
    getByText("hello-world");
  });

  fireEvent.click(getByText("name-change"));
  await waitFor(() => {
    getByText("fullName:LiuShanBao");
  });
});
