/** Stable placeholders while heavy client sections stream / hydrate — reduces CLS and gives scroll targets. */

export function AboutChunkFallback() {
  return (
    <section
      id="about"
      className="relative scroll-mt-20 overflow-hidden py-16 sm:py-24 md:py-28"
      aria-busy="true"
      aria-label="Loading about section"
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <div className="mb-6 h-9 max-w-[12rem] animate-pulse rounded-lg bg-white/[0.08] sm:h-11 sm:max-w-[16rem]" />
        <div className="mb-3 h-4 max-w-xl animate-pulse rounded bg-white/[0.06]" />
        <div className="mx-auto mt-8 min-h-[min(320px,52svh)] w-full max-w-[1600px] animate-pulse rounded-xl border border-cyan-500/15 bg-[#030508] sm:min-h-[380px]" />
      </div>
    </section>
  );
}

export function GraphChunkFallback() {
  return (
    <section
      id="graph"
      className="relative w-full scroll-mt-20 overflow-hidden py-24 sm:py-28"
      aria-busy="true"
      aria-label="Loading system map"
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
        <div className="mx-auto h-9 max-w-xs animate-pulse rounded-lg bg-white/[0.08] sm:h-10" />
        <div className="mx-auto mt-4 h-4 max-w-2xl animate-pulse rounded bg-white/[0.06]" />
        <div className="mx-auto mt-12 w-full max-w-[1420px] px-4 sm:px-6">
          <div className="min-h-[420px] animate-pulse rounded-2xl border border-white/[0.08] bg-[#05060a]/90 lg:min-h-[520px]" />
        </div>
      </div>
    </section>
  );
}

export function BlogChunkFallback() {
  return (
    <section
      id="blog"
      className="relative mx-auto max-w-5xl scroll-mt-20 overflow-hidden px-4 py-20 sm:px-6 sm:py-24 md:py-32"
      aria-busy="true"
      aria-label="Loading blog section"
    >
      <div className="h-9 max-w-[8rem] animate-pulse rounded-lg bg-white/[0.08]" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-lg border border-white/[0.06] bg-[var(--surface)]/50"
          />
        ))}
      </div>
    </section>
  );
}

export function ContactChunkFallback() {
  return (
    <section
      id="contact"
      className="relative mx-auto max-w-5xl scroll-mt-20 overflow-hidden px-4 py-20 sm:px-6 sm:py-24 md:py-32"
      aria-busy="true"
      aria-label="Loading contact section"
    >
      <div className="mx-auto h-10 max-w-[14rem] animate-pulse rounded-lg bg-white/[0.08]" />
      <div className="mx-auto mt-4 h-4 max-w-md animate-pulse rounded bg-white/[0.06]" />
      <div className="mx-auto mt-10 h-32 max-w-md animate-pulse rounded-xl bg-white/[0.04]" />
    </section>
  );
}
