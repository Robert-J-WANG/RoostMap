import type { ReactNode } from "react";
import { useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import type { ManifestPartition } from "@/data/contracts";
import {
  useManifest,
  useRegionCurrentRents,
  useRegionGeometry,
} from "@/data/queries";
import { AreaList } from "@/features/explore/AreaList";
import { AreaMap } from "@/features/explore/AreaMap";

// 读取失败时显示带文件地址的错误，并允许重新请求。
function DataLoadError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <p className="whitespace-pre-wrap text-sm">{error.message}</p>
      <Button onClick={onRetry} type="button" variant="outline">
        Retry
      </Button>
    </div>
  );
}

const pageTitle = <title>Explore | RoostMap</title>;

// 页面入口：先读取 manifest，成功后显示其中 Region 的列表和地图。
export function ExplorePage() {
  const manifestQuery = useManifest();

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

  // 当前 release 只有一个 Region，直接使用 manifest 中的第一个。
  return (
    <section className="space-y-6">
      {pageTitle}
      <RegionExplorer
        latestPeriod={manifestQuery.data.latestPeriod}
        partition={manifestQuery.data.partitions[0]}
      />
    </section>
  );
}

type RegionExplorerProps = {
  latestPeriod: string;
  partition: ManifestPartition;
};

// 一个 Region 的列表和地图：两者使用同一份当前租金和 URL 中的同一个选择。
function RegionExplorer({ latestPeriod, partition }: RegionExplorerProps) {
  const currentRentsQuery = useRegionCurrentRents(partition);
  const geometryQuery = useRegionGeometry(partition);

  // 选中的 SA2 保存在 URL（?sa2=179900），刷新或分享链接后可以恢复。
  // 选择区域时替换当前历史记录，后退按钮不会逐个回到之前选过的区域。
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSa2Id = searchParams.get("sa2");

  function selectArea(sa2Id: string) {
    setSearchParams({ sa2: sa2Id }, { replace: true });
  }

  // 标题区在加载、失败和完成三种状态下都显示。
  const header = (
    <div className="space-y-2">
      <h1 className="text-3xl font-semibold">{partition.name} rental areas</h1>
      <p className="text-muted-foreground">
        {partition.areaCount} areas · All dwelling types · All bedroom
        categories · Data to {latestPeriod}
      </p>
    </div>
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
    mapPanel = (
      <AreaMap
        areas={areas}
        geometry={geometryQuery.data}
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
            onSelect={selectArea}
            selectedSa2Id={selectedSa2Id}
          />
        </div>
      </div>
    </>
  );
}
