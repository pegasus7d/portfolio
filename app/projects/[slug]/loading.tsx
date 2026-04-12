export default function ProjectLoading() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl px-4 py-20 sm:px-6 sm:py-24 md:py-32">
      <div className="h-4 w-28 animate-pulse rounded bg-[var(--surface)]" />
      <div className="mt-6">
        <div className="h-10 w-2/3 animate-pulse rounded bg-[var(--surface)]" />
        <div className="mt-3 h-5 w-full animate-pulse rounded bg-[var(--surface)]" />
        <div className="mt-4 flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-6 w-16 animate-pulse rounded-full bg-[var(--surface)]"
            />
          ))}
        </div>
      </div>
      <div className="mt-10 space-y-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-[var(--surface)]"
            style={{ width: `${50 + Math.random() * 50}%` }}
          />
        ))}
      </div>
    </div>
  );
}
