export default function PostLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
      <div className="h-4 w-20 animate-pulse rounded bg-[var(--surface)]" />
      <div className="mt-6">
        <div className="h-3 w-32 animate-pulse rounded bg-[var(--surface)]" />
        <div className="mt-3 h-10 w-3/4 animate-pulse rounded bg-[var(--surface)]" />
        <div className="mt-3 flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-5 w-14 animate-pulse rounded-full bg-[var(--surface)]"
            />
          ))}
        </div>
      </div>
      <div className="mt-10 space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-[var(--surface)]"
            style={{ width: `${60 + Math.random() * 40}%` }}
          />
        ))}
      </div>
    </div>
  );
}
