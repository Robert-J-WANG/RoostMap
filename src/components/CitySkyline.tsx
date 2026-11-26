// 首页介绍区底部的城市剪影：远处的山、海边的楼群和水面，只用线条和很淡的填充。
// 图形是虚构的示意，不对应某个真实城市；颜色使用 currentColor，随主题变化。
export function CitySkyline({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" preserveAspectRatio="xMidYMax slice" viewBox="0 0 1200 220">
      {/* 远处的山 */}
      <path
        d="M0 150C110 118 200 132 300 108S500 62 620 92 840 128 960 96 1130 70 1200 88V220H0Z"
        fill="currentColor"
        fillOpacity="0.05"
        stroke="currentColor"
        strokeOpacity="0.35"
      />
      {/* 楼群 */}
      <g fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.45">
        <rect height="52" width="44" x="380" y="118" />
        <rect height="74" width="36" x="430" y="96" />
        <rect height="100" width="48" x="472" y="70" />
        <rect height="82" width="40" x="526" y="88" />
        <rect height="118" width="52" x="572" y="52" />
        <rect height="92" width="44" x="630" y="78" />
        <rect height="110" width="40" x="680" y="60" />
        <rect height="78" width="48" x="726" y="92" />
        <rect height="60" width="40" x="780" y="110" />
        <rect height="44" width="44" x="826" y="126" />
      </g>
      {/* 水面 */}
      <path d="M0 176H1200M140 192H520M680 192H1060" stroke="currentColor" strokeDasharray="10 8" strokeOpacity="0.3" />
    </svg>
  );
}
