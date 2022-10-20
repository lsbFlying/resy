import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import replace from "@rollup/plugin-replace";
import autoExternal from "rollup-plugin-auto-external";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { babel } from "@rollup/plugin-babel";
// import { terser } from "rollup-plugin-terser"; // 压缩打包文件

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
  autoExternal({
    dependencies: true,
    peerDependencies: true,
  }),
  // terser(),
];

const platformBuild = [
  {
    input: "src/platforms/dom.ts",
    external: ["react-dom"],
    output: [
      {
        format: "es",
        dir: "dist",
        entryFileNames: "react-platform.js",
      },
      {
        format: "cjs",
        dir: "dist",
        entryFileNames: "react-platform.cjs.js",
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
        entryFileNames: "react-platform.native.js",
      },
      {
        format: "cjs",
        dir: "dist",
        entryFileNames: "react-platform.cjs.native.js",
      },
    ],
  },
];

// 打包文件的头部声明
const banner =
  "/**\n" +
  ` * resy\n` +
  ` * 一款简单易用的React数据状态管理器\n` +
  ` * created by liushanbao <1262300490@qq.com>\n` +
  ` * (c) 2020-05-05-${new Date().getFullYear()}${new Date().getMonth()}${new Date().getDate()}\n` +
  ` * Released under the MIT License.\n` +
  " */";

export default [
  ...platformBuild,
  // CJS
  {
    input,
    output: {
      file: "dist/resy.cjs.js",
      format: "cjs",
      exports: "auto",
    },
    external: [...external, "./react-platform.cjs"],
    plugins: [
      ...plugins,
      replace({
        "react-platform": "./react-platform.cjs",
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
      exports: "auto",
    },
    external: [...external, "./react-platform"],
    plugins: [
      ...plugins,
      replace({
        "react-platform": "./react-platform",
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
