import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore } from "../../src";

/** Use mode of setState */
test("setState-I", async () => {
  const store = createStore({
    text: "world",
  });

  const App = () => {
    const { text } = store.useData;
    return (
      <>
        <p>{text}</p>
        <button onClick={() => {
          store.setState({
            text: "hello",
          });
        }}>changeText1</button>
        <button onClick={() => {
          // Compatible with null, no updates
          store.setState(null);
        }}>changeText2</button>
        <button onClick={() => {
          store.setState(prevState => {
            if (prevState.text === "hello") {
              return {
                text: "hello world",
              };
            }
            return null;
          });
          store.setState(prevState => {
            // Thus it can be seen that prevState is the state before a certain round of update batch.
            expect(prevState.text === "hello").toBeTruthy();
            if (prevState.text === "hello") {
              return {
                text: "hello world twice change",
              };
            }
            return null;
          });
        }}>changeText3</button>
        <button onClick={() => {
          // empty object, no updates
          store.setState({});
        }}>changeText4</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("changeText1"));
  await waitFor(() => {
    getByText("hello");
  });

  fireEvent.click(getByText("changeText2"));
  await waitFor(() => {
    getByText("hello");
  });

  fireEvent.click(getByText("changeText3"));
  await waitFor(() => {
    getByText("hello world twice change");
  });

  fireEvent.click(getByText("changeText4"));
  await waitFor(() => {
    getByText("hello world twice change");
  });
});
