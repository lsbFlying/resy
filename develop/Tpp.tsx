import React, {
// Component,
} from "react";
import {
  // ComponentWithStore,
  // createSignals,
  createSignals,
  // signal,
} from "../src";

const A = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean",
  "elegant", "easy", "angry", "crazy", "helpful", "mushy", "odd", "unsightly", "adorable", "important", "inexpensive",
  "cheap", "expensive", "fancy"];
const C = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange"];
const N = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger", "pizza", "mouse",
  "keyboard"];

const random = (max: number) => Math.round(Math.random() * 1000) % max;

let nextId = 1;
export const buildData = (count: number) => {
  const data = new Array(count);

  for (let i = 0; i < count; i++) {
    data[i] = {
      id: nextId++,
      label: `${A[random(A.length)]} ${C[random(C.length)]} ${N[random(N.length)]}`,
    };
  }

  return data;
};

const initialState = {
  data: [] as any[],
  selected: 0 as number,
  row(item: any) {
    // console.log(123123, this.selected, item.id);
    return (
      <tr key={item.id} className={this.selected === item.id ? "danger" : ""}>
        <td className="col-md-1">{item.id}</td>
        <td className="col-md-4">
          <a onClick={() => this.selected = item.id}>
            {item.label}
          </a>
        </td>
        <td className="col-md-1">
          <a
            onClick={() => {
              const { data } = this;
              const idx = data.findIndex(d => d.id === item.id);
              this.data = data.slice(0, idx).concat(data.slice(idx + 1));
            }}
          >
            X
          </a>
        </td>
        <td className="col-md-6" />
      </tr>
    );
  },
};

const store = createSignals(initialState);

const RowList = () => {
  const { data, row } = store.signals;
  return data.map(item => row(item));
};

const Tpp = () => (
  <div className="container">
    <div className="jumbotron">
      <div className="row">
        <div className="col-md-6"><h1>Resy</h1></div>
        <div className="col-md-6">
          <div className="row">
            <div className="col-sm-6 smallpad">
              <button
                id="run"
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => {
                  store.data = buildData(1000);
                  store.selected = 0;
                }}
              >
                Create 1,000 rows
              </button>
            </div>
            <div className="col-sm-6 smallpad">
              <button
                id="runlots"
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => {
                  store.data = buildData(10000);
                  store.selected = 0;
                }}
              >
                Create 10,000 rows
              </button>
            </div>
            <div className="col-sm-6 smallpad">
              <button
                id="add"
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => {
                  store.data = store.data.concat(buildData(1000));
                }}
              >
                Append 1,000 rows
              </button>
            </div>
            <div className="col-sm-6 smallpad">
              <button
                id="update"
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => {
                  const data = store.data.slice();
                  for (let i = 0; i < data.length; i += 10) {
                    const r = data[i];
                    data[i] = { id: r.id, label: r.label + " !!!" };
                  }
                  store.data = data;
                }}
              >
                Update every 10th row
              </button>
            </div>
            <div className="col-sm-6 smallpad">
              <button
                id="clear"
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => {
                  store.data = [];
                  store.selected = 0;
                }}
              >
                Clear
              </button>
            </div>
            <div className="col-sm-6 smallpad">
              <button
                id="swaprows"
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => {
                  const d = store.data.slice();
                  if (d.length > 998) {
                    const tmp = d[1];
                    d[1] = d[998];
                    d[998] = tmp;
                    store.data = d;
                  }
                }}
              >
                Swap Rows
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <table className="table table-hover table-striped test-data">
      <tbody>
        <RowList />
      </tbody>
    </table>
    <span className="preloadicon glyphicon glyphicon-remove" aria-hidden="true" />
  </div>
);

export default Tpp;
