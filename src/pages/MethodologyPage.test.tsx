import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MethodologyPage } from "@/pages/MethodologyPage";
import { mbieSourceSha256, mbieSourceUrl, serveRelease } from "@/test/release-fixtures";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Methodology page", () => {
  it("shows the release and each source with its licence, retrieval date and checksum", async () => {
    serveRelease();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MethodologyPage />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("2026-04-01.1")).toBeInTheDocument();
    expect(screen.getByText("2 Regions · 4 areas")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "MBIE Rental Bond Data" })).toHaveAttribute("href", mbieSourceUrl);
    expect(screen.getByText("Licence: Creative Commons Attribution 3.0 New Zealand")).toBeInTheDocument();
    expect(screen.getAllByText("Retrieved: 2026-10-27")).toHaveLength(2);
    expect(screen.getByText(mbieSourceSha256)).toBeInTheDocument();
  });
});
