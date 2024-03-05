import React from "react";
import { expect, test } from "vitest";
import { render } from "@testing-library/react";
import { ComponentWithStore, PureComponentWithStore, createStore } from "../../src";

/** Basic usage of class components */
test("classConnect-I", async () => {
  type Store = {
    count: number;
  };

  const store = createStore<Store>({
    count: 0,
  });

  class App extends ComponentWithStore {

    store = this.connectStore(store);

    componentDidMount() {
      // @ts-ignore
      expect(() => this.connectStore(0)).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(1)).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore("")).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore("999")).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore({})).toThrowError();
      // @ts-ignore
      // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
      expect(() => this.connectStore(() => {})).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore([])).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(null)).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(undefined)).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(Symbol())).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(NaN)).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(false)).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(true)).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(new Map())).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(new Set())).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(new WeakMap())).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(new WeakSet())).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(new WeakRef({}))).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(new RegExp())).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(new Date())).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(BigInt("8274687346853"))).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(window)).toThrowError();
    }

    render() {
      const { count } = this.store;
      return (
        <p>{count}</p>
      );
    }
  }

  class PureApp extends PureComponentWithStore {

    store = this.connectStore(store);

    componentDidMount() {
      // @ts-ignore
      expect(() => this.connectStore(0)).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(1)).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore("")).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore("999")).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore({})).toThrowError();
      // @ts-ignore
      // eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
      expect(() => this.connectStore(() => {})).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore([])).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(null)).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(undefined)).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(Symbol())).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(NaN)).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(false)).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(true)).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(new Map())).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(new Set())).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(new WeakMap())).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(new WeakSet())).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(new WeakRef({}))).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(new RegExp())).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(new Date())).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(BigInt("8274687346853"))).toThrowError();
      // @ts-ignore
      expect(() => this.connectStore(window)).toThrowError();
    }

    render() {
      const { count } = this.store;
      return (
        <p>{count}</p>
      );
    }
  }

  render(
    <>
      <App />
      <PureApp />
    </>
  );
});
