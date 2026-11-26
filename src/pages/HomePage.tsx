import { ArrowRightIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { DataLoadError } from "@/components/DataLoadError";
import { DataReleaseNotice } from "@/components/DataReleaseNotice";
import { DataStatusBadge } from "@/components/DataStatusBadge";
import { buttonVariants } from "@/components/ui/button";
import type { DataManifest } from "@/data/contracts";
import { useManifest } from "@/data/queries";
import { formatCoverage } from "@/lib/format";

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

      <section className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            New Zealand rental-area evidence
          </p>

          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Make clearer rental decisions with area-level evidence.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            RoostMap shows the weekly rents recorded in official rental bond
            data for each Statistical Area 2 (SA2), so you can compare areas
            using the same data definitions.
          </p>

          <p className="mt-4 max-w-2xl text-muted-foreground">
            It does not show live listings or tell you where to live.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link className={buttonVariants({ size: "lg" })} to="/explore">
              Explore rental areas
              <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
            </Link>
            <Link
              className={buttonVariants({ size: "lg", variant: "outline" })}
              to="/methodology"
            >
              View the methodology
            </Link>
          </div>
        </div>

        <aside className="rounded-2xl border bg-card p-6 shadow-[var(--surface-shadow)]">
          <h2 className="text-lg font-semibold">Current data release</h2>
          <div className="mt-4">{releaseSummary}</div>
        </aside>
      </section>

      {manifestQuery.data && (
        <div className="mt-12">
          <DataReleaseNotice manifest={manifestQuery.data} />
        </div>
      )}
    </>
  );
}

type ReleaseSummaryProps = {
  manifest: DataManifest;
};

// 当前 release 覆盖的 Region、区域数量、数据季度和分类，如实说明现在能查看什么。
function ReleaseSummary({ manifest }: ReleaseSummaryProps) {
  return (
    <dl className="space-y-3 text-sm">
      <div>
        <dt className="text-muted-foreground">Coverage</dt>
        <dd className="font-medium">{formatCoverage(manifest.partitions)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Data to</dt>
        <dd className="font-medium">
          {manifest.latestPeriod}{" "}
          <DataStatusBadge status={manifest.rentalDataStatus} />
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Classification</dt>
        <dd className="font-medium">All dwelling types · All bedroom categories</dd>
      </div>
    </dl>
  );
}
