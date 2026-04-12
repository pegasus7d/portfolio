import dynamic from "next/dynamic";
import { Hero, Projects, Skills } from "@/components/sections";
import { HomeScrollBridge } from "@/components/journey";
import {
  AboutChunkFallback,
  BlogChunkFallback,
  ContactChunkFallback,
  GraphChunkFallback,
} from "@/components/ui/ChunkFallbacks";
import { getAllProjects, getAllPosts } from "@/lib/content";
import { buildOverviewGraph, buildEvolutionGraph } from "@/lib/graph";
import { getPersonSchema } from "@/lib/jsonld";

const About = dynamic(() => import("@/components/sections/About"), {
  loading: () => <AboutChunkFallback />,
});

const GraphSection = dynamic(() => import("@/components/graph/GraphSection"), {
  loading: () => <GraphChunkFallback />,
});

const BlogPreview = dynamic(() => import("@/components/sections/BlogPreview"), {
  loading: () => <BlogChunkFallback />,
});

const Contact = dynamic(() => import("@/components/sections/Contact"), {
  loading: () => <ContactChunkFallback />,
});

export default function Home() {
  const projects = getAllProjects();
  const posts = getAllPosts().slice(0, 3);
  const jsonLd = getPersonSchema();
  const overviewData = buildOverviewGraph();
  const exploreData = buildEvolutionGraph();
  return (
    <>
      <HomeScrollBridge />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <About overviewData={overviewData} exploreData={exploreData} />
      <Projects projects={projects} />
      <Skills />
      <GraphSection projects={projects} />
      <BlogPreview posts={posts} />
      <Contact />
    </>
  );
}
