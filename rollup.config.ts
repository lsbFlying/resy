import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import pkg from "./package.json";
import replacePlugin from "rollup-plugin-replace";
import resolvePlugin from "@rollup/plugin-node-resolve";
// @ts-ignore
import babelPlugin from "rollup-plugin-babel";
import { terser } from "rollup-plugin-terser"; // 压缩打包文件

const input = "src/index.ts";
// const deps = Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies });
// const external = (id: string) => deps.some((dep) => id.startsWith(dep));
const external = ["use-sync-external-store/shim", "react", "./react-platform"];
const plugins = [
  replacePlugin({ "react-platform": "./react-platform" }),
  resolvePlugin(),
  babelPlugin({ exclude: 'node_modules/**' }),
  typescript(),
  terser(),
];

// 打包文件的头部声明
const banner =
  "/**\n" +
  ` * ${pkg.name} v${pkg.version}\n` +
  ` * 一款简单易用的React数据状态管理器\n` +
  ` * created by ${pkg.author}\n` +
  ` * (c) 2020-${new Date().getFullYear()} ${pkg.author}\n` +
  ` * Released under the ${pkg.license} License.\n` +
  " */";

const cjsOutput = { file: pkg.main, format: "cjs", exports: "auto" };
const esmOutput = { file: pkg.module, format: "es" };
const dtsOutput = { file: pkg.types, format: "es", banner };

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
