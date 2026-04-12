import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
        404
      </p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">
        Page not found
      </h1>
      <p className="mt-4 text-[var(--text-muted)]">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90"
      >
        Back to home
      </Link>
    </div>
  );
}
