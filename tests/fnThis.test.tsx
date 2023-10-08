import React from "react";
import { test } from "vitest";
import { createStore, useStore, useConciseState } from "../src";
import { fireEvent, render, waitFor } from "@testing-library/react";

type State = {
  count: number;
  text: string;
  testFnAdd(): void;
  testFnReduce(): void;
  testFnText(): void;
};

test("fnThis", async () => {
  const store = createStore<State>({
    count: 1,
    text: "Hello-resy",
    testFnAdd() {
      this.count++;
    },
    testFnReduce() {
      this.count--;
      this.testFnText();
    },
    testFnText() {
      this.text = "Hello-ok";
    },
  });

  function Count1() {
    const { testFnAdd } = store;
    return (
      <button onClick={() => { testFnAdd(); }}>
        count1-btn
      </button>
    );
  }

  function Count2() {
    const { testFnAdd } = useStore(store);
    return (
      <button onClick={() => { testFnAdd(); }}>
        count2-btn
      </button>
    );
  }

  function Count3() {
    return (
      <button onClick={() => { store.testFnReduce(); }}>
        count3-btn
      </button>
    );
  }

  function Count4() {
    const { name, changeName } = useConciseState<{name: string; changeName(): void}>({
      name: "Jack",
      changeName() { this.name = "Arosy"; },
    });
    return (
      <div>
        <p>name:{name}</p>
        <button onClick={() => { changeName(); }}>name-btn</button>
      </div>
    );
  }

  function Count5() {
    const { age, store } = useConciseState<{age: number; changeAge(): void}>({
      age: 15,
      changeAge() { this.age = 24; },
    });
    return (
      <div>
        <p>age:{age}</p>
        <button onClick={() => { store.changeAge(); }}>age-btn</button>
      </div>
    );
  }

  const App = () => {
    const { count, text } = useStore(store);
    return (
      <>
        <div>
          App:{count}
        </div>
        <div>text:{text}</div>
        <Count1 />
        <Count2 />
        <Count3 />
        <Count4 />
        <Count5 />
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("count1-btn"));
  await waitFor(() => {
    getByText("App:2");
  });

  fireEvent.click(getByText("count2-btn"));
  await waitFor(() => {
    getByText("App:3");
  });

  fireEvent.click(getByText("count3-btn"));
  await waitFor(() => {
    getByText("App:2");
    getByText("text:Hello-ok");
  });

  fireEvent.click(getByText("name-btn"));
  await waitFor(() => {
    getByText("name:Arosy");
  });

  fireEvent.click(getByText("age-btn"));
  await waitFor(() => {
    getByText("age:24");
  });
});
