import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createSignals, signalsComputed } from "../../src";

/** Normal operation of signal mode */
test("signal-I-4", async () => {

  const store = createSignals({
    count: 0,
    doubleCount() {
      return this.count * 2;
    },
    text: "hello",
    increase() {
      this.count++;
    },
    info: {
      name: "John Doe",
    } as any,
    names: [1, 2],
    workerNumbers: new Set<number>().add(666).add(888),
  });

  let renderCounter = 0;

  const App = () => {
    renderCounter++;
    const {
      count, doubleCount, text,
      increase, info, names,
      workerNumbers,
    } = store.signals;

    return (
      <>
        <p>count:{count}</p>
        <p>doubleCount:{doubleCount()}</p>
        <p>text:{text}</p>
        <p>toString:{signalsComputed(() => {
          return Object.prototype.toString.call(count);
        })}</p>
        <p>info-name:{signalsComputed(() => {
          return "name" in info ? "John Doe" : "unknown";
        })}</p>
        <p>names:{signalsComputed(() => {
          return `${names.join("")}_${text.value}`;
        })}</p>
        <p>workerNumbers:{signalsComputed(() => {
          return `${workerNumbers.size}_${text.value}`;
        })}</p>
        <button
          onClick={() => {
            store.count++;
          }}
        >
          add
        </button>
        <button
          onClick={() => {
            store.count--;
          }}
        >
          subtract
        </button>
        <button
          onClick={() => {
            store.text = "world";
            store.names = [2, 3];
            store.workerNumbers = new Set<number>().add(8).add(2).add(3);
          }}
        >
          textChange
        </button>
        <button
          onClick={increase}
        >
          increase-apply
        </button>
        <button
          onClick={() => {
            increase.bind(null)();
          }}
        >
          increase-bind
        </button>
        <button
          onClick={() => {
            increase.call(null);
          }}
        >
          increase-call
        </button>
        <button
          onClick={() => {
            store.info = {
              age: 12,
            };
          }}
        >
          infoChange
        </button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("add"));
  await waitFor(() => {
    console.log("renderCounter:", renderCounter);
    expect(renderCounter === 1).toBeTruthy();
    getByText("count:1");
    getByText("doubleCount:2");
    getByText("text:hello");
    getByText("toString:[object Number]");
    getByText("info-name:John Doe");
    getByText("names:12_hello");
    getByText("workerNumbers:2_hello");
  });

  fireEvent.click(getByText("subtract"));
  await waitFor(() => {
    console.log("renderCounter:", renderCounter);
    expect(renderCounter === 1).toBeTruthy();
    getByText("count:0");
    getByText("doubleCount:0");
    getByText("text:hello");
    getByText("toString:[object Number]");
    getByText("info-name:John Doe");
    getByText("names:12_hello");
    getByText("workerNumbers:2_hello");
  });

  fireEvent.click(getByText("textChange"));
  await waitFor(() => {
    console.log("renderCounter:", renderCounter);
    expect(renderCounter === 1).toBeTruthy();
    getByText("count:0");
    getByText("doubleCount:0");
    getByText("text:world");
    getByText("toString:[object Number]");
    getByText("info-name:John Doe");
    getByText("names:23_world");
    getByText("workerNumbers:3_world");
  });

  fireEvent.click(getByText("increase-apply"));
  await waitFor(() => {
    console.log("renderCounter:", renderCounter);
    expect(renderCounter === 1).toBeTruthy();
    getByText("count:1");
    getByText("doubleCount:2");
    getByText("text:world");
    getByText("toString:[object Number]");
    getByText("info-name:John Doe");
    getByText("names:23_world");
    getByText("workerNumbers:3_world");
  });

  fireEvent.click(getByText("increase-bind"));
  await waitFor(() => {
    console.log("renderCounter:", renderCounter);
    expect(renderCounter === 1).toBeTruthy();
    getByText("count:2");
    getByText("doubleCount:4");
    getByText("text:world");
    getByText("toString:[object Number]");
    getByText("info-name:John Doe");
    getByText("names:23_world");
    getByText("workerNumbers:3_world");
  });

  fireEvent.click(getByText("increase-call"));
  await waitFor(() => {
    console.log("renderCounter:", renderCounter);
    expect(renderCounter === 1).toBeTruthy();
    getByText("count:3");
    getByText("doubleCount:6");
    getByText("text:world");
    getByText("toString:[object Number]");
    getByText("info-name:John Doe");
    getByText("names:23_world");
    getByText("workerNumbers:3_world");
  });

  fireEvent.click(getByText("infoChange"));
  await waitFor(() => {
    console.log("renderCounter:", renderCounter);
    expect(renderCounter === 1).toBeTruthy();
    getByText("count:3");
    getByText("doubleCount:6");
    getByText("text:world");
    getByText("toString:[object Number]");
    getByText("info-name:unknown");
    getByText("names:23_world");
    getByText("workerNumbers:3_world");
  });
});
