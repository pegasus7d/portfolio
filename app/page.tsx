import {
  Hero,
  About,
  Projects,
  BlogPreview,
  Skills,
  Contact,
} from "@/components/sections";
import { GraphSection } from "@/components/graph";
import { getAllProjects, getAllPosts } from "@/lib/content";
import { buildGraphData } from "@/lib/graph";
import { getPersonSchema } from "@/lib/jsonld";

export default function Home() {
  const projects = getAllProjects();
  const posts = getAllPosts().slice(0, 3);
  const jsonLd = getPersonSchema();
  const graphData = buildGraphData();

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
      <GraphSection data={graphData} />
      <BlogPreview posts={posts} />
      <Contact />
    </>
  );
}
