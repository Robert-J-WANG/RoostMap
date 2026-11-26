import {
  bedroomCategories,
  dwellingTypes,
  type Bedrooms,
  type DwellingType,
  type ManifestPartition,
} from "@/data/contracts";
import type { Selection } from "@/data/selection";
import { formatBedrooms, formatDwellingType } from "@/lib/format";

type ExploreFiltersProps = {
  partitions: ManifestPartition[];
  selection: Selection;
  onChange: (selection: Selection) => void;
};

const selectClassName = "h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground";

// Region、住宅类型和卧室数三个选择框；选项来自 manifest 和发布分类列表。
export function ExploreFilters({ partitions, selection, onChange }: ExploreFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Region</span>
        {/* 换 Region 后原来选中的 SA2 不在新列表中，因此清除选择。 */}
        <select
          className={selectClassName}
          onChange={(event) =>
            onChange({ ...selection, regionCode: event.target.value, sa2Id: null })
          }
          value={selection.regionCode}
        >
          {partitions.map((partition) => (
            <option key={partition.id} value={partition.id}>
              {partition.name}
            </option>
          ))}
        </select>
      </label>

      {/* 换分类时保留选中的 SA2，同一个区域在新分类下的租金直接显示。
          选项的 value 都来自发布分类列表，因此可以把 event.target.value 当作分类类型。 */}
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Dwelling type</span>
        <select
          className={selectClassName}
          onChange={(event) =>
            onChange({ ...selection, dwellingType: event.target.value as DwellingType })
          }
          value={selection.dwellingType}
        >
          {dwellingTypes.map((dwellingType) => (
            <option key={dwellingType} value={dwellingType}>
              {formatDwellingType(dwellingType)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Bedrooms</span>
        <select
          className={selectClassName}
          onChange={(event) =>
            onChange({ ...selection, bedrooms: event.target.value as Bedrooms })
          }
          value={selection.bedrooms}
        >
          {bedroomCategories.map((bedrooms) => (
            <option key={bedrooms} value={bedrooms}>
              {formatBedrooms(bedrooms)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
