import {
  ArrowRightIcon,
  ChartLineIcon,
  DatabaseIcon,
  MapIcon,
  MapPinnedIcon,
  SlidersHorizontalIcon,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { CitySkyline } from "@/components/CitySkyline";
import { DataLoadError } from "@/components/DataLoadError";
import { DataStatusBadge } from "@/components/DataStatusBadge";
import { buttonVariants } from "@/components/ui/button";
import type { DataManifest } from "@/data/contracts";
import { useManifest } from "@/data/queries";
import { formatCoverage } from "@/lib/format";

// 首页的三个功能，与 Explore 和 Area Detail 的实际功能一一对应。
const features: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: MapIcon,
    title: "Explore every Region",
    text: "Switch between New Zealand Regions and see each SA2 area on a map and in a list.",
  },
  {
    icon: SlidersHorizontalIcon,
    title: "Filter by home type",
    text: "Choose a dwelling type and bedroom category. The map, list and area details all use the same category.",
  },
  {
    icon: ChartLineIcon,
    title: "See rent over time",
    text: "Open an area for its latest rent, Reported Bonds, 12-month change and quarterly rent history.",
  },
];

export function HomePage() {
  const manifestQuery = useManifest();

  // 当前 release 的内容来自 manifest；产品介绍不依赖 manifest，读取失败时仍然显示。
  let releaseSummary: ReactNode;

  if (manifestQuery.isError) {
    releaseSummary = (
      <DataLoadError
        error={manifestQuery.error}
        onRetry={() => manifestQuery.refetch()}
      />
    );
  } else if (manifestQuery.isPending) {
    releaseSummary = (
      <p className="text-sm text-muted-foreground">
        Loading the current data release…
      </p>
    );
  } else {
    releaseSummary = <ReleaseSummary manifest={manifestQuery.data} />;
  }

  return (
    <>
      <title>Home | RoostMap</title>

      {/* 介绍：左边说明产品和当前数据 release，右边是 Explore 页面的真实截图；
          背后是一张很淡的惠灵顿港照片，作为装饰背景。 */}
      <section className="relative isolate grid items-center gap-12 pt-4 pb-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)] lg:pt-10 lg:pb-24">
        {/* 惠灵顿港的照片铺满整个页面宽度，叠一层背景色渐变，只隐约可见，不影响文字阅读。
            照片：Sebastian Schuster / Unsplash（Unsplash License）。 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 bottom-0 left-1/2 -z-20 w-screen -translate-x-1/2 overflow-hidden"
        >
          <img
            alt=""
            className="h-full w-full object-cover object-[center_65%] opacity-50 saturate-[0.7] dark:opacity-25"
            src="/images/wellington-harbour.jpg"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/55 to-background" />
        </div>

        <div>
          <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-primary shadow-xs">
            <MapPinnedIcon aria-hidden="true" className="size-3.5" />
            New Zealand rental-area evidence
          </p>

          <h1 className="mt-5 text-4xl leading-[1.08] font-semibold text-balance sm:text-5xl">
            Make clearer rental decisions with{" "}
            <span className="text-primary">area-level evidence</span>.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
            RoostMap shows the weekly rents recorded in official rental bond
            data for each Statistical Area 2 (SA2), so you can compare areas
            using the same data definitions. It does not show live listings or
            tell you where to live.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className={buttonVariants({ className: "h-10 px-4", size: "lg" })}
              to="/explore"
            >
              Explore rental areas
              <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
            </Link>
            <Link
              className={buttonVariants({
                className: "h-10 px-4",
                size: "lg",
                variant: "outline",
              })}
              to="/methodology"
            >
              View the methodology
            </Link>
          </div>

          {/* 当前数据 release：用一行带分隔线的数字说明，而不是又一张卡片。 */}
          <div className="mt-10 max-w-xl border-t pt-5">
            <h2 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Current data release
            </h2>
            <div className="mt-3">{releaseSummary}</div>
          </div>
        </div>

        <div className="relative">
          {/* 装饰：截图后方的点阵和一团柔和的珊瑚色光晕。 */}
          <div
            aria-hidden="true"
            className="absolute -right-3 -bottom-5 -z-10 size-44 sm:-right-5 [background-image:radial-gradient(var(--primary)_1.5px,transparent_1.5px)] [background-size:14px_14px] opacity-25"
          />
          <div
            aria-hidden="true"
            className="absolute -top-10 -left-10 -z-10 size-48 rounded-full bg-highlight/25 blur-3xl"
          />

          <figure className="rounded-xl border bg-card p-2 shadow-[var(--surface-shadow)]">
            {/* 窗口顶栏：三个圆点，提示这是应用界面的截图。 */}
            <div aria-hidden="true" className="flex gap-1.5 px-2 pt-1 pb-2">
              <span className="size-2.5 rounded-full bg-chart-4/70" />
              <span className="size-2.5 rounded-full bg-chart-3/70" />
              <span className="size-2.5 rounded-full bg-chart-1/70" />
            </div>
            <img
              alt="The RoostMap Explore page showing Wellington rental areas coloured by median weekly rent, with Thorndon selected."
              className="w-full rounded-lg border"
              height={1134}
              src="/images/explore-preview.jpg"
              width={1632}
            />
          </figure>
        </div>
      </section>

      {/* 功能：三列编号说明，用顶部的分隔线区分，不再使用卡片。 */}
      <section className="mt-16">
        <p className="text-xs font-semibold tracking-[0.18em] text-highlight uppercase">
          What you can do
        </p>
        <h2 className="mt-2 text-3xl font-semibold">
          Compare areas on the same terms
        </h2>

        <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
          {features.map(({ icon: Icon, title, text }, index) => (
            <li className="border-t-2 border-primary/20 pt-6" key={title}>
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="text-xs font-semibold text-highlight tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {text}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* 数据来源只用一行说明，详细的来源、计算规则和限制都在 Methodology 中。 */}
      <section className="mt-16 flex flex-col gap-2 border-t pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-3 text-muted-foreground sm:items-center">
          <DatabaseIcon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-primary sm:mt-0"
          />
          <span>
            Official data from MBIE Rental Bond Data and Stats NZ SA2 2019
            boundaries. Not live listings.
          </span>
        </p>
        <Link
          className={buttonVariants({
            className: "-ml-2.5 shrink-0 sm:ml-0",
            variant: "link",
          })}
          to="/methodology"
        >
          How the data is processed
          <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
        </Link>
      </section>

      {/* 页面内容底部的城市剪影：很淡的线条，左右两端渐隐，作为首页的收尾装饰。 */}
      <CitySkyline className="pointer-events-none -mb-20 mt-12 h-28 w-full text-primary opacity-40 [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)] sm:-mb-24 lg:h-36" />
    </>
  );
}

type ReleaseSummaryProps = {
  manifest: DataManifest;
};

// 当前 release 覆盖的 Region、区域数量、数据季度和分类，三项并排，用竖线分隔。
function ReleaseSummary({ manifest }: ReleaseSummaryProps) {
  return (
    <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3 sm:divide-x">
      <div className="sm:pr-4">
        <dt className="text-xs text-muted-foreground">Coverage</dt>
        <dd className="mt-0.5 font-semibold">
          {formatCoverage(manifest.partitions)}
        </dd>
      </div>
      <div className="sm:px-4">
        <dt className="text-xs text-muted-foreground">Data to</dt>
        <dd className="mt-0.5 font-semibold">
          {manifest.latestPeriod}{" "}
          <DataStatusBadge status={manifest.rentalDataStatus} />
        </dd>
      </div>
      <div className="sm:pl-4">
        <dt className="text-xs text-muted-foreground">Classification</dt>
        <dd className="mt-0.5 font-semibold">Dwelling type and bedrooms</dd>
      </div>
    </dl>
  );
}
