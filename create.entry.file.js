// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

/** ESM start */
const entryEsmIndexFilePath = path.resolve(__dirname, "./dist/esm/index.js");
const esContent = `"use strict";

if (process.env.NODE_ENV === "production") {
  module.exports = require("./resy.prod.js");
} else {
  module.exports = require("./resy.js");
}`;
fs.writeFileSync(entryEsmIndexFilePath, esContent);
/** ESM end */

/** UMD/System start */
const entryUmdIndexFilePath = path.resolve(__dirname, "./dist/umd/index.js");
const entrySystemIndexFilePath = path.resolve(__dirname, "./dist/system/index.js");
const umdSystemContent = `"use strict";

if (process.env.NODE_ENV === "production") {
  module.exports = require("./resy.prod.js");
} else {
  module.exports = require("./resy.js");
}`;
fs.writeFileSync(entryUmdIndexFilePath, umdSystemContent);
fs.writeFileSync(entrySystemIndexFilePath, umdSystemContent);
/** UMD/System end */
