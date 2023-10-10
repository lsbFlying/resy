import "@testing-library/jest-dom";

// for test (vitest会自动将process.env.NODE_ENV设置为test，这样无法测试走入dev分支，所以简单更改一下便于分析测试覆盖率)
process.env.NODE_ENV = "development";
