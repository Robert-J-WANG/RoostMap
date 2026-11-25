import { Link } from "react-router";

import type { DataManifest } from "@/data/contracts";

type DataReleaseNoticeProps = {
  manifest: DataManifest;
};

// 页面底部的数据说明：状态说明、数据表示什么、数据来源和许可证，以及 Methodology 入口。
// 用小号灰色文字显示，不与地图、列表和租金争夺注意力；内容都来自 manifest。
export function DataReleaseNotice({ manifest }: DataReleaseNoticeProps) {
  return (
    <aside className="space-y-1 border-t pt-4 text-xs leading-5 text-muted-foreground">
      {manifest.rentalDataStatus === "provisional" && (
        <p>{manifest.rentalDataNotice}</p>
      )}

      <p>
        Figures describe new private-sector bonds lodged with MBIE. They are
        not live listings or a record of all rented homes.
      </p>

      <ul>
        {manifest.sources.map((source) => (
          <li key={source.id}>
            Source:{" "}
            <a
              className="underline underline-offset-2 hover:text-foreground"
              href={source.url}
              rel="noreferrer"
              target="_blank"
            >
              {source.name}
            </a>{" "}
            · {source.licence}
          </li>
        ))}
      </ul>

      <p>
        See{" "}
        <Link
          className="underline underline-offset-2 hover:text-foreground"
          to="/methodology"
        >
          Methodology
        </Link>{" "}
        for how the data is processed.
      </p>
    </aside>
  );
}
