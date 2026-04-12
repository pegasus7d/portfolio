import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Blog",
  description: "Writing about backend systems, LLMs, infrastructure, and engineering.",
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
      <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
      <p className="mt-2 text-[var(--text-muted)]">
        Writing about backend systems, LLMs, infrastructure, and engineering.
      </p>

      <div className="mt-12 flex flex-col gap-8">
        {posts.length === 0 && (
          <p className="text-[var(--text-muted)]">No posts yet.</p>
        )}
        {posts.map((post) => (
          <article
            key={post.slug}
            className="group rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--accent)]"
          >
            <Link href={`/blog/${post.slug}`} className="block">
              <time className="text-xs text-[var(--text-muted)]">
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <h2 className="mt-1 text-xl font-semibold tracking-tight group-hover:text-[var(--accent)] transition-colors">
                {post.title}
              </h2>
              <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
                {post.summary}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[var(--bg)] px-2.5 py-0.5 text-xs text-[var(--text-muted)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
