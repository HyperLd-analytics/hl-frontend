"use client";

type TradeActivityData = {
  week: number; // 0-51 (weeks of year)
  day: number; // 0-6 (Mon-Sun)
  count: number;
  pnl?: number;
};

type TradeActivityHeatmapProps = {
  data: TradeActivityData[];
  metric?: "count" | "pnl";
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getColor(count: number, maxCount: number, metric: "count" | "pnl"): string {
  if (count === 0) return "hsl(var(--muted))";
  const intensity = Math.min(count / (maxCount || 1), 1);
  if (metric === "count") {
    return `hsl(239, 84%, ${95 - intensity * 60}%)`; // blue intensity
  }
  return `hsl(142, 71%, ${95 - intensity * 60}%)`; // green intensity
}

export function TradeActivityHeatmap({ data, metric = "count" }: TradeActivityHeatmapProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
        暂无交易数据
      </div>
    );
  }

  // Build grid: weeks on x-axis, days on y-axis
  const maxCount = Math.max(...data.map((d) => metric === "count" ? d.count : Math.abs(d.pnl ?? 0)));

  // Group by (week, day)
  const grid = new Map<string, TradeActivityData>();
  for (const item of data) {
    grid.set(`${item.week}-${item.day}`, item);
  }

  // Determine x-axis range
  const weeks = Array.from(new Set(data.map((d) => d.week))).sort((a, b) => a - b);
  const startWeek = weeks[0] ?? 0;
  const endWeek = weeks[weeks.length - 1] ?? 52;

  const getValue = (item: TradeActivityData | undefined) => {
    if (!item) return 0;
    return metric === "count" ? item.count : (item.pnl ?? 0);
  };

  const CELL_SIZE = 14;
  const CELL_GAP = 2;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[2px]" style={{ marginTop: 20 }}>
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-xs text-muted-foreground"
              style={{ height: CELL_SIZE, lineHeight: `${CELL_SIZE}px` }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="overflow-x-auto">
          <div className="flex gap-[2px]">
            {Array.from({ length: endWeek - startWeek + 1 }, (_, i) => startWeek + i).map((week) => (
              <div key={week} className="flex flex-col gap-[2px]">
                {DAYS.map((_, dayIdx) => {
                  const item = grid.get(`${week}-${dayIdx}`);
                  const value = getValue(item);
                  return (
                    <div
                      key={dayIdx}
                      className="rounded-sm cursor-pointer transition-opacity hover:opacity-80"
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        backgroundColor: getColor(value, maxCount, metric),
                      }}
                      title={item ? `${metric === "count" ? item.count : `$${item.pnl?.toFixed(2)}`} trades` : "No activity"}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
          <div
            key={intensity}
            className="h-3 w-3 rounded-sm"
            style={{
              backgroundColor: metric === "count"
                ? `hsl(239, 84%, ${95 - intensity * 60}%)`
                : `hsl(142, 71%, ${95 - intensity * 60}%)`,
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
