import { expect, test } from "vitest";
import { createStore } from "../../src";

/** The rare scene basic use */
test("rareSceneBasic", async () => {
  const obj1 = {
    count: 1,
    get value() {
      return this.count;
    },
  };
  const obj2: any = {
    count: 9,
  };
  Object.setPrototypeOf(obj2, obj1);
  console.log("obj2.value:", obj2.value, "obj1.value:", obj1.value);
  expect(obj2.value === 9).toBeTruthy();
  expect(obj1.value === 1).toBeTruthy();

  type Store = {
    count: number;
    value: number;
    getCount(): number;
  };

  const store = createStore<Store>({
    count: 0,
    get value() {
      console.log("get Value this:", this);
      return this.count;
    },
    getCount() {
      return this.count;
    },
  });

  const storeTemp: any = {
    count: 9,
  };
  Object.setPrototypeOf(storeTemp, store);
  const storeTempValue = storeTemp.value;
  console.log("storeTemp.value:", storeTempValue, "store.value:", store.value);
  expect(storeTempValue === 0).toBeTruthy();
  expect(store.value === 0).toBeTruthy();

  const storeTempGetCount = storeTemp.getCount();
  console.log("storeTemp.getCount:", storeTempGetCount);
  expect(storeTempGetCount === 0).toBeTruthy();
});
