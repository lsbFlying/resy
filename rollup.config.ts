import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import replace from "@rollup/plugin-replace";
import autoExternal from "rollup-plugin-auto-external";
import terser from "@rollup/plugin-terser";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import {
  babel,
  // getBabelOutputPlugin,
} from "@rollup/plugin-babel";

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
      // /@babel\/runtime/,
    ],
    plugins: [
      replace({
        "react-platform": platforms,
        preventAssignment: true,
      }),
      autoExternal(),
      nodeResolve(),
      babel({
        /**
         * @description I forgot which version of "@ rollup/plugin label" requires the display
         * of configuration extensions for compiling TS settings,
         * and the settings to be displayed are @babel/presets-env
         */
        extensions: [".js", ".jsx", ".ts", ".tsx"],
        presets: ["@babel/preset-env"],
        exclude: "node_modules/**",
        // babelHelpers: "runtime",
        babelHelpers: "bundled",
      }),
      /**
       * @description "getBabelOutputPlugin" plugin and "runtime" settings are combined
       * with "@babel/plugin-transform-runtime", "@babel/runtime-corejs3" and "@babel/runtime",
       * "@babel/runtime-corejs3" and "@babel/runtime" these two packs need to be placed in "dependencies"
       * And "@babel/plugin-transform-runtime" pack are placed in "devDependencies".
       * At the same time, the babel.config.js configuration in the root directory is as follows:
       * module.exports = api => {
       *   api.cache(true);
       *   return {
       *     presets: [
       *       "@babel/preset-env"
       *     ],
       *     plugins: [
       *       [
       *         "@babel/plugin-transform-runtime",
       *         {
       *           corejs: 3
       *         }
       *       ]
       *     ]
       *   };
       * };
       * it`s to make the code compatible. However, there is no overall polyfill for the current library.
       * Instead, it is left to the developer to handle the overall system involved in the construction to do polyfill.
       */
      // getBabelOutputPlugin({
      //   configFile: "./babel.config.js",
      // }),
      typescript({
        tsconfig: "./tsconfig.json",
      }),
      ...terserOpts,
    ]
  };
}

export default [
  createPlatformsBuildConfig("dom", "cjs"),
  createPlatformsBuildConfig("native", "cjs"),
  createPlatformsBuildConfig("dom", "esm"),
  createPlatformsBuildConfig("native", "esm"),
  createTsDeclareFileBuildConfig(),
  createModuleBuildConfig("cjs"),
  createModuleBuildConfig("cjs", true),
  createModuleBuildConfig("esm"),
  createModuleBuildConfig("esm", true),
];
