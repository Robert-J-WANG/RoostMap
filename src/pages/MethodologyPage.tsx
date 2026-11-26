import type { ReactNode } from "react";

import { DataLoadError } from "@/components/DataLoadError";
import { DataStatusBadge } from "@/components/DataStatusBadge";
import type { DataManifest } from "@/data/contracts";
import { useManifest } from "@/data/queries";
import { formatCoverage } from "@/lib/format";

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

      <article className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Data methodology
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          How RoostMap interprets rental areas
        </h1>

        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          RoostMap uses official rental observations and statistical geography
          so that area comparisons retain a consistent geographic meaning.
        </p>

        <MethodologySection title="What the figures describe">
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

        <MethodologySection title="Current rent">
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

        <MethodologySection title="Rent history">
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

        <MethodologySection title="Missing data">
          <p>
            MBIE does not publish combinations with fewer than five bonds, and
            some published records have no rent. RoostMap shows these values
            as No data. It does not replace them with zero, with values from
            another dwelling type or bedroom category, or with estimates for
            missing quarters.
          </p>
        </MethodologySection>

        <MethodologySection title="Geography">
          <p>
            Areas use Stats NZ Statistical Area 2 (SA2) 2019 boundaries. An
            area is published when its MBIE records include at least one rent
            in any dwelling type or bedroom category and its SA2 code matches a
            Stats NZ boundary. Region and territorial authority names are used
            for navigation and display only.
          </p>
        </MethodologySection>

        {/* 已知限制：数据和产品本身的限制，与上面各节的规则一致。 */}
        <MethodologySection title="Known limitations">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Figures only cover new private-sector tenancies with a bond lodged
              with MBIE. They do not describe existing tenancies, asking rents
              or homes currently available.
            </li>
            <li>
              The most recent quarters can be provisional, and MBIE may revise
              them in later data.
            </li>
            <li>
              Combinations with fewer than five bonds are not published, so
              smaller areas and less common categories often have no data or
              only a few quarters of history.
            </li>
            <li>
              1-bedroom figures from 2024-10-01 follow a changed source
              classification, so their 12-month change is N/A.
            </li>
            <li>
              The current rent is a median and the history is a geometric mean,
              so the two can differ for the same quarter.
            </li>
            <li>
              Boundaries are the generalised SA2 2019 boundaries. They are
              simplified for the map and do not match current suburb names or
              property boundaries.
            </li>
            <li>
              Each data release is a fixed copy of the source data. RoostMap
              does not update automatically when MBIE publishes a new quarter.
            </li>
          </ul>
        </MethodologySection>

        {releaseDetails}
      </article>
    </>
  );
}

type MethodologySectionProps = {
  title: string;
  children: ReactNode;
};

// 一节说明：标题和正文。
function MethodologySection({ title, children }: MethodologySectionProps) {
  return (
    <section className="mt-10 space-y-4 border-t pt-8 leading-7 text-muted-foreground">
      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
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
      <MethodologySection title="Current data release">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm">Release version</dt>
            <dd className="font-medium text-foreground">{manifest.version}</dd>
          </div>
          <div>
            <dt className="text-sm">Data to</dt>
            <dd className="font-medium text-foreground">
              {manifest.latestPeriod}{" "}
              <DataStatusBadge status={manifest.rentalDataStatus} />
            </dd>
          </div>
          <div>
            <dt className="text-sm">Coverage</dt>
            <dd className="font-medium text-foreground">
              {formatCoverage(manifest.partitions)}
            </dd>
          </div>
          <div>
            <dt className="text-sm">Generated</dt>
            <dd className="font-medium text-foreground">
              {manifest.generatedAt.slice(0, 10)}
            </dd>
          </div>
        </dl>
        {manifest.rentalDataStatus === "provisional" && (
          <p>{manifest.rentalDataNotice}</p>
        )}
      </MethodologySection>

      <MethodologySection title="Data sources">
        <ul className="space-y-6">
          {manifest.sources.map((source) => (
            <li className="space-y-1" key={source.id}>
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
