import { Link, isRouteErrorResponse, useRouteError } from "react-router";

import { buttonVariants } from "@/components/ui/button";

export function RouteErrorPage() {
  const error = useRouteError();

  const description = isRouteErrorResponse(error)
    ? `The page failed with status ${error.status}.`
    : "An unexpected error prevented this page from being displayed.";

  return (
    <>
      <title>Something went wrong | RoostMap</title>

      <section className="mx-auto max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-destructive">
          Error
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Something went wrong
        </h1>

        <p className="mt-4 text-muted-foreground">{description}</p>

        <Link className={buttonVariants({ className: "mt-8" })} to="/">
          Return home
        </Link>
      </section>
    </>
  );
}
