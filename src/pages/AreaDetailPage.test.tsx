import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AreaDetailPage } from "@/pages/AreaDetailPage";
import {
  currentRentsUrl,
  mbieSourceUrl,
  rentalDataNotice,
  rentHistoryUrl,
  serveRelease,
} from "@/test/release-fixtures";

// 每个测试使用独立的路由和 QueryClient；关闭重试，让失败状态立即显示。
// path 是 SA2 编号，可以带上 Region 和分类参数，例如 "179900?bedrooms=1"。
function renderAreaDetail(path: string) {
  const router = createMemoryRouter(
    [{ path: "/areas/:sa2Id", Component: AreaDetailPage }],
    { initialEntries: [`/areas/${path}`] },
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

// 详情中的每个数值紧跟在它的标签（dt）后面。
function getValue(label: string) {
  return screen.getByText(label).nextElementSibling;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Area Detail page", () => {
  it("shows the area and its rent for the latest quarter", async () => {
    serveRelease();
    renderAreaDetail("179900");

    expect(await screen.findByRole("heading", { level: 1, name: "Greensboro" })).toBeInTheDocument();
    expect(screen.getByText("SA2 179900")).toBeInTheDocument();
    expect(screen.getByText("Hamilton City · Waikato Region")).toBeInTheDocument();

    expect(getValue("Latest observed median weekly rent")).toHaveTextContent("NZ$350/week");
    expect(getValue("Observation period")).toHaveTextContent("2026-04-01");
    expect(getValue("Dataset latest period")).toHaveTextContent("2026-04-01");
    expect(getValue("Reported Bonds")).toHaveTextContent("171 bonds");
    expect(getValue("12-month change")).toHaveTextContent("+1.3%");
    expect(screen.queryByText(/earlier quarter/)).not.toBeInTheDocument();
  });

  it("shows the rental data status and sources from the manifest", async () => {
    serveRelease();
    renderAreaDetail("179900");

    await screen.findByRole("heading", { level: 1, name: "Greensboro" });
    expect(screen.getByText("Provisional")).toBeInTheDocument();
    expect(screen.getByText(rentalDataNotice)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "MBIE Rental Bond Data" })).toHaveAttribute("href", mbieSourceUrl);
    expect(screen.getByRole("link", { name: "Methodology" })).toHaveAttribute("href", "/methodology");
  });

  it("marks a rent from an earlier quarter", async () => {
    serveRelease();
    renderAreaDetail("167300");

    expect(await screen.findByRole("heading", { level: 1, name: "Cooks Beach-Ferry Landing" })).toBeInTheDocument();
    expect(getValue("Latest observed median weekly rent")).toHaveTextContent("NZ$305/week");
    expect(getValue("Observation period")).toHaveTextContent("2021-04-01");
    expect(
      screen.getByText("No rent is available for 2026-04-01; this value is from an earlier quarter."),
    ).toBeInTheDocument();
    expect(getValue("12-month change")).toHaveTextContent("N/A");
  });

  it("shows missing values without replacing them with zero", async () => {
    serveRelease();
    renderAreaDetail("100100");

    expect(await screen.findByRole("heading", { level: 1, name: "Area Without Rent" })).toBeInTheDocument();
    expect(getValue("Latest observed median weekly rent")).toHaveTextContent("No data");
    expect(getValue("Observation period")).toHaveTextContent("No data");
    expect(getValue("Reported Bonds")).toHaveTextContent("No data");
    expect(getValue("12-month change")).toHaveTextContent("N/A");
    expect(screen.queryByText(/NZ\$0/)).not.toBeInTheDocument();
  });

  it("shows the rent for the category in the URL", async () => {
    serveRelease();
    renderAreaDetail("179900?bedrooms=1");

    expect(await screen.findByRole("heading", { level: 1, name: "Greensboro" })).toBeInTheDocument();
    expect(screen.getByText("All dwelling types · 1 bedroom")).toBeInTheDocument();
    expect(getValue("Latest observed median weekly rent")).toHaveTextContent("NZ$330/week");
    expect(getValue("12-month change")).toHaveTextContent("N/A");
    expect(screen.getByText(/MBIE's 1-bedroom figures/)).toBeInTheDocument();

    // 历史使用同一个分类：ALL / 1 只有一个季度，用文字说明。
    expect(
      await screen.findByText("Only 2026 Q2 has a rent for this category: NZ$330/week from 132 bonds."),
    ).toBeInTheDocument();
  });

  it("shows the rent history of the selected category", async () => {
    serveRelease();
    renderAreaDetail("179900");

    expect(await screen.findByRole("heading", { level: 2, name: "Rent history" })).toBeInTheDocument();
    // ALL / ALL 有 4 个季度的租金，2025-10-01 缺失，折线分成两段。
    await waitFor(() => expect(document.querySelectorAll(".recharts-line-dot")).toHaveLength(4));
    expect(document.querySelector(".recharts-line-curve")?.getAttribute("d")?.split("M")).toHaveLength(3);
  });

  it("keeps the current rent when the rent history fails to load", async () => {
    serveRelease([rentHistoryUrl]);
    renderAreaDetail("179900");

    expect(await screen.findByText(`Could not load ${rentHistoryUrl} (HTTP 503)`)).toBeInTheDocument();
    expect(getValue("Latest observed median weekly rent")).toHaveTextContent("NZ$350/week");

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(document.querySelectorAll(".recharts-line-dot")).toHaveLength(4));
  });

  it("finds the area in the Region named in the URL", async () => {
    serveRelease();
    renderAreaDetail("250100?region=09");

    expect(await screen.findByRole("heading", { level: 1, name: "Wellington Test Area" })).toBeInTheDocument();
    expect(getValue("Latest observed median weekly rent")).toHaveTextContent("NZ$600/week");
    expect(screen.getByRole("link", { name: "Back to Explore" })).toHaveAttribute(
      "href",
      "/explore?region=09&sa2=250100",
    );
  });

  it("shows a not-found message for an SA2 outside the release", async () => {
    serveRelease();
    renderAreaDetail("999999");

    expect(await screen.findByRole("heading", { level: 1, name: "Area not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Explore" })).toHaveAttribute("href", "/explore");
  });

  it("recovers from a failed current-rents request using the retry button", async () => {
    serveRelease([currentRentsUrl]);
    renderAreaDetail("179900");

    expect(await screen.findByText(`Could not load ${currentRentsUrl} (HTTP 503)`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Greensboro" })).toBeInTheDocument();
  });
});
