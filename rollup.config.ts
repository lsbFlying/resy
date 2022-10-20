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
const external = ["use-sync-external-store/shim", "./react-platform"];
const plugins = [
  replace({
    "react-platform": "./react-platform",
    preventAssignment: true,
  }),
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

// 打包文件的头部声明
const banner =
  "/**\n" +
  ` * resy\n` +
  ` * 一款简单易用的React数据状态管理器\n` +
  ` * created by liushanbao <1262300490@qq.com>\n` +
  ` * (c) 2020-${new Date().getFullYear()}\n` +
  ` * Released under the MIT License.\n` +
  " */";

const cjsOutput = { file: "dist/resy.cjs.js", format: "cjs", exports: "auto" };
const esmOutput = { file: "dist/resy.esm.js", format: "es" };
const dtsOutput = { file: "dist/resy.d.ts", format: "es", banner };

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

export default [
  ...platformBuild,
  { input, output: cjsOutput, external, plugins },
  { input, output: esmOutput, external, plugins },
  { input, output: dtsOutput, plugins: [dts()] },
];
