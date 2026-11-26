import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";

import { formatQuarter, type RentHistoryPoint } from "@/features/areas/rentHistory";
import { formatBonds, formatRent } from "@/lib/format";

type RentHistoryChartProps = {
  series: RentHistoryPoint[];
};

// 鼠标指向一个季度时显示的内容：季度、几何平均租金和同一季度的 Reported Bonds。
function HistoryTooltip({ active, payload }: TooltipContentProps) {
  if (!active || payload.length === 0) {
    return null;
  }

  const point = payload[0].payload as RentHistoryPoint;

  return (
    <div className="rounded-md border bg-card px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{formatQuarter(point.period)}</p>
      <p>Geometric mean rent: {formatRent(point.geometricMeanRent)}</p>
      <p>Reported Bonds: {formatBonds(point.reportedBonds)}</p>
    </div>
  );
}

// 一个分类的租金历史。显示方式取决于有租金的季度数量：
// 0 个显示没有历史；1 个只用文字说明；2–3 个只画点；4 个及以上画折线，缺失季度断开。
export function RentHistoryChart({ series }: RentHistoryChartProps) {
  const observedPoints = series.filter((point) => point.geometricMeanRent !== null);

  if (observedPoints.length === 0) {
    return (
      <p className="text-muted-foreground">
        No rent history is available for this category.
      </p>
    );
  }

  if (observedPoints.length === 1) {
    const point = observedPoints[0];

    return (
      <p>
        Only {formatQuarter(point.period)} has a rent for this category:{" "}
        {formatRent(point.geometricMeanRent)} from{" "}
        {formatBonds(point.reportedBonds)}.
      </p>
    );
  }

  // 少于 4 个季度时不连线，避免把几个零散的季度读成趋势；点仍然显示每个季度的租金。
  const showLine = observedPoints.length >= 4;

  // 图表交给 Recharts 完整的季度序列：值为 null 的季度不画点，connectNulls={false} 让折线在这里断开。
  // 颜色使用主题变量，深色模式下自动切换。
  return (
    <div className="h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            interval="preserveStartEnd"
            minTickGap={28}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickFormatter={formatQuarter}
          />
          {/* 纵轴不从 0 开始，否则几十元的变化会被压成一条平线；
              上下各留出约 10%，避免只有几个接近的值时把很小的差别放大成陡峭的变化。
              两端取整到 10 元，刻度是整齐的数字。 */}
          <YAxis
            domain={[
              (dataMin: number) => Math.floor((dataMin * 0.9) / 10) * 10,
              (dataMax: number) => Math.ceil((dataMax * 1.1) / 10) * 10,
            ]}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickFormatter={(value) => `$${value}`}
            width={56}
          />
          <Tooltip content={HistoryTooltip} />
          <Line
            connectNulls={false}
            dataKey="geometricMeanRent"
            dot={{ r: 3, fill: "var(--chart-1)", stroke: "var(--chart-1)" }}
            isAnimationActive={false}
            stroke={showLine ? "var(--chart-1)" : "none"}
            strokeWidth={2}
            type="linear"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
