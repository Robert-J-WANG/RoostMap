import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HomePage } from "@/pages/HomePage";
import { serveRelease } from "@/test/release-fixtures";

// 每个测试使用独立的路由和 QueryClient；关闭重试，让失败状态立即显示。
function renderHome() {
  const router = createMemoryRouter([{ path: "/", Component: HomePage }]);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Home page", () => {
  it("shows the current data release from the manifest", async () => {
    serveRelease();
    renderHome();

    expect(await screen.findByText("2 Regions · 4 areas")).toBeInTheDocument();
    expect(screen.getByText("Data to").nextElementSibling).toHaveTextContent("2026-04-01 Provisional");
    expect(screen.getByRole("link", { name: "Explore rental areas" })).toHaveAttribute("href", "/explore");
    expect(screen.getByRole("link", { name: "How the data is processed" })).toHaveAttribute("href", "/methodology");
  });

  it("keeps the introduction when the manifest fails to load", async () => {
    serveRelease(["/data/manifest.json"]);
    renderHome();

    expect(await screen.findByText("Could not load /data/manifest.json (HTTP 503)")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Make clearer rental decisions with area-level evidence." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore rental areas" })).toBeInTheDocument();
  });
});
