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
const umdOutputName = "resy";
const modules = ["cjs", "esm", "umd", "system"];

function createPlatformsBuildConfig() {
  return ["dom", "native"].map(item => ({
    input: `src/platforms/${item}.ts`,
    external: [`react-${item}`],
    output: modules.map(itemM => {
      const umdOpts = itemM === "umd"
        ? {
          name: `${umdOutputName}-${item}`,
          globals: {
            [`react-${item}`]: item === "dom" ? "ReactDom" : "ReactNative",
          },
        }
        : {};
      return {
        format: itemM,
        dir: itemM === "cjs" ? "dist" : `dist/${itemM}`,
        entryFileNames: `platform${item === "dom" ? "" : ".native"}.js`,
        ...umdOpts,
      };
    }),
  }));
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

  return modules.map(item => ({
    input,
    output: {
      file: `dist${item === "cjs" ? "/resy.d.ts" : `/${item}/index.d.ts`}`,
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
  }));
}

function createModuleBuildConfig(
  format: "cjs" | "esm" | "umd" | "system",
  isTerser?: boolean,
) {
  const umdNameOpts = format === "umd"
    ? { name: umdOutputName }
    : {};
  const fileOpts = {
    umd: "/umd",
    system: "/system",
    esm: "/esm",
    /**
     * @description Although modern browsers and the latest version of Node.js support ESM,
     * the CJS module can be used seamlessly in most JavaScript environments,
     * including older versions of Node.js and some tool chains.
     * So the CJS module is exported by default.
     */
    cjs: "",
  };

  const platforms = "./platform";
  const umdOutputGlobalOpts = format === "umd"
    ? {
      globals: {
        react: "React",
        "./platform": "ReactPlatformExports",
        "use-sync-external-store/shim": "useSyncExternalStoreExports",
      },
    }
    : {};

  const babelPlugins = format === "umd" || format === "system"
    ? []
    : [
      babel({
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
       *   // https://babeljs.io/docs/config-files#config-function-api
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
    ];

  const terserOpts = isTerser ? [terser()] : [];

  const suffixOpts = {
    umd: "",
    system: "",
    esm: "",
    cjs: "cjs.",
  };

  return {
    input,
    output: {
      file: `dist${fileOpts[format]}/resy.${suffixOpts[format]}${isTerser ? "prod." : ""}js`,
      format,
      ...umdNameOpts,
      ...umdOutputGlobalOpts,
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
      ...babelPlugins,
      typescript({
        tsconfig: "./tsconfig.json",
      }),
      ...terserOpts,
    ]
  };
}

export default [
  ...createPlatformsBuildConfig(),
  ...createTsDeclareFileBuildConfig(),
  ...[...modules, ...modules].map((item, index) => (
    createModuleBuildConfig(item as any, index > 3)
  )),
];
