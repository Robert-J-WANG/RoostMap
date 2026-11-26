import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { routes } from "@/app/router/routes";
import { RootLayout } from "@/components/layout/RootLayout";
import { RouteErrorPage } from "@/pages/RouteErrorPage";
import { serveRelease } from "@/test/release-fixtures";

/* --------- 测试辅助方法 -------- */
// Create an isolated Memory Router for each test case.
// Home 和 Methodology 会读取 manifest，因此同时提供 QueryClient 和模拟的数据文件。
function renderRoute(pathname: string) {
  const router = createMemoryRouter(routes, {
    initialEntries: [pathname],
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  serveRelease();
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

/* --------- 路由测试场景 -------- */
describe("application routes", () => {
  /* --------- 测试 1：首页路由与共享外壳 -------- */
  it("renders the shared application shell", async () => {
    renderRoute("/");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /make clearer rental decisions/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    // 数据来源和许可证统一显示在页脚。
    expect(screen.getByRole("contentinfo")).toHaveTextContent("MBIE Rental Bond Data (CC BY 3.0 NZ)");
    expect(screen.getByRole("link", { name: "Source code on GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/Robert-J-WANG/RoostMap",
    );
  });

  /* --------- 测试 2：方法说明页面路由匹配 -------- */
  it("renders the methodology route", async () => {
    renderRoute("/methodology");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "How RoostMap interprets rental areas",
      }),
    ).toBeInTheDocument();
  });

  /* --------- 测试 3：通配路由与未找到页面 -------- */
  it("renders the not-found page for an unknown route", async () => {
    renderRoute("/unknown-page");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Page not found",
      }),
    ).toBeInTheDocument();
  });

  /* --------- 测试 4：错误边界保留应用外壳 -------- */
  it("renders the route error inside the application shell", async () => {
    /* --------- 错误场景组件 -------- */
    // This component always throws to exercise the route error boundary.
    function BrokenPage(): never {
      throw new Error("Expected test error");
    }

    /* --------- 与生产结构一致的测试路由 -------- */
    const router = createMemoryRouter(
      [
        {
          Component: RootLayout,
          children: [
            {
              path: "/",
              ErrorBoundary: RouteErrorPage,
              children: [
                {
                  index: true,
                  Component: BrokenPage,
                },
              ],
            },
          ],
        },
      ],
      {
        initialEntries: ["/"],
      },
    );

    /* --------- 预期控制台错误 -------- */
    // Suppress the error log produced while the boundary handles the test error.
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    try {
      render(<RouterProvider router={router} />);

      expect(
        await screen.findByRole("heading", {
          name: "Something went wrong",
        }),
      ).toBeInTheDocument();

      expect(screen.getByRole("banner")).toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });
});
