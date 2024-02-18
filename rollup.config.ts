import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import replace from "@rollup/plugin-replace";
import autoExternal from "rollup-plugin-auto-external";
import terser from "@rollup/plugin-terser";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { babel } from "@rollup/plugin-babel";

const input = "src/index.ts";
/**
 * @description Because use-sync-external-store, this package only exports CJS modules.
 * So here we need to do a separate special identification of an external extension.
 * Otherwise, the special export processing in the code will be invalid.
 */
const external = ["use-sync-external-store/shim"];
const plugins = [
  nodeResolve(),
  babel({
    exclude: "node_modules/**",
    babelHelpers: "bundled",
  }),
  typescript({
    compilerOptions: {
      lib: ["dom", "dom.iterable", "esnext", "es5", "es6", "es7"],
      target: "esnext",
    },
  }),
  autoExternal(),
  terser(),
];

const curDate = new Date();
const curDay = curDate.getDate();
// Header declaration of the packaged file
const banner =
  "/**\n" +
  " * resy\n" +
  " * An easy-to-use react data state manager\n" +
  " * created by liushanbao <1262300490@qq.com>\n" +
  ` * (c) 2020-05-05-${curDate.getFullYear()}-${curDate.getMonth() + 1}-${curDay < 10 ? `0${curDay}` : curDay}\n` +
  " * Released under the MIT License.\n" +
  " */";

export default [
  {
    input: "src/platforms/dom.ts",
    external: ["react-dom"],
    output: [
      {
        format: "es",
        dir: "dist",
        entryFileNames: "platform.js",
      },
      {
        format: "cjs",
        dir: "dist",
        entryFileNames: "platform.cjs.js",
      },
    ],
  },
  {
    input: "src/platforms/native.ts",
    external: ["react-native"],
    output: [
      {
        format: "es",
        dir: "dist",
        entryFileNames: "platform.native.js",
      },
      {
        format: "cjs",
        dir: "dist",
        entryFileNames: "platform.cjs.native.js",
      },
    ],
  },
  // CJS
  {
    input,
    output: {
      file: "dist/resy.cjs.js",
      format: "cjs",
      exports: "auto",
    },
    external: [...external, "./platform.cjs"],
    plugins: [
      ...plugins,
      replace({
        "react-platform": "./platform.cjs",
        preventAssignment: true,
      }),
    ]
  },
  // ESM
  {
    input,
    output: {
      file: "dist/resy.esm.js",
      format: "es",
    },
    external: [...external, "./platform"],
    plugins: [
      ...plugins,
      replace({
        "react-platform": "./platform",
        preventAssignment: true,
      }),
    ],
  },
  {
    input,
    output: {
      file: "dist/resy.d.ts",
      format: "es",
      banner,
    },
    plugins: [dts()],
  },
];
