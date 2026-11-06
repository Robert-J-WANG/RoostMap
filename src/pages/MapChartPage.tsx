import Map, { NavigationControl } from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";

import { useQuery } from "@tanstack/react-query";

import { loadSampleData } from "@/features/explore/sample-data";

setWorkerUrl(workerUrl);

export function MapChartPage() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["map-chart-sample"],
    queryFn: ({ signal }) => loadSampleData(signal),
    retry: false,
  });

  const mapTilerKey = import.meta.env.VITE_MAPTILER_KEY;

  if (!mapTilerKey) {
    return <p>Set VITE_MAPTILER_KEY to load the basemap.</p>;
  }

  if (isPending) {
    return <p>Loading the Waikato sample data…</p>;
  }

  if (isError) {
    return (
      <div className="space-y-3">
        <p>{error.message}</p>
        <button
          className="rounded-md border px-4 py-2"
          onClick={() => void refetch()}
          type="button"
        >
          Retry loading data
        </button>
      </div>
    );
  }

  if (
    data.map.features.length === 0 ||
    data.history.observations.length === 0
  ) {
    return <p>No map or history observations are available for this sample.</p>;
  }

  return (
    <section className="space-y-6">
      <title>Map and chart sample | RoostMap</title>

      <div>
        <h1 className="text-3xl font-semibold">Waikato rental data sample</h1>
        <p className="mt-2 text-muted-foreground">
          2026-04-01 · All dwelling types · All bedroom categories
        </p>
      </div>

      <div className="h-[420px] overflow-hidden rounded-xl border sm:h-[560px]">
        <Map
          initialViewState={{
            longitude: 175.3,
            latitude: -37.8,
            zoom: 7,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={`https://api.maptiler.com/maps/streets-v4/style.json?key=${mapTilerKey}`}
          attributionControl={{ compact: false }}
        >
          <NavigationControl position="top-right" />
        </Map>
      </div>

      <div className="rounded-xl border bg-card p-4 text-sm">
        <p>Loaded SA2 boundaries: {data.map.features.length}</p>
        <p>Initial SA2: {data.history.sa2Id}</p>
        <p>
          History classification: {data.history.dwellingType} /{" "}
          {data.history.bedroomCategory}
        </p>
        <p>Quarterly observations: {data.history.observations.length}</p>
      </div>
    </section>
  );
}
