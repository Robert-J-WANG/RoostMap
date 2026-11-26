import {
  BookOpenIcon,
  ChartLineIcon,
  CircleDashedIcon,
  DatabaseIcon,
  FileTextIcon,
  InfoIcon,
  LandmarkIcon,
  LayersIcon,
  ReceiptTextIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { DataLoadError } from "@/components/DataLoadError";
import { DataStatusBadge } from "@/components/DataStatusBadge";
import type { DataManifest } from "@/data/contracts";
import { useManifest } from "@/data/queries";
import { formatCoverage } from "@/lib/format";

// 页首的三个要点。
const keyPoints: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: LandmarkIcon, title: "Official sources", text: "MBIE Rental Bond Data and Stats NZ SA2 2019 boundaries." },
  { icon: CircleDashedIcon, title: "Missing stays missing", text: "No zeros, estimates or values from another category." },
  { icon: InfoIcon, title: "Not live listings", text: "New bonds lodged with MBIE, not homes currently available." },
];

// 本页目录：与下面各节的 id 和标题一一对应。
const pageSections = [
  { id: "figures", title: "What the figures describe" },
  { id: "current-rent", title: "Current rent" },
  { id: "rent-history", title: "Rent history" },
  { id: "missing-data", title: "Missing data" },
  { id: "geography", title: "Geography" },
  { id: "known-limitations", title: "Known limitations" },
  { id: "data-release", title: "Current data release" },
  { id: "data-sources", title: "Data sources" },
];

