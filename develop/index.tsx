import React from "react";
import ReactDOM from "react-dom/client";
// import Comp from "./App";
// import Comp from "./listApp";
import Comp from "./mapApp";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <>
    {/* <React.StrictMode><Comp /></React.StrictMode> */}
    <Comp />
  </>
);
