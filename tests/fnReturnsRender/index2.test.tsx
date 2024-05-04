import React from "react";
import { test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { ConciseStoreHeart, useConciseState } from "../../src";

/** Function returns rendering */
test("fnReturnsRender-II", async () => {
  type Store = {
    count: number;
    doubleCount(): number;
    text: string;
    getTextPro(): string;
    firstName: string;
    fullName(): string;
  };

  const Count = (props: ConciseStoreHeart<Store>) => {
    const { store } = props;
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

  const Text = (props: ConciseStoreHeart<Store>) => {
    const { store } = props;
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

  const Name = (props: ConciseStoreHeart<Store>) => {
    const { store } = props;
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

  const App = () => {
    const { store } = useConciseState<Store>({
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
    return (
      <>
        <Count store={store} />
        <Text store={store} />
        <Name store={store} />
      </>
    );
  };

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