export function MethodologyPage() {
  const manifestQuery = useManifest();

  // 计算规则是固定说明，不依赖 manifest；当前 release 和数据来源来自 manifest。
  let releaseDetails: ReactNode;

  if (manifestQuery.isError) {
    releaseDetails = (
      <DataLoadError
        error={manifestQuery.error}
        onRetry={() => manifestQuery.refetch()}
      />
    );
  } else if (manifestQuery.isPending) {
    releaseDetails = (
      <p className="text-muted-foreground">Loading the current data release…</p>
    );
  } else {
    releaseDetails = <ReleaseDetails manifest={manifestQuery.data} />;
  }

  return (
    <>
      <title>Methodology | RoostMap</title>

      <article>
        <header className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-primary shadow-xs">
            <BookOpenIcon aria-hidden="true" className="size-3.5" />
            Data methodology
          </p>

          <h1 className="mt-5 text-3xl font-semibold text-balance">
            How RoostMap interprets rental areas
          </h1>

          <p className="mt-4 text-base leading-7 text-muted-foreground">
            RoostMap uses official rental observations and statistical geography
            so that area comparisons retain a consistent geographic meaning.
          </p>
        </header>

        {/* 三个要点：一行并排，用竖线分隔，概括整页最重要的规则。 */}
        <ul className="mt-8 grid gap-4 border-y py-5 text-sm sm:grid-cols-3 sm:divide-x">
          {keyPoints.map(({ icon: Icon, title, text }) => (
            <li className="flex gap-3 sm:px-5 sm:first:pl-0" key={title}>
              <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* 桌面上左侧是本页目录，滚动时固定在窗口中；右侧是各节说明。 */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-16">
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                On this page
              </p>
              <ul className="mt-3 space-y-1 border-l text-sm">
                {pageSections.map((section) => (
                  <li key={section.id}>
                    <a
                      className="-ml-px block border-l border-transparent py-1 pl-4 text-muted-foreground hover:border-primary hover:text-foreground"
                      href={`#${section.id}`}
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="max-w-3xl min-w-0">
            <MethodologySection icon={FileTextIcon} id="figures" title="What the figures describe">
              <p>
                The figures come from MBIE Rental Bond Data: bonds lodged for new
                private-sector tenancies, counted by tenancy start date. They are
                not live listings, asking rents or a record of all rented homes.
              </p>
              <p>
                RoostMap reports area-level evidence. It does not rank areas or
                recommend where to live.
              </p>
            </MethodologySection>

            <MethodologySection icon={ReceiptTextIcon} id="current-rent" title="Current rent">
              <p>
                Each area has a current rent for every dwelling type and bedroom
                category that MBIE publishes for it, including all dwelling types
                and all bedroom categories combined. Pages show the category
                selected in Explore.
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong className="text-foreground">
                    Latest observed median weekly rent
                  </strong>{" "}
                  is the Median Rent from the most recent quarter in which the area
                  has a rent. When that quarter is earlier than the latest quarter
                  in the data, pages show the quarter and do not describe the rent
                  as current.
                </li>
                <li>
                  <strong className="text-foreground">Reported Bonds</strong> is the
                  number of bonds recorded in that same quarter. It describes how
                  much data supports the rent, not how many homes are available.
                </li>
                <li>
                  <strong className="text-foreground">12-month change</strong>{" "}
                  compares the Geometric Mean Rent in the latest quarter of the
                  data with the same quarter one year earlier: latest ÷ one year
                  earlier − 1. When either quarter has no Geometric Mean Rent, it
                  is shown as N/A.
                </li>
              </ul>
              <p>
                From 2024-10-01, MBIE's 1-bedroom records show a jump in
                Reported Bonds and rents that the other categories do not, which
                points to a change in the source classification rather than in the
                market. 1-bedroom rents are still shown, but their 12-month change
                is N/A when either compared quarter is 2024-10-01 or later.
              </p>
            </MethodologySection>

            <MethodologySection icon={ChartLineIcon} id="rent-history" title="Rent history">
              <p>
                Area pages show the Geometric Mean Rent for each quarter in the
                selected category, from its first MBIE record to the latest
                quarter in the data. MBIE publishes both a median and a
                geometric mean for each quarter; RoostMap uses the geometric mean
                for history and the 12-month change, and the median for the
                current rent.
              </p>
              <p>
                Quarters without a rent are left as gaps; the line is not drawn
                across them. With fewer than four quarters, the quarters are shown
                as separate points without a line, and a single quarter is
                described in text.
              </p>
            </MethodologySection>

            <MethodologySection icon={CircleDashedIcon} id="missing-data" title="Missing data">
              <p>
                MBIE does not publish combinations with fewer than five bonds, and
                some published records have no rent. RoostMap shows these values
                as No data. It does not replace them with zero, with values from
                another dwelling type or bedroom category, or with estimates for
                missing quarters.
              </p>
            </MethodologySection>

            <MethodologySection icon={LayersIcon} id="geography" title="Geography">
              <p>
                Areas use Stats NZ Statistical Area 2 (SA2) 2019 boundaries. An
                area is published when its MBIE records include at least one rent
                in any dwelling type or bedroom category and its SA2 code matches a
                Stats NZ boundary. Region and territorial authority names are used
                for navigation and display only.
              </p>
            </MethodologySection>

            {/* 已知限制：数据和产品本身的限制，与上面各节的规则一致。 */}
            <MethodologySection icon={TriangleAlertIcon} id="known-limitations" title="Known limitations">
              {/* 每条限制一个小块，左侧的珊瑚色边线提示这是需要注意的内容。 */}
              <ul className="grid gap-3 sm:grid-cols-2">
                <li className="rounded-lg border border-l-2 border-l-highlight bg-card/70 p-3 text-sm leading-6">
                  Figures only cover new private-sector tenancies with a bond lodged with MBIE. They do not describe existing tenancies, asking rents or homes currently available.
                </li>
                <li className="rounded-lg border border-l-2 border-l-highlight bg-card/70 p-3 text-sm leading-6">
                  The most recent quarters can be provisional, and MBIE may revise them in later data.
                </li>
                <li className="rounded-lg border border-l-2 border-l-highlight bg-card/70 p-3 text-sm leading-6">
                  Combinations with fewer than five bonds are not published, so smaller areas and less common categories often have no data or only a few quarters of history.
                </li>
                <li className="rounded-lg border border-l-2 border-l-highlight bg-card/70 p-3 text-sm leading-6">
                  1-bedroom figures from 2024-10-01 follow a changed source classification, so their 12-month change is N/A.
                </li>
                <li className="rounded-lg border border-l-2 border-l-highlight bg-card/70 p-3 text-sm leading-6">
                  The current rent is a median and the history is a geometric mean, so the two can differ for the same quarter.
                </li>
                <li className="rounded-lg border border-l-2 border-l-highlight bg-card/70 p-3 text-sm leading-6">
                  Boundaries are the generalised SA2 2019 boundaries. They are simplified for the map and do not match current suburb names or property boundaries.
                </li>
                <li className="rounded-lg border border-l-2 border-l-highlight bg-card/70 p-3 text-sm leading-6">
                  Each data release is a fixed copy of the source data. RoostMap does not update automatically when MBIE publishes a new quarter.
                </li>
              </ul>
            </MethodologySection>

            {releaseDetails}
          </div>
        </div>
      </article>
    </>
  );
}

type MethodologySectionProps = {
  icon: LucideIcon;
  id: string;
  title: string;
  children: ReactNode;
};

// 一节说明：带图标的标题和正文。id 供本页目录跳转；scroll-mt 让跳转后标题不被固定的页头挡住。
// 第一节上方已经有分隔线，不再重复。
function MethodologySection({ icon: Icon, id, title, children }: MethodologySectionProps) {
  return (
    <section
      className="mt-10 scroll-mt-24 space-y-4 border-t pt-8 leading-7 text-muted-foreground first:mt-0 first:border-t-0 first:pt-0"
      id={id}
    >
      <h2 className="flex items-center gap-3 text-lg font-semibold text-foreground">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

type ReleaseDetailsProps = {
  manifest: DataManifest;
};

// 当前 release 和数据来源：版本、季度、状态、覆盖范围，以及每个源文件的许可证、下载日期和 SHA-256。
function ReleaseDetails({ manifest }: ReleaseDetailsProps) {
  return (
    <>
      <MethodologySection icon={DatabaseIcon} id="data-release" title="Current data release">
        <dl className="grid grid-cols-2 gap-4 rounded-xl border bg-card p-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs">Release version</dt>
            <dd className="font-medium text-foreground">{manifest.version}</dd>
          </div>
          <div>
            <dt className="text-xs">Data to</dt>
            <dd className="font-medium text-foreground">
              {manifest.latestPeriod}{" "}
              <DataStatusBadge status={manifest.rentalDataStatus} />
            </dd>
          </div>
          <div>
            <dt className="text-xs">Coverage</dt>
            <dd className="font-medium text-foreground">
              {formatCoverage(manifest.partitions)}
            </dd>
          </div>
          <div>
            <dt className="text-xs">Generated</dt>
            <dd className="font-medium text-foreground">
              {manifest.generatedAt.slice(0, 10)}
            </dd>
          </div>
        </dl>
        {manifest.rentalDataStatus === "provisional" && (
          <p>{manifest.rentalDataNotice}</p>
        )}
      </MethodologySection>

      <MethodologySection icon={LandmarkIcon} id="data-sources" title="Data sources">
        <ul className="grid gap-4 sm:grid-cols-2">
          {manifest.sources.map((source) => (
            <li className="space-y-1 rounded-xl border bg-card p-4 text-sm" key={source.id}>
              <a
                className="font-medium text-foreground underline underline-offset-4"
                href={source.url}
                rel="noreferrer"
                target="_blank"
              >
                {source.name}
              </a>
              <p>Licence: {source.licence}</p>
              <p>Retrieved: {source.retrievedAt}</p>
              <p className="break-all">
                SHA-256 of the source file:{" "}
                <code className="text-xs">{source.sha256}</code>
              </p>
            </li>
          ))}
        </ul>
      </MethodologySection>
    </>
  );
}
