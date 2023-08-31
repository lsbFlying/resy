import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import replace from "@rollup/plugin-replace";
import autoExternal from "rollup-plugin-auto-external";
import terser from "@rollup/plugin-terser";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { babel } from "@rollup/plugin-babel";

const input = "src/index.ts";
/**
 * 由于use-sync-external-store该包只导出了CJS模块
 * 所以这里需要做一个外部扩展单独的特殊识别
 * 否则代码里的特殊导出处理则无效了
 */
const external = ["use-sync-external-store/shim"];
const plugins = [
  nodeResolve(),
  babel({
    exclude: "node_modules/**",
    babelHelpers: "bundled",
  }),
  typescript(),
  autoExternal(),
  terser(),
];

const curDate = new Date();
const curDay = curDate.getDate();
// 打包文件的头部声明
const banner =
  "/**\n" +
  ` * resy\n` +
  ` * 一款简单易用的React数据状态管理器\n` +
  ` * created by liushanbao <1262300490@qq.com>\n` +
  ` * (c) 2020-05-05-${curDate.getFullYear()}-${curDate.getMonth() + 1}-${curDay < 10 ? `0${curDay}` : curDay}\n` +
  ` * Released under the MIT License.\n` +
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
