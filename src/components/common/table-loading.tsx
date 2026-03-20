import { Skeleton } from "@/components/ui/skeleton";

type TableLoadingProps = {
  rows?: number;
  columns?: number;
};

export function TableLoading({ rows = 6, columns = 4 }: TableLoadingProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((__, colIndex) => (
            <Skeleton key={`${rowIndex}-${colIndex}`} className="h-8 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}
