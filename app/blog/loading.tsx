export default function BlogLoading() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl px-4 py-20 sm:px-6 sm:py-24 md:py-32">
      <div className="h-10 w-24 animate-pulse rounded bg-[var(--surface)]" />
      <div className="mt-2 h-5 w-64 animate-pulse rounded bg-[var(--surface)]" />

      <div className="mt-12 flex flex-col gap-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6"
          >
            <div className="h-3 w-24 animate-pulse rounded bg-[var(--border)]" />
            <div className="mt-3 h-6 w-3/4 animate-pulse rounded bg-[var(--border)]" />
            <div className="mt-3 h-4 w-full animate-pulse rounded bg-[var(--border)]" />
            <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-[var(--border)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
