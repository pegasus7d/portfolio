---
title: "IntentFlow"
slug: "intentflow"
summary: "Compiler-style LLM execution control plane in Go"
stack: ["Go", "PostgreSQL", "OpenAPI", "MCP", "LLM APIs"]
date: "2026-02-01"
status: "active"
featured: true
---

## Problem

Most LLM agent frameworks run open-ended loops with no user confirmation before execution. This makes them unreliable for real workflows where deterministic behavior and auditability matter.

## Approach

Designed IntentFlow as a Go CLI and OpenAPI control plane implementing a compiler-style pipeline: **intent → structured plan → explicit user confirm → deterministic local execution**. Each step is inspectable and reversible.

### Key systems

- **Registry LLM backends**: OpenAI, Gemini, Hugging Face Inference — swappable at runtime via a provider registry
- **MCP orchestration**: TUI and API with per-user isolation, automatic token refresh, and workspace-aware injection for planning
- **DAG runtime**: Parallel step execution with `depends_on` references and output piping between steps
- **Auth**: Postgres-backed JWT + RBAC with automatic refresh token rotation

## Stack

Go, PostgreSQL, OpenAPI, MCP protocol, GitHub Actions, golangci-lint, Docker, teatest + Expect E2E

## Outcome

~73 commits, merged PRs, full CI/CD pipeline. A working alternative to open-loop agent frameworks that provides predictable, auditable execution.
