import { dts } from "rollup-plugin-dts";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { babel } from "@rollup/plugin-babel";
import typescript from "@rollup/plugin-typescript";
import replace from "@rollup/plugin-replace";
import autoExternal from "rollup-plugin-auto-external";
import terser from "@rollup/plugin-terser";

type FormatType = "cjs" | "esm";
type PlatformType = "dom" | "native";
type EnvType = "dev" | "prod";

const FORMATS: FormatType[] = [
  "cjs",
  "esm"
];
const PLATFORMS: PlatformType[] = [
  "dom",
  "native"
];
const ENVS: EnvType[] = [
  "dev",
  "prod"
];

const input = "src/index.ts";

// create resy.d.ts declaration file
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

function createPlatformsBuildConfig(
  platform: PlatformType,
  format: FormatType,
  env: EnvType,
) {
  const isProd = env === "prod";
  const terserPluginsOpts = isProd
    ? {
      plugins: [terser()],
    }
    : null;

  return {
    input: `src/platforms/${platform}.ts`,
    external: [`react-${platform}`],
    output: {
      format,
      file: `dist/platform.${format}${isProd ? ".prod" : ""}${platform === "dom" ? "" : ".native"}.js`,
    },
    ...terserPluginsOpts,
  };
}

function createMainBuildConfig(format: FormatType, env: EnvType) {
  const isProd = env === "prod";
  const platforms = `./platform.${format}${isProd ? ".prod" : ""}`;

  // Compress files in a production environment.
  const terserOpts = isProd ? [terser()] : [];
  const replaceOpts = isProd
    ? {
      values: {
        // Assist in tree-shaking packaging processing of production files.
        __DEV__: "false",
        "react-platform": platforms,
      },
    }
    : {
      "react-platform": platforms,
    };

  return {
    input,
    output: {
      file: `dist/resy.${format}.${isProd ? "prod." : ""}js`,
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
        preventAssignment: true,
        ...replaceOpts,
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
  createTsDeclareFileBuildConfig(),

  ...PLATFORMS.map(platform => {
    return FORMATS.map(format => {
      return ENVS.map(env => {
        return createPlatformsBuildConfig(
          platform,
          format,
          env,
        );
      });
    });
  }).flat(Infinity),

  ...FORMATS.map(format => {
    return ENVS.map(env => {
      return createMainBuildConfig(format, env);
    });
  }).flat(),
];
