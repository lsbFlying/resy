// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

/** ESM start */
const entryEsIndexFilePath = path.resolve(__dirname, "./dist/esm/index.js");
const esContent = `"use strict"

if (process.env.NODE_ENV === "production") {
  module.exports = require("./resy.prod.js");
} else {
  module.exports = require("./resy.js");
}`;
fs.writeFileSync(entryEsIndexFilePath, esContent);
/** ESM end */

/** UMD/System start */
const entryUmdFilePath = path.resolve(__dirname, "./dist/umd/index.js");
const entrySystemFilePath = path.resolve(__dirname, "./dist/system/index.js");
const umdSystemContent = `"use strict"

if (process.env.NODE_ENV === "production") {
  module.exports = require("./resy.prod.js");
} else {
  module.exports = require("./resy.js");
}`;
fs.writeFileSync(entryUmdFilePath, umdSystemContent);
fs.writeFileSync(entrySystemFilePath, umdSystemContent);
/** UMD/System end */
