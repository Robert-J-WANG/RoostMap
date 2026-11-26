// 品牌标识：与 favicon 相同的房屋图形，加上 "RoostMap" 字标。
// 图形使用主题色，深色模式下随主题变化；"Map" 用主题色与 "Roost" 区分。
export function BrandMark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg aria-hidden="true" className="size-8 shrink-0" viewBox="0 0 32 32">
        <rect fill="var(--primary)" height="32" rx="8" width="32" />
        <path
          d="M8 16.5 16 9l8 7.5"
          fill="none"
          stroke="var(--primary-foreground)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
        />
        <path
          d="M11 15v8h10v-8"
          fill="none"
          stroke="var(--primary-foreground)"
          strokeLinejoin="round"
          strokeWidth="2.5"
        />
        <circle cx="16" cy="19" fill="var(--highlight)" r="2" />
      </svg>
      <span className="font-heading text-lg font-semibold tracking-tight">
        Roost<span className="text-primary">Map</span>
      </span>
    </span>
  );
}
