import "@testing-library/jest-dom";

/**
 * @description for test
 * Vitest automatically sets process.env.NODE_ENV to test,
 * so it is impossible to test into the dev branch,
 * so a simple change makes it easier to analyze test coverage
 */
process.env.NODE_ENV = "development";
