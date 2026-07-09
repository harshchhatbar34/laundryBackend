export function LoadingTable({ cols = 5, rows = 6 }: { cols?: number; rows?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-surface-border dark:border-dark-border">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-4 bg-slate-200 dark:bg-dark-300 rounded-md"
              style={{ flex: j === 0 ? '0 0 32px' : j === cols - 1 ? '0 0 80px' : 1 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
