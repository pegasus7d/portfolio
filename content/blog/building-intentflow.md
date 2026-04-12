---
title: "Building IntentFlow: Why I Chose a Compiler Model Over Agent Loops"
slug: "building-intentflow"
date: "2026-03-01"
tags: ["go", "llm", "system-design", "mcp"]
summary: "How I designed a deterministic LLM execution system in Go using a compiler-style pipeline instead of open-ended agent loops."
draft: false
---

Most LLM agent frameworks let the model loop freely — calling tools, reflecting on output, calling more tools. This is powerful but unpredictable. You cannot audit what happened or guarantee the same plan runs twice.

IntentFlow takes a different path: **intent → structured plan → explicit user confirm → deterministic execution**.

## The core idea

Think of it like a compiler. The LLM is the frontend — it parses user intent into a structured plan (a DAG of steps). The runtime is the backend — it executes the plan deterministically, step by step, with no LLM in the loop during execution.

## Why Go

Go gave me strong concurrency primitives for the DAG executor (parallel steps with `depends_on`), a clean binary for the CLI, and straightforward OpenAPI code generation for the control plane.

## MCP integration

IntentFlow supports MCP tool discovery and execution. Each user gets isolated token storage and automatic refresh. The planner is workspace-aware — it knows what tools are available before generating a plan.

## What I learned

Determinism and auditability matter more than autonomy in real workflows. Users want to understand and approve what will happen before it happens.
