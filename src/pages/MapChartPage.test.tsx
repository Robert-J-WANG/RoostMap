import { cloneElement, type ReactElement, type ReactNode } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MapChartPage } from "@/pages/MapChartPage";

// 用按钮发出地图的选区事件；历史请求、页面状态与 Recharts 折线仍实际运行。
vi.mock("react-map-gl/maplibre", () => ({
  default: ({ children, onClick }: {
    children: ReactNode;
    onClick: (event: { features: { id: string }[] }) => void;
  }) => (
    <div>
      <button onClick={() => onClick({ features: [{ id: "166700" }] })}>Select Coromandel</button>
      <button onClick={() => onClick({ features: [{ id: "166800" }] })}>Select Empty Area</button>
      {children}
    </div>
  ),
  Source: ({ children }: { children: ReactNode }) => children,
  Layer: () => null,
  NavigationControl: () => null,
}));
vi.mock("maplibre-gl", () => ({ setWorkerUrl: vi.fn() }));

// jsdom 没有页面布局，为真实折线提供固定尺寸。
vi.mock("recharts", async (importOriginal) => ({
  ...await importOriginal<typeof import("recharts")>(),
  ResponsiveContainer: ({ children }: {
    children: ReactElement<{ width: number; height: number }>;
  }) => cloneElement(children, { width: 640, height: 320 }),
}));

const periods = ["2020-01-01", "2020-04-01", "2020-07-01", "2020-10-01", "2021-01-01"];

function area(sa2Id: string, name: string) {
  return {
    type: "Feature",
    id: sa2Id,
    geometry: { type: "Polygon", coordinates: [[[175, -38], [176, -38], [175, -37], [175, -38]]] },
    properties: { sa2Id, name, medianRent: 350, reportedBonds: 171 },
  };
}

function history(values: (number | null)[]) {
  return values.map((geometricMeanRent, index) => ({
    period: periods[index],
    geometricMeanRent,
    reportedBonds: geometricMeanRent === null ? null : 12,
  }));
}

