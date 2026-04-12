"use client";

import Link from "next/link";
import { SectionWrapper } from "@/components/layout";
import { Textify } from "@/components/textify";
import type { PostMeta } from "@/lib/types";

interface BlogPreviewProps {
  posts: PostMeta[];
}

export default function BlogPreview({ posts }: BlogPreviewProps) {
  return (
    <SectionWrapper id="blog" staggerChildren>
      <div className="flex items-baseline justify-between">
        <Textify
          variant="reveal"
          content="Blog"
          tag="h2"
          className="text-3xl font-bold tracking-tight sm:text-4xl"
          trigger="scroll"
          duration={0.8}
        />
        <Link
          href="/blog"
          className="text-sm text-[var(--accent)] hover:opacity-80 transition-opacity"
        >
          View all &rarr;
        </Link>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`}>
            <article className="group h-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--accent)]">
              <time className="text-xs text-[var(--text-muted)]">
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
              <h3 className="mt-2 font-semibold tracking-tight group-hover:text-[var(--accent)] transition-colors">
                {post.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed line-clamp-3">
                {post.summary}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[var(--bg)] px-2.5 py-0.5 text-[11px] text-[var(--text-muted)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          </Link>
        ))}
      </div>
    </SectionWrapper>
  );
}
