import React from "react";
import { expect, test } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { createSignals, signalsComputed } from "../../src";

/** The use of arrays and array chain indexing operations in signal mode */
test("signal-IV-3", async () => {

  const store = createSignals({
    names: ["张三", "李四", "王五"],
    infos: [
      {
        name: "张三",
        age: 22,
        address: {
          country: "China",
          province: "Anhui",
          city: "LiuAn",
        },
      },
      {
        name: "李四",
        age: 24,
        address: {
          country: "China",
          province: "Anhui",
          city: "HeFei",
        },
      },
      {
        name: "王五",
        age: 26,
        address: {
          country: "China",
          province: "Anhui",
          city: "HuangShan",
        },
      },
    ],
  });

  let renderCounter = 0;

  const App = () => {
    renderCounter++;

    const { names, infos } = store.signals;

    return (
      <>
        <div>names:{names}</div>
        <div>names-concat:{(names as string[]).concat(["小宝"])}</div>
        <div>names-filter:{names.filter(item => item !== "小李")}</div>
        <div>names-rest:{signalsComputed(() => [...names])}</div>
        <div>names-rest-concat:{signalsComputed(() => [...names.value].concat(["小宝"]))}</div>
        <div>names-rest-filter:{signalsComputed(() => [...names.value].filter(item => item !== "小李"))}</div>
        <div>
          {
            names.map(item => {
              return (
                <div key={item}>map-name-item:{item}</div>
              );
            })
          }
        </div>
        <div>
          filter-name:{names.filter(item => item !== "小李")}
        </div>
        <div>
          {
            infos.map((item, index) => {
              const { country, province, city } = item.address;
              return (
                <React.Fragment key={`${item.name}${index}`}>
                  <div>info-item-name:{item.name}</div>
                  <div>info-item-age:{item.age}</div>
                  <div>info-item-address:{country}-{province}-{city}</div>
                </React.Fragment>
              );
            })
          }
        </div>
        <button
          onClick={() => {
            store.names = ["小明", "小红", "小李", "小林"];
          }}
        >
          namesChange
        </button>
        <button
          onClick={() => {
            store.infos = [
              {
                name: "小明",
                age: 24,
                address: {
                  country: "China",
                  province: "JiangSu",
                  city: "NanJing",
                },
              },
              {
                name: "小红",
                age: 25,
                address: {
                  country: "China",
                  province: "JiangSu",
                  city: "SuZhou",
                },
              },
              {
                name: "小李",
                age: 23,
                address: {
                  country: "China",
                  province: "JiangSu",
                  city: "WuXi",
                },
              },
              {
                name: "小林",
                age: 27,
                address: {
                  country: "China",
                  province: "AnHui",
                  city: "LiuAn",
                },
              },
            ];
          }}
        >
          infosChange
        </button>
      </>
    );
  };

  const { getByText } = render(<App />);

  fireEvent.click(getByText("namesChange"));
  await waitFor(() => {
    expect(renderCounter === 1).toBeTruthy();
    getByText("names:小明小红小李小林");
    getByText("names-concat:小明小红小李小林小宝");
    getByText("names-filter:小明小红小林");
    getByText("names-rest:小明小红小李小林");
    getByText("names-rest-concat:小明小红小李小林小宝");
    getByText("names-rest-filter:小明小红小林");
    getByText("map-name-item:小明");
    getByText("map-name-item:小红");
    getByText("map-name-item:小李");
    getByText("map-name-item:小林");

    getByText("filter-name:小明小红小林");
  });

  fireEvent.click(getByText("infosChange"));
  await waitFor(() => {
    expect(renderCounter === 1).toBeTruthy();
    getByText("names:小明小红小李小林");
    getByText("names-concat:小明小红小李小林小宝");
    getByText("names-filter:小明小红小林");
    getByText("names-rest:小明小红小李小林");
    getByText("names-rest-concat:小明小红小李小林小宝");
    getByText("names-rest-filter:小明小红小林");
    getByText("map-name-item:小明");
    getByText("map-name-item:小红");
    getByText("map-name-item:小李");
    getByText("map-name-item:小林");

    getByText("filter-name:小明小红小林");

    getByText("info-item-name:小明");
    getByText("info-item-name:小红");
    getByText("info-item-name:小李");
    getByText("info-item-name:小林");

    getByText("info-item-age:24");
    getByText("info-item-age:25");
    getByText("info-item-age:23");
    getByText("info-item-age:27");

    getByText("info-item-address:China-JiangSu-NanJing");
    getByText("info-item-address:China-JiangSu-SuZhou");
    getByText("info-item-address:China-JiangSu-WuXi");
    getByText("info-item-address:China-AnHui-LiuAn");
  });
});
