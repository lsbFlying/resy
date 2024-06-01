// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import ReactPlatformExports from "react-platform";
import type { Callback } from "./types";

const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) console.error("NODE_ENV not set");

export const __DEV__ = NODE_ENV === "development";

/**
 * @description To be deprecated
 * TODO It is anticipated that following the stabilization of React version 19,
 *  the use of `unstable_batchedUpdates` might be considered for discontinuation,
 *  given that these unstable APIs were already unsupported in React version 18.
 */
const { unstable_batchedUpdates } = ReactPlatformExports;

/** Batch processing safety shim */
export const batchUpdateShimRun = (fn: Callback) => fn();
export const batchUpdate = unstable_batchedUpdates || batchUpdateShimRun;
