"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";
import { SectionWrapper } from "@/components/layout";
import { SectionContinue } from "@/components/journey";
import { Textify } from "@/components/textify";
import type { PostMeta } from "@/lib/types";

interface BlogPreviewProps {
  posts: PostMeta[];
}

function BlogCard({ post }: { post: PostMeta }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty("--mouse-y", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  }, []);

  return (
    <Link href={`/blog/${post.slug}`}>
      <div
        ref={ref}
        onMouseMove={onMove}
        className="card-glow group h-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6"
      >
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
      </div>
    </Link>
  );
}

export default function BlogPreview({ posts }: BlogPreviewProps) {
  return (
    <SectionWrapper id="blog" staggerChildren>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <Textify
          variant="reveal"
          content="Blog"
          tag="h2"
          className="min-w-0 text-3xl font-bold tracking-tight sm:text-4xl"
          trigger="scroll"
          duration={0.8}
        />
        <Link
          href="/blog"
          className="shrink-0 text-sm text-[var(--accent)] transition-opacity hover:opacity-80"
        >
          View all &rarr;
        </Link>
      </div>

      <div className="mt-10 grid min-w-0 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>

      <SectionContinue cta="Get in touch ↓" toId="contact" />
    </SectionWrapper>
  );
}
