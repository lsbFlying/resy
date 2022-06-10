import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import pkg from "./package.json";
import { terser } from "rollup-plugin-terser"; // 压缩打包文件

const input = "src/index.ts";
const deps = Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies });
const external = (id: string) => deps.some((dep) => id.startsWith(dep));
const plugins = [typescript(), terser()];

// 打包文件的头部声明
const banner =
  "/**" +
  ` * ${pkg.name} v${pkg.version}\n` +
  ` * created by ${pkg.author}` +
  ` * @description 一款简单易用的React数据状态管理器` +
  ` * (c) 2020-${new Date().getFullYear()} ${pkg.author}\n` +
  ` * Released under the ${pkg.license} License.\n` +
  " */";

const cjsOutput = { file: pkg.main, format: "cjs", banner, exports: "auto" };
const esmOutput = { file: pkg.module, format: "es", banner };
const dtsOutput = { file: pkg.types, format: "es", banner };

export default [
  { input, output: cjsOutput, external, plugins },
  { input, output: esmOutput, external, plugins },
  { input, output: dtsOutput, plugins: [dts()] },
];
