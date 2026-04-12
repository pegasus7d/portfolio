import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPostBySlug, getPostSlugs } from "@/lib/content";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.summary,
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto w-full min-w-0 max-w-3xl px-4 py-20 sm:px-6 sm:py-24 md:py-32">
      <Link
        href="/blog"
        className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        ← Back to blog
      </Link>

      <header className="mt-6">
        <time className="text-xs text-[var(--text-muted)]">
          {new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs text-[var(--text-muted)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      <div
        className="prose-custom mt-10"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </article>
  );
}
