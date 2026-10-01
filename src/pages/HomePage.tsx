import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router";

import { buttonVariants } from "@/components/ui/button";

const productPrinciples = [
  "Compare rental areas on a consistent SA2 geography.",
  "Understand rent observations with clear periods and sources.",
  "Consider housing cost together with commuting requirements.",
];

export function HomePage() {
  return (
    <>
      <title>Home | RoostMap</title>

      <section className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            New Zealand rental-area planning
          </p>

          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Make clearer rental decisions with area-level evidence.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            RoostMap brings rental affordability, historical rent context and
            commuting requirements into one decision-making experience.
          </p>

          <Link
            className={buttonVariants({
              className: "mt-8",
              size: "lg",
              variant: "outline",
            })}
            to="/methodology"
          >
            View the methodology
            <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
          </Link>
        </div>

        <aside
          aria-label="Product principles"
          className="rounded-2xl border bg-card p-6 shadow-[var(--surface-shadow)]"
        >
          <h2 className="text-lg font-semibold">
            Designed for clear comparison
          </h2>

          <ul className="mt-5 space-y-4 text-sm leading-6 text-muted-foreground">
            {productPrinciples.map((principle) => (
              <li className="border-l-2 border-primary pl-4" key={principle}>
                {principle}
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </>
  );
}
