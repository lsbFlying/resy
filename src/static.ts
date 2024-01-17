const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) console.error("NODE_ENV not set");

export const __DEV__ = NODE_ENV === "development";
