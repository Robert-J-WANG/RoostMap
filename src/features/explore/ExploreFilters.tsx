import { BedDoubleIcon, ChevronDownIcon, HouseIcon, MapPinIcon, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  bedroomCategories,
  dwellingTypes,
  type Bedrooms,
  type DwellingType,
  type ManifestPartition,
} from "@/data/contracts";
import type { Selection } from "@/data/selection";
import { formatBedrooms, formatDwellingType } from "@/lib/format";
import { cn } from "@/lib/utils";

type ExploreFiltersProps = {
  partitions: ManifestPartition[];
  selection: Selection;
  onChange: (selection: Selection) => void;
};

type FilterFieldProps = {
  label: string;
  icon: LucideIcon;
  className?: string;
  children: ReactNode;
};

// 一个筛选项：小标题和带图标的原生选择框；<label> 把文字和选择框关联在一起。
// appearance-none 去掉浏览器自带的箭头，改用右侧留有边距的图标，与左侧图标对称。
function FilterField({ label, icon: Icon, className, children }: FilterFieldProps) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1 text-xs font-medium text-muted-foreground", className)}>
      {label}
      <span className="relative">
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-primary"
        />
        {children}
        <ChevronDownIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </span>
    </label>
  );
}

const selectClassName =
  "h-10 w-full appearance-none truncate rounded-lg border bg-background pr-9 pl-9 text-sm font-medium text-foreground shadow-xs";

// Region、住宅类型和卧室数三个选择框；选项来自 manifest 和发布分类列表。
// 手机上 Region 占一整行，两个分类并排，减少筛选占用的高度。
export function ExploreFilters({ partitions, selection, onChange }: ExploreFiltersProps) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-3 shadow-xs sm:grid-cols-3">
      {/* 换 Region 后原来选中的 SA2 不在新列表中，因此清除选择。 */}
      <FilterField className="col-span-2 sm:col-span-1" icon={MapPinIcon} label="Region">
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
      </FilterField>

      {/* 换分类时保留选中的 SA2，同一个区域在新分类下的租金直接显示。
          选项的 value 都来自发布分类列表，因此可以把 event.target.value 当作分类类型。 */}
      <FilterField icon={HouseIcon} label="Dwelling type">
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
      </FilterField>

      <FilterField icon={BedDoubleIcon} label="Bedrooms">
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
      </FilterField>
    </div>
  );
}