function serveSample(
  coromandelValues: (number | null)[] = [400, 410, null, 430, 440],
  options: { failWaikatoHistoryOnce?: boolean } = {},
) {
  let shouldFailWaikatoHistory = options.failWaikatoHistoryOnce ?? false;
  const waikatoMap = {
    type: "FeatureCollection",
    features: [
      area("179900", "Greensboro"),
      area("166700", "Coromandel"),
      area("166800", "Empty Area"),
    ],
  };
  const waikatoHistory = {
    region: "Waikato Region",
    dwellingType: "ALL",
    bedroomCategory: "ALL",
    metric: "geometricMeanRent",
    periods,
    histories: {
      "179900": history([388, 314, 323, 322, 403]),
      "166700": history(coromandelValues),
      "166800": [],
    },
  };
  const aucklandMap = {
    type: "FeatureCollection",
    features: [area("101800", "Auckland sample")],
  };
  const aucklandHistory = {
    ...waikatoHistory,
    region: "Auckland Region",
    histories: {
      "101800": history([520, 530, 540, 550, 560]),
    },
  };

  // fetch mock 按目录中的真实路径返回数据，避免测试依赖请求先后顺序。
  const fetchMock = vi.fn(async (input: string) => {
    if (input.endsWith("regions/index.json")) {
      return Response.json({
        period: "2026-04-01",
        dwellingType: "ALL",
        bedroomCategory: "ALL",
        regions: [
          {
            regionCode: "03",
            name: "Waikato Region",
            areaCount: 3,
            mapFile: "/data/spike/map-chart/comparison/regions/03.geo.json",
            historyFile: "/data/spike/map-chart/comparison/regions/03-history.json",
          },
          {
            regionCode: "02",
            name: "Auckland Region",
            areaCount: 1,
            mapFile: "/data/spike/map-chart/comparison/regions/02.geo.json",
            historyFile: "/data/spike/map-chart/comparison/regions/02-history.json",
          },
        ],
      });
    }

    if (input.endsWith("regions/03.geo.json")) {
      return Response.json(waikatoMap);
    }
    if (input.endsWith("regions/03-history.json")) {
      if (shouldFailWaikatoHistory) {
        shouldFailWaikatoHistory = false;
        return new Response(null, { status: 503 });
      }
      return Response.json(waikatoHistory);
    }
    if (input.endsWith("regions/02.geo.json")) {
      return Response.json(aucklandMap);
    }
    if (input.endsWith("regions/02-history.json")) {
      return Response.json(aucklandHistory);
    }

    throw new Error(`Unexpected data request: ${input}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MapChartPage /></QueryClientProvider>);
}

beforeEach(() => vi.stubEnv("VITE_MAPTILER_KEY", "test-key"));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("map history selection", () => {
  it("switches the chart and table together, preserves gaps and handles an empty area", async () => {
    const fetchMock = serveSample();
    renderPage();
    expect(await screen.findByRole("heading", { name: "Rent history · Greensboro" })).toBeInTheDocument();
    expect(screen.getByText("5 quarters · 5 rent observations")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Select Coromandel" }));
    expect(screen.getByRole("heading", { name: "Rent history · Coromandel" })).toBeInTheDocument();
    expect(screen.getByText("5 quarters · 4 rent observations")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Quarterly records"));
    const table = screen.getByRole("table");
    const missingQuarter = within(table).getByText("2020 Q3").closest("tr")!;
    expect(within(missingQuarter).getAllByText("No observation")).toHaveLength(2);
    expect(within(table).getByText("NZ$430")).toBeInTheDocument();
    // 两个 M 表示缺失季度两侧各有独立线段，没有跨空值连接。
    const path = document.querySelector(".recharts-line-curve");
    expect(path?.getAttribute("d")?.match(/M/g)).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    fireEvent.click(screen.getByRole("button", { name: "Select Empty Area" }));
    expect(screen.getByText("No history observations are available for this area and classification.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select Coromandel" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("keeps an isolated zero-valued observation as a visible point", async () => {
    serveSample([null, null, 0, null, null]);
    renderPage();
    await screen.findByRole("heading", { name: "Rent history · Greensboro" });
    fireEvent.click(screen.getByRole("button", { name: "Select Coromandel" }));
    expect(screen.getByText("5 quarters · 1 rent observations")).toBeInTheDocument();
    expect(document.querySelectorAll(".recharts-line-dot")).toHaveLength(1);
    fireEvent.click(screen.getByText("Quarterly records"));
    expect(within(screen.getByRole("table")).getByText("NZ$0")).toBeInTheDocument();
  });

  it("shows missing values without replacing them with zero", async () => {
    serveSample([null, null, null, null, null]);
    renderPage();
    await screen.findByRole("heading", { name: "Rent history · Greensboro" });
    fireEvent.click(screen.getByRole("button", { name: "Select Coromandel" }));
    expect(screen.getByText("No rent values are available for these quarters.")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Quarterly records"));
    const table = screen.getByRole("table");
    expect(within(table).getAllByText("No observation")).toHaveLength(10);
    expect(within(table).queryByText("NZ$0")).not.toBeInTheDocument();
  });

  it("loads the selected Region and reuses an already loaded Region", async () => {
    const fetchMock = serveSample();
    renderPage();

    expect(await screen.findByRole("heading", {
      name: "Waikato Region rental data sample",
    })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Region"), {
      target: { value: "02" },
    });
    expect(await screen.findByRole("heading", {
      name: "Auckland Region rental data sample",
    })).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([input]) =>
      input.endsWith("regions/02.geo.json")
    )).toHaveLength(1);

    fireEvent.change(screen.getByLabelText("Region"), {
      target: { value: "03" },
    });
    expect(await screen.findByRole("heading", {
      name: "Waikato Region rental data sample",
    })).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([input]) =>
      input.endsWith("regions/03.geo.json")
    )).toHaveLength(1);
  });

  it("recovers from a failed history request using the retry button", async () => {
    serveSample(undefined, { failWaikatoHistoryOnce: true });
    renderPage();
    expect(await screen.findByText("Could not load the Waikato Region data files.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry loading Region data" }));
    expect(await screen.findByRole("heading", { name: "Rent history · Greensboro" })).toBeInTheDocument();
  });
});
