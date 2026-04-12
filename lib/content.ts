import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import type { ProjectMeta, Project, PostMeta, Post } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");
const PROJECTS_DIR = path.join(CONTENT_DIR, "projects");
const BLOG_DIR = path.join(CONTENT_DIR, "blog");

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function readDir(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
}

async function markdownToHtml(md: string): Promise<string> {
  const result = await remark().use(remarkGfm).use(remarkHtml).process(md);
  return result.toString();
}

function parseFrontmatter<T>(filePath: string): { meta: T; content: string } {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { meta: data as T, content };
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export function getAllProjects(): ProjectMeta[] {
  const files = readDir(PROJECTS_DIR);

  return files
    .map((file) => {
      const { meta } = parseFrontmatter<ProjectMeta>(
        path.join(PROJECTS_DIR, file)
      );
      return {
        ...meta,
        slug: meta.slug ?? file.replace(/\.md$/, ""),
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getProjectBySlug(
  slug: string
): Promise<Project | null> {
  const files = readDir(PROJECTS_DIR);
  const file = files.find((f) => {
    const { meta } = parseFrontmatter<ProjectMeta>(
      path.join(PROJECTS_DIR, f)
    );
    return (meta.slug ?? f.replace(/\.md$/, "")) === slug;
  });

  if (!file) return null;

  const { meta, content } = parseFrontmatter<ProjectMeta>(
    path.join(PROJECTS_DIR, file)
  );
  const html = await markdownToHtml(content);

  return {
    ...meta,
    slug: meta.slug ?? file.replace(/\.md$/, ""),
    html,
  };
}

export function getProjectSlugs(): string[] {
  return getAllProjects().map((p) => p.slug);
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

export function getAllPosts(): PostMeta[] {
  const files = readDir(BLOG_DIR);

  return files
    .map((file) => {
      const { meta } = parseFrontmatter<PostMeta>(
        path.join(BLOG_DIR, file)
      );
      return {
        ...meta,
        slug: meta.slug ?? file.replace(/\.md$/, ""),
      };
    })
    .filter((p) => !p.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const files = readDir(BLOG_DIR);
  const file = files.find((f) => {
    const { meta } = parseFrontmatter<PostMeta>(path.join(BLOG_DIR, f));
    return (meta.slug ?? f.replace(/\.md$/, "")) === slug;
  });

  if (!file) return null;

  const { meta, content } = parseFrontmatter<PostMeta>(
    path.join(BLOG_DIR, file)
  );
  const html = await markdownToHtml(content);

  return {
    ...meta,
    slug: meta.slug ?? file.replace(/\.md$/, ""),
    html,
  };
}

export function getPostSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}
