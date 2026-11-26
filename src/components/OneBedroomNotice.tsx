// 选择 1 卧分类时显示的固定可比性说明，Explore 和 Area Detail 共用。
// 从 2024-10-01 起，MBIE 的 1 卧记录出现与其他分类不一致的跳升，判断为源分类变化；
// 流水线因此不计算跨过这个季度的 1 卧 12 个月变化。完整依据写在 Methodology 中。
export function OneBedroomNotice() {
  return (
    <p className="rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
      MBIE's 1-bedroom figures from 2024-10-01 follow a changed source
      classification, so their 12-month change is shown as N/A.
    </p>
  );
}
