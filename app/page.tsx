import {
  Hero,
  About,
  Projects,
  BlogPreview,
  Skills,
  Contact,
} from "@/components/sections";
import { getAllProjects, getAllPosts } from "@/lib/content";
import { getPersonSchema } from "@/lib/jsonld";

export default function Home() {
  const projects = getAllProjects();
  const posts = getAllPosts().slice(0, 3);
  const jsonLd = getPersonSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <About />
      <Projects projects={projects} />
      <Skills />
      <BlogPreview posts={posts} />
      <Contact />
    </>
  );
}
