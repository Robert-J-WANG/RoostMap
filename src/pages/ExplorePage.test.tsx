import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AreaDetailPage } from "@/pages/AreaDetailPage";
import { ExplorePage } from "@/pages/ExplorePage";
import {
  currentRentsUrl,
  geometryUrl,
  mbieSourceUrl,
  rentalDataNotice,
  serveRelease,
} from "@/test/release-fixtures";

// jsdom 无法运行 MapLibre；用一个按钮发出地图点击 Greensboro 的事件。
vi.mock("react-map-gl/maplibre", () => ({
  default: ({ children, onClick }: {
    children: ReactNode;
    onClick: (event: { features: { id: string }[] }) => void;
  }) => (
    <div>
      <button onClick={() => onClick({ features: [{ id: "179900" }] })} type="button">
        Click Greensboro on the map
      </button>
      {children}
    </div>
  ),
  Source: ({ children }: { children: ReactNode }) => children,
  Layer: () => null,
  NavigationControl: () => null,
}));
vi.mock("maplibre-gl", () => ({ setWorkerUrl: vi.fn() }));

// 每个测试使用独立的路由和 QueryClient；关闭重试，让失败状态立即显示。
// 路由同时包含详情页，用来检查两个页面之间的跳转。
function renderExplore(initialEntry = "/explore") {
  const router = createMemoryRouter(
    [
      { path: "/explore", Component: ExplorePage },
      { path: "/areas/:sa2Id", Component: AreaDetailPage },
    ],
    { initialEntries: [initialEntry] },
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return router;
}

beforeEach(() => vi.stubEnv("VITE_MAPTILER_KEY", "test-key"));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Explore page", () => {
  it("lists each area with its rent, period and missing values", async () => {
    serveRelease();
    renderExplore();

    expect(await screen.findByRole("heading", { level: 1, name: "Waikato Region rental areas" })).toBeInTheDocument();
    expect(screen.getByText(/Data to 2026-04-01/)).toBeInTheDocument();

    const greensboro = await screen.findByRole("button", { name: /^Greensboro/ });
    expect(greensboro).toHaveTextContent("NZ$350/week");
    expect(greensboro).toHaveTextContent("171 bonds · 12-month change +1.3%");
    expect(greensboro).not.toHaveTextContent("Last observed");

    const cooksBeach = screen.getByRole("button", { name: /^Cooks Beach-Ferry Landing/ });
    expect(cooksBeach).toHaveTextContent("NZ$305/week");
    expect(cooksBeach).toHaveTextContent("12-month change N/A");
    expect(cooksBeach).toHaveTextContent("Last observed 2021-04-01");

    const withoutRent = screen.getByRole("button", { name: /^Area Without Rent/ });
    expect(withoutRent).toHaveTextContent("No data");
    expect(withoutRent).not.toHaveTextContent("NZ$0");
  });

  it("shows the rental data status and sources from the manifest", async () => {
    serveRelease();
    renderExplore();

    // 状态标记在标题行，读取 manifest 后显示；数据说明在页面底部，当前租金读取后显示。
    expect(await screen.findByText("Provisional")).toBeInTheDocument();
    expect(await screen.findByText(rentalDataNotice)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "MBIE Rental Bond Data" })).toHaveAttribute("href", mbieSourceUrl);
    expect(screen.getByText(/Creative Commons Attribution 3\.0 New Zealand/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Methodology" })).toHaveAttribute("href", "/methodology");
  });

  it("keeps the map and list selection in the URL", async () => {
    serveRelease();
    const router = renderExplore("/explore?sa2=167300");

    // 打开带 ?sa2= 的地址时恢复选择。
    expect(await screen.findByRole("heading", { level: 2, name: "Cooks Beach-Ferry Landing" })).toBeInTheDocument();

    fireEvent.click(await screen.findByRole("button", { name: "Click Greensboro on the map" }));
    expect(screen.getByRole("heading", { level: 2, name: "Greensboro" })).toBeInTheDocument();
    expect(router.state.location.search).toBe("?sa2=179900");

    fireEvent.click(screen.getByRole("button", { name: /^Area Without Rent/ }));
    expect(screen.getByRole("heading", { level: 2, name: "Area Without Rent" })).toBeInTheDocument();
    expect(router.state.location.search).toBe("?sa2=100100");
  });

  it("shows the selected category in the list and keeps the selected area", async () => {
    serveRelease();
    const router = renderExplore("/explore?sa2=179900");

    fireEvent.change(await screen.findByLabelText("Dwelling type"), { target: { value: "House" } });
    fireEvent.change(screen.getByLabelText("Bedrooms"), { target: { value: "3" } });

    expect(screen.getByText(/House · 3 bedrooms · Data to/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Greensboro/ })).toHaveTextContent("NZ$590/week");
    // 没有 House / 3 记录的区域显示为缺失，不使用 ALL / ALL 的租金。
    expect(screen.getByRole("button", { name: /^Cooks Beach-Ferry Landing/ })).toHaveTextContent("No data");
    expect(screen.getByRole("heading", { level: 2, name: "Greensboro" })).toBeInTheDocument();
    expect(router.state.location.search).toBe("?dwelling=House&bedrooms=3&sa2=179900");
  });

  it("shows the comparability notice for 1-bedroom rents", async () => {
    serveRelease();
    renderExplore("/explore?bedrooms=1");

    const greensboro = await screen.findByRole("button", { name: /^Greensboro/ });
    expect(greensboro).toHaveTextContent("NZ$330/week");
    expect(greensboro).toHaveTextContent("12-month change N/A");
    expect(screen.getByText(/MBIE's 1-bedroom figures/)).toBeInTheDocument();
  });

  it("switches Region and clears the selected area", async () => {
    serveRelease();
    const router = renderExplore("/explore?bedrooms=3&sa2=179900");

    fireEvent.change(await screen.findByLabelText("Region"), { target: { value: "09" } });

    expect(await screen.findByRole("heading", { level: 1, name: "Wellington Region rental areas" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /^Wellington Test Area/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "No area selected" })).toBeInTheDocument();
    expect(router.state.location.search).toBe("?region=09&bedrooms=3");
  });

  it("uses the default Region when the URL names an unknown Region", async () => {
    serveRelease();
    renderExplore("/explore?region=99");

    expect(await screen.findByRole("heading", { level: 1, name: "Waikato Region rental areas" })).toBeInTheDocument();
  });

  it("opens the area details without downloading the current rents again", async () => {
    serveRelease();
    const router = renderExplore("/explore?dwelling=House&bedrooms=3&sa2=179900");

    // 详情页使用同一个 Region 和分类。
    fireEvent.click(await screen.findByRole("link", { name: "View details" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Greensboro" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/areas/179900");
    expect(router.state.location.search).toBe("?dwelling=House&bedrooms=3");
    expect(screen.getByText("House · 3 bedrooms")).toBeInTheDocument();

    // 详情页使用 Explore 已经下载的当前租金。
    const currentRentRequests = vi.mocked(fetch).mock.calls.filter(([url]) => url === currentRentsUrl);
    expect(currentRentRequests).toHaveLength(1);

    // 返回 Explore 时保留分类和原来的选择。
    fireEvent.click(screen.getByRole("link", { name: "Back to Explore" }));
    expect(await screen.findByRole("heading", { level: 2, name: "Greensboro" })).toBeInTheDocument();
    expect(router.state.location.search).toBe("?dwelling=House&bedrooms=3&sa2=179900");
  });

  it("recovers from a failed current-rents request using the retry button", async () => {
    serveRelease([currentRentsUrl]);
    renderExplore();

    expect(await screen.findByText(`Could not load ${currentRentsUrl} (HTTP 503)`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("button", { name: /^Greensboro/ })).toBeInTheDocument();
  });

  it("keeps the list available when the boundaries fail to load", async () => {
    serveRelease([geometryUrl]);
    renderExplore();

    expect(await screen.findByText(`Could not load ${geometryUrl} (HTTP 503)`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Greensboro/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("button", { name: "Click Greensboro on the map" })).toBeInTheDocument();
  });
});
