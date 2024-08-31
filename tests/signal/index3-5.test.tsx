import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createSignals, useSignalsEffect } from "../../src";

/**
 * @description Test scenarios for useSignalsEffect
 * Test the ability of useSignalsEffect's dependency to automatically track signal-type data
 */
test("signal-III-5", async () => {

  const store = createSignals({
    count: 0,
    text: "hello",
    age: 12,
    name: "Bob",
    winner: "it`s me",
  });

  let renderCounter1 = 0;
  let effectSignalCounter1 = 0;
  let effectSignalCounter2 = 0;
  let effectSignalCounter3 = 0;

  /** Complex mixed use scenarios */
  const App = () => {
    renderCounter1++;
    const {
      count, text, age, name, winner,
    } = store.signals;

    useSignalsEffect(() => {
      console.log("useSignalsEffect => count:", count.value, age.value, winner.falsy);
      effectSignalCounter1++;
    });

    useSignalsEffect(() => {
      console.log("useSignalsEffect => text:", text.value, name.typeOf(), winner.truthy);
      effectSignalCounter2++;
    });

    useSignalsEffect(() => {
      console.log("useSignalsEffect", count.value, text.value, age.value, name.value, winner.value);
      effectSignalCounter3++;
    });

    return (
      <>
        <p>count:{count}</p>
        <p>text:{text}</p>
        <p>age:{age}</p>
        <p>name:{name}</p>
        <p>winner:{winner}</p>
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
          }}
        >
          change4
        </button>
        <button
          onClick={() => {
            store.winner = "right";
          }}
        >
          change5
        </button>
        <button
          onClick={() => {
            store.winner = "";
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
    getByText("name:Liu");
    getByText("winner:it`s me");
  });

  fireEvent.click(getByText("change5"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalCounter1 === 5).toBeTruthy();
    expect(effectSignalCounter2 === 5).toBeTruthy();
    expect(effectSignalCounter3 === 7).toBeTruthy();
    getByText("count:3");
    getByText("text:fun");
    getByText("age:14");
    getByText("name:Liu");
    getByText("winner:right");
  });
  fireEvent.click(getByText("change6"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalCounter1 === 6).toBeTruthy();
    expect(effectSignalCounter2 === 6).toBeTruthy();
    expect(effectSignalCounter3 === 8).toBeTruthy();
    getByText("count:3");
    getByText("text:fun");
    getByText("age:14");
    getByText("name:Liu");
    getByText("winner:");
  });
});
