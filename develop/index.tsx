import React from "react";
import ReactDOM from "react-dom/client";
// import Comp from "./App";
// import Comp from "./listApp";
// import Comp from "./mapApp";
// import Comp from "./setApp";
import Comp from "./devApp";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <>
    {/* <React.StrictMode><Comp /></React.StrictMode> */}
    <Comp />
  </>
);

/**
 * next-version_notes:
 * break change:
 * 1、removed setOptions and getOptions.
 * setOptions不利于状态管理的安全性考虑，getOptions没必要，删繁就简。
 * 2、ComponentWithStore直接底层继承PureComponent，直接优化一把梭，如果有性能问题直接骂react
 * 移除PureComponentWithStore降低使用心智。
 */
