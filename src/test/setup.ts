import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom 不排版页面，也没有实现 window.scrollTo；ScrollRestoration 换页时会调用它。
// 测试中换成空函数，避免每次换页都输出 "Not implemented" 警告。
// 数据流水线测试运行在没有 window 的 Node 环境中，因此通过 globalThis 设置。
globalThis.scrollTo = () => {};

afterEach(() => {
  cleanup();
});
