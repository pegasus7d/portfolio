/**
 * System-architecture graph: technologies and relationships.
 * Every node uses a checked-in SVG under public/icons (same basename as `id`).
 * The canvas does not load remote logo URLs.
 * Node set is grounded in resume / roles (graph.ts) and shipped-work notes
 * (Usage Insights, Ask Cimba tests, vector DB migration, Ittiam pipelines, etc.).
 */

export interface SystemNode {
  id: string;
  label: string;
  brandColor: string;
  usage: string;
  impact: string;
  motionScale?: number;
  /** Checked-in file under public/icons/{id}.svg */
  logoUrl: string;
}

export interface SystemEdge {
  source: string;
  target: string;
  label?: string;
}

export interface SystemGraphData {
  nodes: SystemNode[];
  edges: SystemEdge[];
}

/** Normalized [0–1] positions — spread for ~27 nodes */
const LAYOUT: Record<string, [number, number]> = {
  claude: [0.03, 0.28],
  cursor: [0.03, 0.46],
  kubernetes: [0.11, 0.18],
  keda: [0.11, 0.32],
  docker: [0.11, 0.48],
  ffmpeg: [0.11, 0.64],
  apachekafka: [0.22, 0.12],
  redis: [0.22, 0.32],
  postgresql: [0.22, 0.52],
  duckdb: [0.22, 0.72],
  go: [0.34, 0.2],
  java: [0.34, 0.56],
  spring: [0.34, 0.74],
  typescript: [0.46, 0.14],
  react: [0.46, 0.34],
  nextdotjs: [0.46, 0.54],
  nodejs: [0.46, 0.72],
  playwright: [0.58, 0.2],
  apacheecharts: [0.58, 0.38],
  slack: [0.58, 0.55],
  azuredevops: [0.58, 0.72],
  microsoftazure: [0.7, 0.18],
  chatgpt: [0.82, 0.1],
  googlegemini: [0.92, 0.1],
  deepseek: [0.88, 0.24],
  prometheus: [0.82, 0.58],
  snyk: [0.92, 0.72],
};

const MOVE = 2.35;

