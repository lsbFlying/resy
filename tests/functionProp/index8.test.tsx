import React, { useEffect } from "react";
import { test, expect } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createStore } from "../../src";

/**
 * The use of function properties
 * @description Verify the conventional use of 'pseudo-computed properties'
 */
test("functionProp-V", async () => {
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

  const App = () => {
    const { count, getTextPro, getTextProParamChange } = store.useStore();

    useEffect(() => {
      const value = getTextPro();
      const valueParam = getTextProParamChange();
      expect((value as any)["$$typeof"].toString() === "Symbol(react.element)").toBeTruthy();
      expect((value as any)["type"]["$$typeof"].toString() === "Symbol(react.memo)").toBeTruthy();
      expect((valueParam as any)["$$typeof"].toString() === "Symbol(react.element)").toBeTruthy();
      expect((valueParam as any)["type"]["$$typeof"].toString() === "Symbol(react.memo)").toBeTruthy();
    }, []);

    return (
      <div>
        <div>count:{count}</div>
        {/**
         * However, unlike Vue's computed properties,
         * Resy adopts a feature that closely aligns with the native understanding of JavaScript.
         * Computed properties are, after all, functions; thus, in this case, the function invocation approach is utilized.
         */}
        <div>textPro:{getTextPro("none")}</div>
        <div>textProParamChange:{getTextProParamChange(count)}</div>
        <button
          onClick={() => {
            /**
             * countChange is not treated as a computed property and does not need to be destructured from useStore.
             * Calling it directly through the store, it is then used as an action.
             */
            store.countChange();
          }}
        >
          countChange
        </button>
        <button
          onClick={() => {
            // When updating text here, getTextPro acts as a computed property and will update the rendering of the App component.
            store.text = "hello";
          }}
        >
          textChange
        </button>
      </div>
    );
  };

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
