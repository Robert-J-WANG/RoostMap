import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router";

import { DataLoadError } from "@/components/DataLoadError";
import { DataReleaseNotice } from "@/components/DataReleaseNotice";
import { DataStatusBadge } from "@/components/DataStatusBadge";
import { OneBedroomNotice } from "@/components/OneBedroomNotice";
import { buttonVariants } from "@/components/ui/button";
import type { DataManifest, ManifestPartition } from "@/data/contracts";
import {
  useManifest,
  useRegionCurrentRents,
  useRegionGeometry,
} from "@/data/queries";
import {
  findPartition,
  readSelection,
  toSearch,
  type Selection,
} from "@/data/selection";
import { AreaList } from "@/features/explore/AreaList";
import { AreaMap } from "@/features/explore/AreaMap";
import { ExploreFilters } from "@/features/explore/ExploreFilters";
import { formatBedrooms, formatDwellingType } from "@/lib/format";

const pageTitle = <title>Explore | RoostMap</title>;

// 页面入口：先读取 manifest，再按 URL 中的选择显示一个 Region 的列表和地图。
export function ExplorePage() {
  const manifestQuery = useManifest();

  // Region、分类和选中的 SA2 都保存在 URL 中，刷新或分享链接后可以恢复。
  // 改变选择时替换当前历史记录，后退按钮不会逐个回到之前的每一次选择。
  // 改变选择仍停留在这个页面，preventScrollReset 保持当前滚动位置，不回到页面顶部。
  const [searchParams, setSearchParams] = useSearchParams();

  function changeSelection(selection: Selection) {
    setSearchParams(toSearch(selection), { replace: true, preventScrollReset: true });
  }

  if (manifestQuery.isError) {
    return (
      <section className="space-y-6">
        {pageTitle}
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
        {pageTitle}
        <p>Loading the data release…</p>
      </section>
    );
  }

  // URL 中的 Region 不在 manifest 中时使用默认 Region；之后写入 URL 的是实际显示的 Region。
  const manifest = manifestQuery.data;
  const urlSelection = readSelection(searchParams);
  const partition = findPartition(manifest, urlSelection.regionCode);
  const selection = { ...urlSelection, regionCode: partition.id };

  return (
    <section className="space-y-6">
      {pageTitle}
      <RegionExplorer
        manifest={manifest}
        onSelectionChange={changeSelection}
        partition={partition}
        selection={selection}
      />
    </section>
  );
}

type RegionExplorerProps = {
  manifest: DataManifest;
  partition: ManifestPartition;
  selection: Selection;
  onSelectionChange: (selection: Selection) => void;
};

// 一个 Region 的列表和地图：两者使用同一份当前租金、同一个分类和同一个选中的 SA2。
// 切换 Region 时，查询使用新 Region 的文件地址；已经读取过的 Region 直接使用缓存。
function RegionExplorer({
  manifest,
  partition,
  selection,
  onSelectionChange,
}: RegionExplorerProps) {
  const currentRentsQuery = useRegionCurrentRents(partition);
  const geometryQuery = useRegionGeometry(partition);
  const { dwellingType, bedrooms, sa2Id: selectedSa2Id } = selection;

  function selectArea(sa2Id: string) {
    onSelectionChange({ ...selection, sa2Id });
  }

  // 标题区和筛选在加载、失败和完成三种状态下都显示；数据状态紧挨着数据季度。
  const header = (
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">{partition.name} rental areas</h1>
        <p className="text-muted-foreground">
          {partition.areaCount} areas · {formatDwellingType(dwellingType)} ·{" "}
          {formatBedrooms(bedrooms)} · Data to {manifest.latestPeriod}{" "}
          <DataStatusBadge status={manifest.rentalDataStatus} />
        </p>
      </div>

      <ExploreFilters
        onChange={onSelectionChange}
        partitions={manifest.partitions}
        selection={selection}
      />

      {bedrooms === "1" && <OneBedroomNotice />}
    </>
  );

  if (currentRentsQuery.isError) {
    return (
      <>
        {header}
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
        {header}
        <p>Loading {partition.name} rents…</p>
      </>
    );
  }

  const areas = currentRentsQuery.data;
  const selectedArea = areas.find((area) => area.sa2Id === selectedSa2Id);

  // 边界文件较大，单独显示加载和失败状态；列表不需要等待边界。
  // 边界请求和租金请求在本组件开头同时发出，地图部分只决定显示哪种状态。
  let mapPanel: ReactNode;

  if (geometryQuery.isError) {
    mapPanel = (
      <DataLoadError
        error={geometryQuery.error}
        onRetry={() => geometryQuery.refetch()}
      />
    );
  } else if (geometryQuery.isPending) {
    mapPanel = <p>Loading {partition.name} boundaries…</p>;
  } else {
    // key 使地图在切换 Region 时重新创建，按新 Region 的边界计算初始范围。
    mapPanel = (
      <AreaMap
        areas={areas}
        bedrooms={bedrooms}
        dwellingType={dwellingType}
        geometry={geometryQuery.data}
        key={partition.id}
        onSelect={selectArea}
        selectedSa2Id={selectedSa2Id}
      />
    );
  }

  return (
    <>
      {header}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div>{mapPanel}</div>

        <div className="space-y-4">
          {/* 选中区域卡片：列表较长时，用它确认当前选中了哪个区域。 */}
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Selected area</p>
            {selectedArea ? (
              <>
                <h2 className="text-lg font-semibold">{selectedArea.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedArea.territorialAuthorityName}
                </p>
                <Link
                  className={buttonVariants({
                    className: "mt-3",
                    size: "sm",
                    variant: "outline",
                  })}
                  to={`/areas/${selectedArea.sa2Id}${toSearch({ ...selection, sa2Id: null })}`}
                >
                  View details
                </Link>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold">No area selected</h2>
                <p className="text-sm text-muted-foreground">
                  Select an area on the map or in the list.
                </p>
              </>
            )}
          </div>

          <AreaList
            areas={areas}
            bedrooms={bedrooms}
            dwellingType={dwellingType}
            onSelect={selectArea}
            selectedSa2Id={selectedSa2Id}
          />
        </div>
      </div>

      {/* 数据说明放在地图和列表之后，不推后核心内容。 */}
      <DataReleaseNotice manifest={manifest} />
    </>
  );
}
