import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RentHistoryChart } from "@/features/areas/RentHistoryChart";
import type { RentHistoryPoint } from "@/features/areas/rentHistory";

// src/test/setup.ts 为 ResponsiveContainer 提供了固定尺寸，这里的折线和点由 Recharts 真实绘制。

// 由季度和租金生成序列；null 表示这个季度没有租金。
function series(rents: (number | null)[]): RentHistoryPoint[] {
  const periods = ["2025-04-01", "2025-07-01", "2025-10-01", "2026-01-01", "2026-04-01"];

  return rents.map((geometricMeanRent, index) => ({
    period: periods[index],
    geometricMeanRent,
    reportedBonds: geometricMeanRent === null ? null : 20,
  }));
}

function lineSegmentCount() {
  // 折线路径中每个 "M" 开始一段线；缺失季度把折线分成多段。
  const path = document.querySelector(".recharts-line-curve")?.getAttribute("d") ?? "";
  return path.split("M").length - 1;
}

describe("Rent history chart", () => {
  it("draws a line that breaks at a missing quarter", () => {
    render(<RentHistoryChart series={series([390, 392, null, 398, 395])} />);

    expect(document.querySelectorAll(".recharts-line-dot")).toHaveLength(4);
    expect(lineSegmentCount()).toBe(2);
  });

  it("shows two or three quarters as points without a line", () => {
    render(<RentHistoryChart series={series([534, null, null, null, 610])} />);

    expect(document.querySelectorAll(".recharts-line-dot")).toHaveLength(2);
    expect(document.querySelector(".recharts-line-curve")).toHaveAttribute("stroke", "none");
  });

  it("describes a single quarter in text", () => {
    render(<RentHistoryChart series={series([null, null, null, null, 330])} />);

    expect(
      screen.getByText("Only 2026 Q2 has a rent for this category: NZ$330/week from 20 bonds."),
    ).toBeInTheDocument();
    expect(document.querySelector(".recharts-line")).not.toBeInTheDocument();
  });

  it("says when the category has no rent history", () => {
    render(<RentHistoryChart series={[]} />);

    expect(screen.getByText("No rent history is available for this category.")).toBeInTheDocument();
  });
});
