import { Button } from "@/components/ui/button";

type DataLoadErrorProps = {
  error: Error;
  onRetry: () => void;
};

// 读取失败时显示带文件地址的错误，并允许重新请求。
export function DataLoadError({ error, onRetry }: DataLoadErrorProps) {
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <p className="whitespace-pre-wrap text-sm">{error.message}</p>
      <Button onClick={onRetry} type="button" variant="outline">
        Retry
      </Button>
    </div>
  );
}
