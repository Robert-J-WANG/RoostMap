import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { HistoryObservation } from "@/features/explore/sample-data";

type RentHistoryChartProps = {
  sa2Id: string;
  areaName: string;
  dwellingType: string;
  bedroomCategory: string;
  observations: HistoryObservation[];
};

function formatQuarter(period: string) {
  const year = period.slice(0, 4);
  const quarter = Math.ceil(Number(period.slice(5, 7)) / 3);
  return `${year} Q${quarter}`;
}

export function RentHistoryChart({
  sa2Id,
  areaName,
  dwellingType,
  bedroomCategory,
  observations,
}: RentHistoryChartProps) {
  // 区分季度位置与实际有租金的记录，缺失季度仍留在原数组中。
  const observedRentCount = observations.filter(
    (observation) => observation.geometricMeanRent !== null,
  ).length;

  return (
    <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Rent history · {areaName}</h2>
        <p className="text-sm">
          SA2 {sa2Id} · Dwelling type: {dwellingType} · Bedroom category:{" "}
          {bedroomCategory}
        </p>
        <p className="text-sm text-muted-foreground">
          Geometric Mean Rent · NZD per week
        </p>
      </div>

      {observations.length === 0 ? (
        <p>No history observations are available for this area and classification.</p>
      ) : (
        <>
          <p className="text-sm">
            {observations.length} quarters · {observedRentCount} rent observations
          </p>
          {observedRentCount === 0 ? (
            <p>No rent values are available for these quarters.</p>
          ) : (
            <>
              {/* 使用完整季度数组：null 形成断点，圆点保留孤立的观测。 */}
              <div className="h-80 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={observations} margin={{ top: 16, right: 16, bottom: 12, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="period"
                      tickFormatter={formatQuarter}
                      minTickGap={28}
                      interval="preserveStartEnd"
                    />
                    <YAxis width={64} tickFormatter={(value) => `$${value}`} />
                    <Tooltip
                      labelFormatter={(label) => formatQuarter(String(label))}
                      formatter={(value) => [`NZ$${value}`, "Geometric Mean Rent"]}
                    />
                    <Line
                      type="linear"
                      dataKey="geometricMeanRent"
                      stroke="#2f6f9f"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-muted-foreground">
                Gaps indicate missing rent observations.
              </p>
            </>
          )}

          {/* 表格与图表共用同一数组，便于核对租金及 Reported Bonds。 */}
          <details>
            <summary className="cursor-pointer">Quarterly records</summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="pb-3 text-left">
                  {areaName} · {sa2Id} · {dwellingType} / {bedroomCategory}
                </caption>
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-2">Quarter</th>
                    <th className="px-2 py-2">Geometric Mean Rent (NZD/week)</th>
                    <th className="px-2 py-2">Reported Bonds</th>
                  </tr>
                </thead>
                <tbody>
                  {observations.map((observation) => (
                    <tr key={observation.period} className="border-b">
                      <td className="px-2 py-2">{formatQuarter(observation.period)}</td>
                      <td className="px-2 py-2">
                        {observation.geometricMeanRent === null
                          ? "No observation"
                          : `NZ$${observation.geometricMeanRent}`}
                      </td>
                      <td className="px-2 py-2">
                        {observation.reportedBonds ?? "No observation"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
