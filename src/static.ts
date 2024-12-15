// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import { unstable_batchedUpdates } from "react-platform";
import type { Callback } from "./types";

const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) console.error("NODE_ENV not set");

export const __DEV__ = NODE_ENV === "development";

/** Batch processing safety shim */
export const batchUpdateShimRun = (fn: Callback) => fn();
export const batchUpdate = unstable_batchedUpdates || batchUpdateShimRun;
