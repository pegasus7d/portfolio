export interface ProjectMeta {
  title: string;
  slug: string;
  summary: string;
  stack: string[];
  date: string;
  status: "active" | "archived";
  cover?: string;
  featured?: boolean;
}

export interface Project extends ProjectMeta {
  html: string;
}

export interface PostMeta {
  title: string;
  slug: string;
  date: string;
  tags: string[];
  summary: string;
  draft?: boolean;
}

export interface Post extends PostMeta {
  html: string;
}
