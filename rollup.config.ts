import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
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

function createModuleBuildConfig(
  format: "cjs" | "es" | "umd" | "system",
  isTerser?: boolean,
) {
  const umdNameOpts = format === "umd"
    ? { name: umdOutputName }
    : {};
  const fileOpts = {
    umd: "/umd",
    system: "/system",
    es: "/esm",
    /**
     * @description Although modern browsers and the latest version of Node.js support ESM,
     * the CJS module can be used seamlessly in most JavaScript environments,
     * including older versions of Node.js and some tool chains.
     * So the CJS module is exported by default.
     */
    cjs: "",
  };

  // umd needs to make some adjustments to the global transformation
  const platforms = format === "umd"
    ? "platform"
    : "./platform";
  const umdOutputGlobalOpts = format === "umd"
    ? {
      globals: {
        react: "React",
        "platform": "ReactPlatformExports",
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
       * with "@ babel/plugin-transform-runtime", "@ babel/runtime-corejs3" and "@ babel/runtime"
       * to make the code compatible. However, there is no overall polyfill for the current library.
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
    es: "",
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
      "use-sync-external-store/shim",
      platforms,
      // /@babel\/runtime/,
    ],
    plugins: [
      ...babelPlugins,
      nodeResolve(),
      typescript({
        compilerOptions: {
          lib: ["DOM", "DOM.Iterable", "ES5", "ES6", "ES7", "ESNext"],
          target: "ESNext",
        },
      }),
      autoExternal(),
      replace({
        "react-platform": platforms,
        preventAssignment: true,
      }),
      ...terserOpts,
    ]
  };
}

function createPlatformsBuildConfig() {
  return [
    {
      input: "src/platforms/dom.ts",
      external: ["react-dom"],
      output: [
        {
          format: "cjs",
          dir: "dist",
          entryFileNames: "platform.cjs.js",
        },
        {
          format: "es",
          dir: "dist/esm",
          entryFileNames: "platform.js",
        },
        {
          format: "umd",
          dir: "dist/umd",
          name: umdOutputName,
          entryFileNames: "platform.js",
          globals: {
            "react-dom": "reactDom",
          },
        },
        {
          format: "system",
          dir: "dist/system",
          entryFileNames: "platform.js",
        },
      ],
    },
    {
      input: "src/platforms/native.ts",
      external: ["react-native"],
      output: [
        {
          format: "cjs",
          dir: "dist",
          entryFileNames: "platform.cjs.native.js",
        },
        {
          format: "es",
          dir: "dist/esm",
          entryFileNames: "platform.native.js",
        },
        {
          format: "umd",
          dir: "dist/umd",
          name: umdOutputName,
          entryFileNames: "platform.native.js",
          globals: {
            "react-native": "reactNative",
          },
        },
        {
          format: "system",
          dir: "dist/system",
          entryFileNames: "platform.native.js",
        },
      ],
    },
  ];
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

  const modulesIndex = ["esm", "umd", "system"];
  const miDts = modulesIndex.map(item => ({
    input,
    output: {
      file: `dist/${item}/index.d.ts`,
      format: "es",
      banner,
    },
    plugins: [
      dts(),
    ],
  }));

  const modules = ["cjs", "esm", "umd", "system"];

  return modules.map(item => ({
    input,
    output: {
      file: `dist${item === "cjs" ? "" : `/${item}`}/resy.d.ts`,
      format: "es",
      banner,
    },
    plugins: [
      dts(),
    ],
  })).concat(miDts);
}

export default [
  ...createPlatformsBuildConfig(),
  createModuleBuildConfig("cjs"),
  createModuleBuildConfig("cjs", true),
  createModuleBuildConfig("es"),
  createModuleBuildConfig("es", true),
  createModuleBuildConfig("umd"),
  createModuleBuildConfig("umd", true),
  createModuleBuildConfig("system"),
  createModuleBuildConfig("system", true),
  ...createTsDeclareFileBuildConfig(),
];
