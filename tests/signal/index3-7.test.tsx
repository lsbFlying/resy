import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createSignals, useSignalsEffect } from "../../src";

/**
 * @description Test scenarios for useSignalsEffect
 * Test the ability of useSignalsEffect's dependency to automatically track signal-type data.
 * Complex scenarios such as conditional statements, etc.
 */
test("signal-III-7", async () => {

  const store = createSignals({
    count: 0,
    text: "hello",
    age: 12,
    name: "Bob",
    winner: "it`s me",
    id: "001",
  });

  let renderCounter1 = 0;
  let effectSignalCounter1 = 0;
  let effectSignalCounter2 = 0;
  let effectSignalCounter3 = 0;
  const App = () => {
    renderCounter1++;
    const {
      count, text, age,
      name, winner, id,
    } = store.signals;

    useSignalsEffect(() => {
      console.log("useSignalsEffect => count:", count.value, age.value, winner.falsy);
      effectSignalCounter1++;
    });

    useSignalsEffect(() => {
      console.log("useSignalsEffect => text:", text.value, name.typeOf(), winner.truthy);
      effectSignalCounter2++;
    });

    /** More complex mixed scenario conditions */
    useSignalsEffect(() => {
      if (count.value <= 1) {
        const temp = winner.value ? text.value : age.value;
        console.log("temp:", temp);
      } else {
        const temp = winner.value ? name.value : id.value;
        console.log("temp:", temp);
      }
      effectSignalCounter3++;
    });

    return (
      <>
        <p>count:{count}</p>
        <p>text:{text}</p>
        <p>age:{age}</p>
        <p>name:{name}</p>
        <p>winner:{winner}</p>
        <p>id:{id}</p>
        <button
          onClick={() => {
            store.count++;
            store.age++;
          }}
        >
          change1
        </button>
        <button
          onClick={() => {
            store.text = "world";
            store.name = "Liu";
          }}
        >
          change2
        </button>
        <button
          onClick={() => {
            store.text = "ok";
          }}
        >
          change3
        </button>
        <button
          onClick={() => {
            store.count++;
            store.text = "fun";
            store.name = "Shan Bao";
          }}
        >
          change4
        </button>
        <button
          onClick={() => {
            store.winner = "";
            store.age++;
          }}
        >
          change5
        </button>
        <button
          onClick={() => {
            store.winner = "right";
            store.id = "002";
          }}
        >
          change6
        </button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("change1"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalCounter1 === 2).toBeTruthy();
    expect(effectSignalCounter2 === 1).toBeTruthy();
    expect(effectSignalCounter3 === 2).toBeTruthy();
    getByText("count:1");
    getByText("text:hello");
    getByText("age:13");
    getByText("name:Bob");
    getByText("winner:it`s me");
    getByText("id:001");
  });
  fireEvent.click(getByText("change1"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalCounter1 === 3).toBeTruthy();
    expect(effectSignalCounter2 === 1).toBeTruthy();
    expect(effectSignalCounter3 === 3).toBeTruthy();
    getByText("count:2");
    getByText("text:hello");
    getByText("age:14");
    getByText("name:Bob");
    getByText("winner:it`s me");
    getByText("id:001");
  });

  fireEvent.click(getByText("change2"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalCounter1 === 3).toBeTruthy();
    expect(effectSignalCounter2 === 2).toBeTruthy();
    expect(effectSignalCounter3 === 4).toBeTruthy();
    getByText("count:2");
    getByText("text:world");
    getByText("age:14");
    getByText("name:Liu");
    getByText("winner:it`s me");
    getByText("id:001");
  });
  fireEvent.click(getByText("change3"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalCounter1 === 3).toBeTruthy();
    expect(effectSignalCounter2 === 3).toBeTruthy();
    expect(effectSignalCounter3 === 5).toBeTruthy();
    getByText("count:2");
    getByText("text:ok");
    getByText("age:14");
    getByText("name:Liu");
    getByText("winner:it`s me");
    getByText("id:001");
  });

  fireEvent.click(getByText("change4"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalCounter1 === 4).toBeTruthy();
    expect(effectSignalCounter2 === 4).toBeTruthy();
    expect(effectSignalCounter3 === 6).toBeTruthy();
    getByText("count:3");
    getByText("text:fun");
    getByText("age:14");
    getByText("name:Shan Bao");
    getByText("winner:it`s me");
    getByText("id:001");
  });

  fireEvent.click(getByText("change5"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalCounter1 === 5).toBeTruthy();
    expect(effectSignalCounter2 === 5).toBeTruthy();
    expect(effectSignalCounter3 === 7).toBeTruthy();
    getByText("count:3");
    getByText("text:fun");
    getByText("age:15");
    getByText("name:Shan Bao");
    getByText("winner:");
    getByText("id:001");
  });
  fireEvent.click(getByText("change6"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalCounter1 === 6).toBeTruthy();
    expect(effectSignalCounter2 === 6).toBeTruthy();
    expect(effectSignalCounter3 === 8).toBeTruthy();
    getByText("count:3");
    getByText("text:fun");
    getByText("age:15");
    getByText("name:Shan Bao");
    getByText("winner:right");
    getByText("id:002");
  });
});
