import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createSignals, useSignalsComputed } from "../../src";

/** Test the usage scenarios of signalsComputed */
test("signal-V-1", async () => {

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
  const App = () => {
    renderCounter1++;
    const { count, text } = normalStore.signals;
    const { age, name } = infoStore.signals;
    const { id, type } = userStore.signals;

    const computedCountText = useSignalsComputed(() => {
      effectSignalCounter1++;
      return `${count.value}_${text.value}`;
    });

    const computedNameAge = useSignalsComputed(() => {
      effectSignalCounter2++;
      if (count.value <= 1) {
        return name.value;
      } else {
        return age.value;
      }
    });

    const computedNameTypeId = useSignalsComputed(() => {
      effectSignalCounter3++;
      if (count.value <= 1) {
        return name.value;
      } else {
        return type.value === "S_VIP" ? id.value : type.value;
      }
    });

    return (
      <>
        <p>count:{count}</p>
        <p>text:{text}</p>
        <p>age:{age}</p>
        <p>name:{name}</p>
        <p>id:{id}</p>
        <p>type:{type}</p>
        <p>computedCountText:{computedCountText}</p>
        <p>computedNameAge:{computedNameAge}</p>
        <p>computedNameTypeId:{computedNameTypeId}</p>
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
    getByText("computedCountText:1_hello");
    getByText("computedNameAge:Bob");
    getByText("computedNameTypeId:Bob");
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
    getByText("computedCountText:1_world");
    getByText("computedNameAge:Bob");
    getByText("computedNameTypeId:Bob");
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
    getByText("computedCountText:1_world");
    getByText("computedNameAge:Bao");
    getByText("computedNameTypeId:Bao");
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
    getByText("computedCountText:2_world");
    getByText("computedNameAge:12");
    getByText("computedNameTypeId:VIP");
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
    getByText("computedCountText:2_world");
    getByText("computedNameAge:28");
    getByText("computedNameTypeId:VIP");
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
    getByText("computedCountText:2_world");
    getByText("computedNameAge:28");
    getByText("computedNameTypeId:1");
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
    getByText("computedCountText:2_world");
    getByText("computedNameAge:28");
    getByText("computedNameTypeId:666");
  });
});