export function buildSystemGraph(): SystemGraphData {
  const nodes: SystemNode[] = [
    {
      id: "claude",
      label: "Claude",
      brandColor: "D4A574",
      logoUrl: "/icons/claude.svg",
      usage:
        "Architecture notes, refactors, and test design via Anthropic’s models in Cursor and internal tooling workflows.",
      impact: "Faster iteration on complex code paths with a second opinion that respects system constraints.",
      motionScale: MOVE,
    },
    {
      id: "cursor",
      label: "Cursor",
      brandColor: "F5F5F5",
      logoUrl: "/icons/cursor.svg",
      usage:
        "Primary IDE: multi-file edits, AI-assisted navigation, and tight loops between implementation and review.",
      impact: "Ship smaller, safer diffs by keeping context and repo structure in view.",
      motionScale: MOVE,
    },
    {
      id: "kubernetes",
      label: "Kubernetes",
      brandColor: "326CE5",
      logoUrl: "/icons/kubernetes.svg",
      usage:
        "Production workloads at Ittiam: dev clusters, KEDA-scaled media pipelines, and service rollout patterns.",
      impact: "Repeatable deployments and autoscaling without sacrificing observability.",
    },
    {
      id: "keda",
      label: "KEDA",
      brandColor: "326CE5",
      logoUrl: "/icons/keda.svg",
      usage:
        "Event-driven autoscaling for distributed encode and media pipelines (Ittiam) so workers track real queue depth.",
      impact: "Less idle compute while keeping throughput aligned with load.",
    },
    {
      id: "docker",
      label: "Docker",
      brandColor: "2496ED",
      logoUrl: "/icons/docker.svg",
      usage:
        "Container images for services, local parity with prod, and CI build artifacts across internships and full-time roles.",
      impact: "Faster onboarding and fewer environment-specific bugs.",
    },
    {
      id: "ffmpeg",
      label: "FFmpeg",
      brandColor: "007808",
      logoUrl: "/icons/ffmpeg.svg",
      usage:
        "Video encode pipelines and A/V sync work in distributed media processing (Ittiam internship).",
      impact: "Reliable media paths under autoscaling and varied input formats.",
    },
    {
      id: "apachekafka",
      label: "Kafka",
      brandColor: "231F20",
      logoUrl: "/icons/apachekafka.svg",
      usage:
        "Event-driven boundaries: async ingestion, decoupled consumers, and backpressure-aware pipelines in analytics-style systems.",
      impact: "Scalable throughput with clear ownership between producers and consumers.",
    },
    {
      id: "redis",
      label: "Redis",
      brandColor: "DC382D",
      logoUrl: "/icons/redis.svg",
      usage:
        "Caching layers, rate limits, and session-style state at Cimba and earlier stacks; paired with Postgres for durability.",
      impact: "Lower latency hot paths and predictable load on primary stores.",
    },
    {
      id: "postgresql",
      label: "PostgreSQL",
      brandColor: "4169E1",
      logoUrl: "/icons/postgresql.svg",
      usage:
        "Primary relational store for analytics entities, billing-adjacent data, and structured agent metrics.",
      impact: "Strong consistency where it matters; SQL for ad-hoc analysis and migrations.",
    },
    {
      id: "duckdb",
      label: "DuckDB",
      brandColor: "FFF000",
      logoUrl: "/icons/duckdb.svg",
      usage:
        "Analytical stages and Google Sheets–adjacent data fixes in agentic / reporting flows (internal pipelines).",
      impact: "Fast local analytics without standing up another heavy warehouse for every experiment.",
    },
    {
      id: "go",
      label: "Go",
      brandColor: "00ADD8",
      logoUrl: "/icons/go.svg",
      usage:
        "Backend services, concurrency-heavy workers, and tooling where static binaries and performance win.",
      impact: "Simple deployment story and efficient use of machine resources.",
    },
    {
      id: "java",
      label: "Java",
      brandColor: "437291",
      logoUrl: "/icons/java.svg",
      usage:
        "Primary backend at Cimba: analytics APIs, agentic workflows, MCP OAuth, async KB indexing, and Ask Cimba test infrastructure in the JVM.",
      impact: "Stable ecosystem for long-lived production systems and multi-service test runners.",
    },
    {
      id: "spring",
      label: "Spring",
      brandColor: "6DB33F",
      logoUrl: "/icons/spring.svg",
      usage:
        "Spring-style services and enterprise patterns on the JVM stack alongside observability and data integrations.",
      impact: "Familiar patterns for teams shipping large, evolving backends.",
    },
    {
      id: "typescript",
      label: "TypeScript",
      brandColor: "3178C6",
      logoUrl: "/icons/typescript.svg",
      usage:
        "Typed React/Next surfaces, shared API types, and safer refactors across full-stack features.",
      impact: "Fewer runtime surprises when UI and backend evolve together.",
    },
    {
      id: "react",
      label: "React",
      brandColor: "61DAFB",
      logoUrl: "/icons/react.svg",
      usage:
        "Dashboards, internal tools, and product UI wired to backend APIs and real-time-ish updates.",
      impact: "Composable UI that teams can extend without rewriting foundations.",
      motionScale: MOVE,
    },
    {
      id: "nextdotjs",
      label: "Next.js",
      brandColor: "000000",
      logoUrl: "/icons/nextdotjs.svg",
      usage:
        "SSR-heavy product surfaces (e.g. OneLot internship) and patterns that carry into modern React delivery.",
      impact: "SEO-friendly pages and clear server/client boundaries where they matter.",
    },
    {
      id: "nodejs",
      label: "Node.js",
      brandColor: "5FA04E",
      logoUrl: "/icons/nodejs.svg",
      usage:
        "Next.js servers, build tooling, and JavaScript-side integration tests alongside Go and JVM services.",
      impact: "One mental model from SSR routes to API handlers and shared types.",
      motionScale: MOVE,
    },
    {
      id: "playwright",
      label: "Playwright",
      brandColor: "2D4552",
      logoUrl: "/icons/playwright.svg",
      usage:
        "End-to-end UI coverage with Playwright for agent builder, tables, Usage Insights, and regression gates in CI.",
      impact: "Catch UI regressions before they reach production releases.",
    },
    {
      id: "apacheecharts",
      label: "ECharts",
      brandColor: "AA3440",
      logoUrl: "/icons/apacheecharts.svg",
      usage:
        "Usage Insights dashboards: token, latency, failure, and distribution charts wired to unified analytics APIs.",
      impact: "Operators see KPIs and trends without leaving the product.",
    },
    {
      id: "slack",
      label: "Slack",
      brandColor: "4A154B",
      logoUrl: "/icons/slack.svg",
      usage:
        "Team workflows (OneLot), multi-channel LLM test reports, and failure notifications routed for fast debugging.",
      impact: "Human-in-the-loop signals land where engineers already work.",
    },
    {
      id: "azuredevops",
      label: "Azure DevOps",
      brandColor: "0078D7",
      logoUrl: "/icons/azuredevops.svg",
      usage:
        "Azure DevOps pipelines for Ask Cimba and provider-based LLM test runs with centralized config and Slack routing.",
      impact: "Repeatable CI for five+ model providers without copy-paste YAML per provider.",
    },
    {
      id: "microsoftazure",
      label: "Azure",
      brandColor: "0078D4",
      logoUrl: "/icons/microsoftazure.svg",
      usage:
        "Azure AI Search for vector workloads, migration off legacy vector DBs, and cloud-side agent/KB infrastructure.",
      impact: "Managed search and vector paths that scale with production agent traffic.",
    },
    {
      id: "chatgpt",
      label: "ChatGPT",
      brandColor: "10A37F",
      logoUrl: "/icons/chatgpt.svg",
      usage:
        "Exploration, drafting, and quick API/schema experiments before hardening flows in production agent code.",
      impact: "Short feedback loops on unfamiliar domains without skipping engineering rigor later.",
      motionScale: MOVE,
    },
    {
      id: "googlegemini",
      label: "Gemini",
      brandColor: "8E75B2",
      logoUrl: "/icons/googlegemini.svg",
      usage:
        "Provider-based LLM test matrix alongside OpenAI, Claude, Azure OpenAI, and DeepSeek in CI.",
      impact: "Confidence that agent behavior holds across vendors before ship.",
    },
    {
      id: "deepseek",
      label: "DeepSeek",
      brandColor: "4D6BFE",
      logoUrl: "/icons/deepseek.svg",
      usage:
        "DeepSeek in the same provider matrix as OpenAI, Claude, and Gemini — config-driven cases shared across models.",
      impact: "Adding a provider is mostly config, not duplicating every scenario file.",
    },
    {
      id: "prometheus",
      label: "Prometheus",
      brandColor: "E6522C",
      logoUrl: "/icons/prometheus.svg",
      usage:
        "Metrics collection, SLO-oriented dashboards, and alerting hooks for services under load.",
      impact: "Visibility into latency, errors, and saturation before users notice.",
    },
    {
      id: "snyk",
      label: "Snyk",
      brandColor: "4C4A73",
      logoUrl: "/icons/snyk.svg",
      usage:
        "Dependency and security scanning gates in Java and TypeScript repos (recurring in sprint notes).",
      impact: "Fewer vulnerable packages slipping through to production branches.",
    },
  ];

  const edges: SystemEdge[] = [
    { source: "cursor", target: "typescript", label: "IDE" },
    { source: "cursor", target: "claude", label: "assist" },
    { source: "claude", target: "typescript", label: "refine" },
    { source: "claude", target: "java", label: "design" },
    { source: "chatgpt", target: "java", label: "models" },
    { source: "chatgpt", target: "typescript", label: "explore" },
    { source: "googlegemini", target: "java", label: "eval" },
    { source: "deepseek", target: "java", label: "eval" },
    { source: "nodejs", target: "typescript", label: "runtime" },
    { source: "nodejs", target: "react", label: "SSR" },
    { source: "nextdotjs", target: "nodejs", label: "app" },
    { source: "nextdotjs", target: "react", label: "UI" },
    { source: "nextdotjs", target: "typescript", label: "types" },
    { source: "typescript", target: "react", label: "UI" },
    { source: "react", target: "java", label: "APIs" },
    { source: "playwright", target: "react", label: "E2E" },
    { source: "playwright", target: "nextdotjs", label: "E2E" },
    { source: "apacheecharts", target: "react", label: "charts" },
    { source: "apacheecharts", target: "typescript", label: "data" },
    { source: "slack", target: "java", label: "notify" },
    { source: "slack", target: "react", label: "ops UI" },
    { source: "slack", target: "azuredevops", label: "CI" },
    { source: "azuredevops", target: "kubernetes", label: "deploy" },
    { source: "azuredevops", target: "java", label: "build" },
    { source: "snyk", target: "java", label: "scan" },
    { source: "snyk", target: "typescript", label: "scan" },
    { source: "spring", target: "java", label: "framework" },
    { source: "keda", target: "kubernetes", label: "scale" },
    { source: "ffmpeg", target: "docker", label: "media" },
    { source: "duckdb", target: "postgresql", label: "analytics" },
    { source: "microsoftazure", target: "postgresql", label: "data" },
    { source: "kubernetes", target: "docker", label: "workloads" },
    { source: "kubernetes", target: "go", label: "deploy" },
    { source: "docker", target: "go", label: "images" },
    { source: "go", target: "redis", label: "cache" },
    { source: "go", target: "postgresql", label: "store" },
    { source: "java", target: "postgresql", label: "data" },
    { source: "java", target: "redis", label: "cache" },
    { source: "apachekafka", target: "postgresql", label: "consume" },
    { source: "apachekafka", target: "redis", label: "buffers" },
    {
      source: "microsoftazure",
      target: "java",
      label: "cloud · Azure OAI",
    },
    { source: "prometheus", target: "kubernetes", label: "observe" },
  ];

  return { nodes, edges };
}

export function layoutPosition(
  id: string,
  w: number,
  h: number,
): { x: number; y: number } {
  const f = LAYOUT[id];
  if (!f) return { x: w * 0.5, y: h * 0.5 };
  return { x: f[0] * w, y: f[1] * h };
}
