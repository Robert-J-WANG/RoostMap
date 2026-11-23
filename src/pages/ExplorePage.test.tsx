import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ExplorePage } from "@/pages/ExplorePage";

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

const currentRentsUrl = "/data/releases/2026-04-01.1/areas/current-rents/03.json";
const geometryUrl = "/data/releases/2026-04-01.1/geometry/regions/03.geo.json";

const manifest = {
  version: "2026-04-01.1",
  generatedAt: "2026-11-21T00:00:00.000Z",
  latestPeriod: "2026-04-01",
  partitions: [
    { id: "03", name: "Waikato Region", areaCount: 3, currentRentsUrl, geometryUrl },
  ],
};

// 生成当前租金文件中的一行；Region 信息和数据集最新季度对所有区域相同。
function area(
  sa2Id: string,
  name: string,
  territorialAuthorityName: string,
  currentRent: {
    observationPeriod: string | null;
    medianRent: number | null;
    reportedBonds: number | null;
    yearOverYearChange: number | null;
  },
) {
  return {
    sa2Id,
    name,
    regionCode: "03",
    regionName: "Waikato Region",
    territorialAuthorityCode: "000",
    territorialAuthorityName,
    currentRent: { datasetLatestPeriod: "2026-04-01", ...currentRent },
  };
}

// 三种租金状态：当前季度、旧季度和没有租金。最后一行是测试用的虚构区域。
const currentRents = [
  area("179900", "Greensboro", "Hamilton City", {
    observationPeriod: "2026-04-01",
    medianRent: 350,
    reportedBonds: 171,
    yearOverYearChange: 0.0128,
  }),
  area("167300", "Cooks Beach-Ferry Landing", "Thames-Coromandel District", {
    observationPeriod: "2021-04-01",
    medianRent: 305,
    reportedBonds: 6,
    yearOverYearChange: null,
  }),
  area("100100", "Area Without Rent", "Test District", {
    observationPeriod: null,
    medianRent: null,
    reportedBonds: null,
    yearOverYearChange: null,
  }),
];

const geometry = {
  type: "FeatureCollection",
  features: currentRents.map(({ sa2Id }) => ({
    type: "Feature",
    id: sa2Id,
    geometry: { type: "Polygon", coordinates: [[[175, -38], [176, -38], [175, -37], [175, -38]]] },
    properties: { sa2Id },
  })),
};

// 按地址返回数据；failOnce 中的地址第一次请求返回 503。
function serveRelease(failOnce: string[] = []) {
  const failedUrls = new Set<string>();

  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (failOnce.includes(url) && !failedUrls.has(url)) {
      failedUrls.add(url);
      return new Response(null, { status: 503 });
    }

    if (url === "/data/manifest.json") return Response.json(manifest);
    if (url === currentRentsUrl) return Response.json(currentRents);
    if (url === geometryUrl) return Response.json(geometry);

    throw new Error(`Unexpected data request: ${url}`);
  }));
}

// 每个测试使用独立的路由和 QueryClient；关闭重试，让失败状态立即显示。
function renderExplore(initialEntry = "/explore") {
  const router = createMemoryRouter([{ path: "/explore", Component: ExplorePage }], {
    initialEntries: [initialEntry],
  });
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
