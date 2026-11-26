import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { cloneElement, type ReactElement } from "react";
import { afterEach, vi } from "vitest";

// jsdom 不排版页面，也没有实现 window.scrollTo；ScrollRestoration 换页时会调用它。
// 测试中换成空函数，避免每次换页都输出 "Not implemented" 警告。
// 数据流水线测试运行在没有 window 的 Node 环境中，因此通过 globalThis 设置。
globalThis.scrollTo = () => {};

// jsdom 不排版页面，ResponsiveContainer 测得的宽高为 0，图表不会绘制。
// 所有测试中为图表提供固定尺寸，折线和点仍由 Recharts 真实绘制。
vi.mock("recharts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("recharts")>()),
  ResponsiveContainer: ({ children }: { children: ReactElement<{ width: number; height: number }> }) =>
    cloneElement(children, { width: 640, height: 320 }),
}));

afterEach(() => {
  cleanup();
});
