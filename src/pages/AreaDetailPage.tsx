import { ArrowLeftIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router";

import { DataLoadError } from "@/components/DataLoadError";
import { DataReleaseNotice } from "@/components/DataReleaseNotice";
import { DataStatusBadge } from "@/components/DataStatusBadge";
import { OneBedroomNotice } from "@/components/OneBedroomNotice";
import { buttonVariants } from "@/components/ui/button";
import type { DataManifest, ManifestPartition } from "@/data/contracts";
import {
  useManifest,
  useRegionCurrentRents,
  useRegionRentHistory,
} from "@/data/queries";
import {
  findCurrentRent,
  findPartition,
  readSelection,
  toSearch,
  type Selection,
} from "@/data/selection";
import { RentHistoryChart } from "@/features/areas/RentHistoryChart";
import { buildRentHistorySeries } from "@/features/areas/rentHistory";
import {
  formatBedrooms,
  formatBonds,
  formatChange,
  formatDwellingType,
  formatRent,
  isOlderObservation,
} from "@/lib/format";

// 还没有找到区域时（加载中或读取失败）使用的页面标题。
const defaultTitle = <title>Area details | RoostMap</title>;

// 页面入口：先读取 manifest，再从 URL 中 Region 的当前租金里找到地址中的 SA2。
// 地址例如 /areas/251400?region=09&bedrooms=3，Region 和分类与 Explore 使用同一组参数。
export function AreaDetailPage() {
  const manifestQuery = useManifest();
  const [searchParams] = useSearchParams();

  if (manifestQuery.isError) {
    return (
      <section className="space-y-6">
        {defaultTitle}
        <DataLoadError
          error={manifestQuery.error}
          onRetry={() => manifestQuery.refetch()}
        />
      </section>
    );
  }

  if (manifestQuery.isPending) {
    return (
      <section className="space-y-6">
        {defaultTitle}
        <p>Loading the data release…</p>
      </section>
    );
  }

  const manifest = manifestQuery.data;
  const urlSelection = readSelection(searchParams);
  const partition = findPartition(manifest, urlSelection.regionCode);
  const selection = { ...urlSelection, regionCode: partition.id };

  return (
    <section className="space-y-6">
      <AreaDetails manifest={manifest} partition={partition} selection={selection} />
    </section>
  );
}

type AreaDetailsProps = {
  manifest: DataManifest;
  partition: ManifestPartition;
  selection: Selection;
};

// 一个区域在所选分类下的详情：与 Explore 的列表和地图读取同一份当前租金。
// 查询键相同，从 Explore 进入时直接使用已经下载的数据，不再请求。
function AreaDetails({ manifest, partition, selection }: AreaDetailsProps) {
  const { sa2Id } = useParams();
  const currentRentsQuery = useRegionCurrentRents(partition);

  // 租金历史只在详情页读取，与当前租金同时开始请求；它的加载和失败只影响历史部分。
  const rentHistoryQuery = useRegionRentHistory(partition);

  if (currentRentsQuery.isError) {
    return (
      <>
        {defaultTitle}
        <DataLoadError
          error={currentRentsQuery.error}
          onRetry={() => currentRentsQuery.refetch()}
        />
      </>
    );
  }

  if (currentRentsQuery.isPending) {
    return (
      <>
        {defaultTitle}
        <p>Loading {partition.name} rents…</p>
      </>
    );
  }

  const area = currentRentsQuery.data.find((item) => item.sa2Id === sa2Id);

  // 编号格式不对，或者这份 release 的这个 Region 中没有这个区域。
  if (!area) {
    return (
      <>
        <title>Area not found | RoostMap</title>
        <h1 className="text-3xl font-semibold">Area not found</h1>
        <p className="text-muted-foreground">
          {partition.name} has no rental area with SA2 code {sa2Id} in the
          current data release.
        </p>
        <Link
          className={buttonVariants({ variant: "outline" })}
          to={`/explore${toSearch({ ...selection, sa2Id: null })}`}
        >
          Back to Explore
        </Link>
      </>
    );
  }

  // 所选分类没有记录时，各项都显示为缺失；数据集最新季度取自 manifest。
  const currentRent = findCurrentRent(area, selection.dwellingType, selection.bedrooms);
  const datasetLatestPeriod = manifest.latestPeriod;
  const observationPeriod = currentRent?.observationPeriod ?? null;
  const medianRent = currentRent?.medianRent ?? null;
  const reportedBonds = currentRent?.reportedBonds ?? null;
  const yearOverYearChange = currentRent?.yearOverYearChange ?? null;

  let historyPanel: ReactNode;

  if (rentHistoryQuery.isError) {
    historyPanel = (
      <DataLoadError
        error={rentHistoryQuery.error}
        onRetry={() => rentHistoryQuery.refetch()}
      />
    );
  } else if (rentHistoryQuery.isPending) {
    historyPanel = <p className="text-muted-foreground">Loading rent history…</p>;
  } else {
    // 历史和上面的当前租金使用同一个分类；这个分类没有记录时得到空序列。
    const series = buildRentHistorySeries(
      rentHistoryQuery.data[area.sa2Id] ?? [],
      selection.dwellingType,
      selection.bedrooms,
      manifest.latestPeriod,
    );
    historyPanel = <RentHistoryChart series={series} />;
  }

  return (
    <>
      <title>{`${area.name} | RoostMap`}</title>

      {/* 返回 Explore 时保留 Region、分类和这个区域的选择。 */}
      <Link
        className={buttonVariants({ size: "sm", variant: "ghost" })}
        to={`/explore${toSearch({ ...selection, sa2Id: area.sa2Id })}`}
      >
        <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
        Back to Explore
      </Link>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">SA2 {area.sa2Id}</p>
        <h1 className="text-3xl font-semibold">{area.name}</h1>
        <p className="text-muted-foreground">
          {area.territorialAuthorityName} · {area.regionName}
        </p>
        <p className="text-muted-foreground">
          {formatDwellingType(selection.dwellingType)} ·{" "}
          {formatBedrooms(selection.bedrooms)}
        </p>
      </div>

      {selection.bedrooms === "1" && <OneBedroomNotice />}

      {/* 当前租金：每一项都有标签；缺失值显示为缺失，旧季度的租金不称为当前价格。 */}
      <dl className="grid gap-6 rounded-xl border bg-card p-6 sm:grid-cols-2">
        <div className="space-y-1">
          <dt className="text-sm text-muted-foreground">
            Latest observed median weekly rent
          </dt>
          <dd className="text-2xl font-semibold">{formatRent(medianRent)}</dd>
          {isOlderObservation(observationPeriod, datasetLatestPeriod) && (
            <dd className="text-sm text-muted-foreground">
              No rent is available for {datasetLatestPeriod}; this value is
              from an earlier quarter.
            </dd>
          )}
        </div>
        <div className="space-y-1">
          <dt className="text-sm text-muted-foreground">Observation period</dt>
          <dd className="text-lg font-medium">{observationPeriod ?? "No data"}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-sm text-muted-foreground">Dataset latest period</dt>
          <dd className="text-lg font-medium">
            {datasetLatestPeriod}{" "}
            <DataStatusBadge status={manifest.rentalDataStatus} />
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-sm text-muted-foreground">Reported Bonds</dt>
          <dd className="text-lg font-medium">{formatBonds(reportedBonds)}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-sm text-muted-foreground">12-month change</dt>
          <dd className="text-lg font-medium">
            {formatChange(yearOverYearChange)}
          </dd>
        </div>
      </dl>

      {/* 租金历史：使用 Geometric Mean，与上面的 Median 口径不同，标题下说明这一点。 */}
      <section className="space-y-4 rounded-xl border bg-card p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Rent history</h2>
          <p className="text-sm text-muted-foreground">
            Geometric mean weekly rent by quarter. Gaps are quarters without a
            rent. The rent above is a median, so the two can differ.
          </p>
        </div>
        {historyPanel}
      </section>

      <DataReleaseNotice manifest={manifest} />
    </>
  );
}
