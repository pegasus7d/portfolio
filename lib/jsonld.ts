export function getPersonSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Debayan Biswas",
    url: "https://debayan.dev",
    jobTitle: "Software Engineer",
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "Indian Institute of Technology Kharagpur",
    },
    knowsAbout: [
      "Backend Systems",
      "Distributed Systems",
      "Java",
      "Go",
      "LLM Integration",
      "MCP Protocol",
      "Kubernetes",
      "PostgreSQL",
      "Redis",
    ],
    sameAs: [
      "https://www.linkedin.com/in/debayan-biswas",
      "https://github.com/debayan",
    ],
  };
}
