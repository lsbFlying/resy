"use strict";

if (process.env.NODE_ENV === "production") {
  // eslint-disable-next-line import/extensions,@typescript-eslint/no-require-imports
  module.exports = require("./dist/resy.cjs.prod.js");
} else {
  // eslint-disable-next-line import/extensions,@typescript-eslint/no-require-imports
  module.exports = require("./dist/resy.cjs.js");
}
