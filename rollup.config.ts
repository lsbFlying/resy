import typescript from "@rollup/plugin-typescript";
import replace from "@rollup/plugin-replace";
import autoExternal from "rollup-plugin-auto-external";
import terser from "@rollup/plugin-terser";
import { dts } from "rollup-plugin-dts";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { babel } from "@rollup/plugin-babel";

const input = "src/index.ts";

function createPlatformsBuildConfig(platform: "dom" | "native", format: "cjs" | "esm") {
  return {
    input: `src/platforms/${platform}.ts`,
    external: [`react-${platform}`],
    output: [{
      format,
      dir: "dist",
      entryFileNames: `platform.${format}${platform === "dom" ? "" : ".native"}.js`,
    }],
  };
}

function createTsDeclareFileBuildConfig() {
  const curDate = new Date();
  const curDay = curDate.getDate();
  // Header declaration of the packaged file
  const banner =
    "/**\n" +
    " * resy\n" +
    " * An easy-to-use React data state manager\n" +
    " * created by liushanbao <1262300490@qq.com>\n" +
    ` * (c) 2020-05-05-${curDate.getFullYear()}-${curDate.getMonth() + 1}-${curDay < 10 ? `0${curDay}` : curDay}\n` +
    " * Released under the MIT License.\n" +
    " */";

  return {
    input,
    output: {
      file: "dist/resy.d.ts",
      format: "esm",
      banner,
    },
    plugins: [
      dts({
        tsconfig: "./tsconfig.json",
        compilerOptions: {
          target: 99,
          module: 99,
        },
      }),
    ],
  };
}

function createModuleBuildConfig(format: "cjs" | "esm", isTerser?: boolean) {
  const platforms = `./platform.${format}`;
  const terserOpts = isTerser ? [terser()] : [];

  return {
    input,
    output: {
      file: `dist/resy.${format}.${isTerser ? "prod." : ""}js`,
      format,
    },
    /**
     * @description Because use-sync-external-store, this package only exports CJS modules.
     * So here we need to do a separate special identification of an external extension.
     * Otherwise, the special export processing in the code will be invalid.
     */
    external: [
      "react",
      platforms,
      "use-sync-external-store/shim",
    ],
    plugins: [
      replace({
        "react-platform": platforms,
        preventAssignment: true,
      }),
      autoExternal(),
      nodeResolve(),
      babel({
        extensions: [".js", ".jsx", ".ts", ".tsx"],
        exclude: "node_modules/**",
        babelHelpers: "bundled",
        presets: ["@babel/preset-env"],
      }),
      typescript({
        tsconfig: "./tsconfig.json",
      }),
      ...terserOpts,
    ]
  };
}

export default [
  // ts-d.ts
  createTsDeclareFileBuildConfig(),

  // cjs
  createPlatformsBuildConfig("dom", "cjs"),
  createPlatformsBuildConfig("native", "cjs"),
  createModuleBuildConfig("cjs"),
  createModuleBuildConfig("cjs", true),

  // esm
  createPlatformsBuildConfig("dom", "esm"),
  createPlatformsBuildConfig("native", "esm"),
  createModuleBuildConfig("esm"),
  createModuleBuildConfig("esm", true),
];
