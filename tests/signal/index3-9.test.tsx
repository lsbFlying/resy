import React, { useState } from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createSignals, useSignalsEffect } from "../../src";

/**
 * @description Test scenarios for useSignalsEffect
 * Test the ability of useSignalsEffect's dependency to automatically track signal-type data.
 * Use Cases for a Combined SignalStore Implementation, etc.
 * Verify whether the unmounted and restore function of signal is normal in complex scenarios.
 */
test("signal-III-9", async () => {

  const normalStore = createSignals({
    count: 0,
    text: "hello",
  });

  const infoStore = createSignals({
    age: 12,
    name: "Bob",
  });

  const userStore = createSignals({
    id: 1,
    type: "VIP",
  });

  let renderCounter1 = 0;
  let effectSignalCounter1 = 0;
  let effectSignalCounter2 = 0;
  let effectSignalCounter3 = 0;
  const Child = () => {
    renderCounter1++;
    const { count, text } = normalStore.signals;
    const { age, name } = infoStore.signals;
    const { id, type } = userStore.signals;

    useSignalsEffect(() => {
      console.log("useSignalsEffect => count:", count.value, text.value);
      effectSignalCounter1++;
    });

    useSignalsEffect(() => {
      if (count.value <= 1) {
        console.log("name:", name.value);
      } else {
        console.log("age:", age.value);
      }
      effectSignalCounter2++;
    });

    useSignalsEffect(() => {
      if (count.value <= 1) {
        console.log("name:", name.value);
      } else {
        const user = type.value === "S_VIP" ? id.value : type.value;
        console.log("user:", user);
      }
      effectSignalCounter3++;
    });

    return (
      <>
        <p>count:{count}</p>
        <p>text:{text}</p>
        <p>age:{age}</p>
        <p>name:{name}</p>
        <p>id:{id}</p>
        <p>type:{type}</p>
        <button
          onClick={() => {
            normalStore.count++;
          }}
        >
          change1
        </button>
        <button
          onClick={() => {
            normalStore.text = "world";
          }}
        >
          change2
        </button>
        <button
          onClick={() => {
            infoStore.name = "Bao";
          }}
        >
          change3
        </button>
        <button
          onClick={() => {
            normalStore.count++;
          }}
        >
          change4
        </button>
        <button
          onClick={() => {
            infoStore.age = 28;
          }}
        >
          change5
        </button>
        <button
          onClick={() => {
            userStore.type = "S_VIP";
          }}
        >
          change6
        </button>
        <button
          onClick={() => {
            userStore.id = 666;
          }}
        >
          change7
        </button>
      </>
    );
  };

  const App = () => {
    const [count, setCount] = useState(0);
    return (
      <>
        <div>AppCount:{count}</div>
        {(count === 0 || count === 2) && <Child />}
        <button
          onClick={() => {
            setCount(prevState => prevState + 1);
          }}
        >
          unmounted
        </button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("change1"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalCounter1 === 2).toBeTruthy();
    expect(effectSignalCounter2 === 2).toBeTruthy();
    expect(effectSignalCounter3 === 2).toBeTruthy();
    getByText("count:1");
    getByText("text:hello");
    getByText("age:12");
    getByText("name:Bob");
    getByText("id:1");
    getByText("type:VIP");
  });
  fireEvent.click(getByText("change2"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalCounter1 === 3).toBeTruthy();
    expect(effectSignalCounter2 === 2).toBeTruthy();
    expect(effectSignalCounter3 === 2).toBeTruthy();
    getByText("count:1");
    getByText("text:world");
    getByText("age:12");
    getByText("name:Bob");
    getByText("id:1");
    getByText("type:VIP");
  });

  fireEvent.click(getByText("change3"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalCounter1 === 3).toBeTruthy();
    expect(effectSignalCounter2 === 3).toBeTruthy();
    expect(effectSignalCounter3 === 3).toBeTruthy();
    getByText("count:1");
    getByText("text:world");
    getByText("age:12");
    getByText("name:Bao");
    getByText("id:1");
    getByText("type:VIP");
  });

  fireEvent.click(getByText("change4"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalCounter1 === 4).toBeTruthy();
    expect(effectSignalCounter2 === 4).toBeTruthy();
    expect(effectSignalCounter3 === 4).toBeTruthy();
    getByText("count:2");
    getByText("text:world");
    getByText("age:12");
    getByText("name:Bao");
    getByText("id:1");
    getByText("type:VIP");
  });

  fireEvent.click(getByText("change5"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalCounter1 === 4).toBeTruthy();
    expect(effectSignalCounter2 === 5).toBeTruthy();
    expect(effectSignalCounter3 === 4).toBeTruthy();
    getByText("count:2");
    getByText("text:world");
    getByText("age:28");
    getByText("name:Bao");
    getByText("id:1");
    getByText("type:VIP");
  });

  fireEvent.click(getByText("change6"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalCounter1 === 4).toBeTruthy();
    expect(effectSignalCounter2 === 5).toBeTruthy();
    expect(effectSignalCounter3 === 5).toBeTruthy();
    getByText("count:2");
    getByText("text:world");
    getByText("age:28");
    getByText("name:Bao");
    getByText("id:1");
    getByText("type:S_VIP");
  });

  fireEvent.click(getByText("change7"));
  await waitFor(() => {
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalCounter1 === 4).toBeTruthy();
    expect(effectSignalCounter2 === 5).toBeTruthy();
    expect(effectSignalCounter3 === 6).toBeTruthy();
    getByText("count:2");
    getByText("text:world");
    getByText("age:28");
    getByText("name:Bao");
    getByText("id:666");
    getByText("type:S_VIP");
  });

  fireEvent.click(getByText("unmounted"));
  await waitFor(() => {
    getByText("AppCount:1");
    expect(renderCounter1 === 1).toBeTruthy();
    expect(effectSignalCounter1 === 4).toBeTruthy();
    expect(effectSignalCounter2 === 5).toBeTruthy();
    expect(effectSignalCounter3 === 6).toBeTruthy();
  });

  fireEvent.click(getByText("unmounted"));
  await waitFor(() => {
    getByText("AppCount:2");
    expect(renderCounter1 === 2).toBeTruthy();
    expect(effectSignalCounter1 === 5).toBeTruthy();
    expect(effectSignalCounter2 === 6).toBeTruthy();
    expect(effectSignalCounter3 === 7).toBeTruthy();
    getByText("count:0");
    getByText("text:hello");
    getByText("age:12");
    getByText("name:Bob");
    getByText("id:1");
    getByText("type:VIP");
  });
});
