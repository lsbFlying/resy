import React from "react";
import { test, expect } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { ComponentWithStore, createStore } from "../../src";

/**
 * The use of function properties
 * @description Verify the conventional use of 'pseudo-computed properties'
 */
test("functionProp-VI", async () => {
  let textProExecCounter = 0;
  let textProParamChangeExecCounter = 0;
  const store = createStore({
    count: 0,
    countChange() { this.count++; },
    text: "ok",
    getTextPro(str?: number | string) {
      textProExecCounter++;
      /**
       * In version 11, there are plans to introduce a concept aligned with JavaScript's logical understanding,
       * tentatively referred to as 'pseudo-auto-computation', which can be initially understood as 'computed properties'.
       * Here, if getTextPro functions as a computed property
       * (meaning the function getTextPro is treated as such when being destructured via useStore),
       * then 'this' is akin to the renderStore returned by useStore(store),
       * and it needs to comply with the rules of hooks usage (i.e., used at the top level).
       */
      const { text } = this;
      // Returns the final computed result for rendering.
      return `${str ?? ""}_${text}_world`;
    },
    getTextProParamChange(param?: number | string) {
      textProParamChangeExecCounter++;
      const { text } = this;
      // Returns the final computed result for rendering.
      return `${param ?? ""}_${text}_world`;
    },
  });

  class App extends ComponentWithStore<any, any> {
    store = this.connectStore(store);

    componentDidMount() {
      const { getTextPro, getTextProParamChange } = this.store;
      const value = getTextPro();
      const valueParam = getTextProParamChange();
      console.log(value, valueParam);
      expect((value as any)["$$typeof"].toString() === "Symbol(react.element)").toBeTruthy();
      expect((value as any)["type"].prototype.render.name === "render").toBeTruthy();
      expect((valueParam as any)["$$typeof"].toString() === "Symbol(react.element)").toBeTruthy();
      expect((valueParam as any)["type"].prototype.render.name === "render").toBeTruthy();
    }

    render() {
      const { count, getTextPro, getTextProParamChange } = this.store;
      return (
        <div>
          <div>count:{count}</div>
          <div>textPro:{getTextPro("none")}</div>
          <div>textProParamChange:{getTextProParamChange(count)}</div>
          <button onClick={() => store.countChange()}>
            countChange
          </button>
          <button onClick={() => store.text = "hello"}>
            textChange
          </button>
        </div>
      );
    }
  }

  const { getByText } = render(<App />);

  fireEvent.click(getByText("countChange"));
  await waitFor(() => {
    getByText("count:1");
    getByText("textPro:none_ok_world");
    getByText("textProParamChange:1_ok_world");
    expect(textProExecCounter === 1).toBeTruthy();
    expect(textProParamChangeExecCounter === 2).toBeTruthy();
  });

  fireEvent.click(getByText("textChange"));
  await waitFor(() => {
    getByText("count:1");
    getByText("textPro:none_hello_world");
    getByText("textProParamChange:1_hello_world");
    expect(textProExecCounter === 2).toBeTruthy();
    expect(textProParamChangeExecCounter === 3).toBeTruthy();
  });
});
