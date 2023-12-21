import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { useConciseState } from "../../src";

/** The use mode of useConciseState */
test("useConciseState-IV", async () => {
  const App = () => {
    const { count, store } = useConciseState({ count: 0 });

    return (
      <>
        <p>{count}</p>
        <button onClick={() => {
          store.setState({
            count: store.count + 1,
          });
        }}>add1</button>
        <button onClick={() => {
          store.setState(prevState => ({
            count: prevState.count + 1,
          }));
        }}>add2</button>
        <button onClick={() => {
          store.setState({
            count: 9,
          }, nextState => {
            store.setState({
              count: nextState.count + 1,
            });
          });
        }}>add3</button>
        <button onClick={() => {
          store.count++;
        }}>add4</button>
        <button onClick={() => {
          store.syncUpdate({
            count: store.count + 1,
          });
        }}>add5</button>
        <button onClick={() => {
          store.syncUpdate(prevState => ({
            count: prevState.count + 1,
          }));
        }}>add6</button>
        <button onClick={() => {
          store.syncUpdate({
            count: 99,
          }, nextState => {
            store.syncUpdate({
              count: nextState.count + 1,
            });
          });
        }}>add7</button>
        <button onClick={() => {
          store.restore(nextState => {
            expect(nextState.count === 0).toBeTruthy();
          });
        }}>restoreAction</button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("add1"));
  await waitFor(() => {
    getByText("1");
  });

  fireEvent.click(getByText("add2"));
  await waitFor(() => {
    getByText("2");
  });

  fireEvent.click(getByText("add3"));
  await waitFor(() => {
    getByText("10");
  });

  fireEvent.click(getByText("add4"));
  await waitFor(() => {
    getByText("11");
  });

  fireEvent.click(getByText("add5"));
  await waitFor(() => {
    getByText("12");
  });

  fireEvent.click(getByText("add6"));
  await waitFor(() => {
    getByText("13");
  });

  fireEvent.click(getByText("add7"));
  await waitFor(() => {
    getByText("100");
  });

  fireEvent.click(getByText("restoreAction"));
  await waitFor(() => {
    getByText("0");
  });
});
