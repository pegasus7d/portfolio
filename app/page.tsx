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
import {
  buildOverviewGraph,
  buildEvolutionGraph,
  buildGraphData,
} from "@/lib/graph";
import { getPersonSchema } from "@/lib/jsonld";

export default function Home() {
  const projects = getAllProjects();
  const posts = getAllPosts().slice(0, 3);
  const jsonLd = getPersonSchema();
  const overviewData = buildOverviewGraph();
  const exploreData = buildEvolutionGraph();
  const graphData = buildGraphData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <About overviewData={overviewData} exploreData={exploreData} />
      <Projects projects={projects} />
      <Skills />
      <GraphSection data={graphData} />
      <BlogPreview posts={posts} />
      <Contact />
    </>
  );
}
