---
title: "Usage Insights"
slug: "usage-insights"
summary: "Production analytics platform for AI agent metrics at Cimba.ai"
stack: ["Java", "PostgreSQL", "React", "ECharts", "Redis"]
date: "2025-08-01"
status: "active"
featured: true
---

## Problem

Cimba.ai had no unified way to track KPIs across its AI agent platform — latency, token usage, task failures, active users, and task volume were scattered across services with no consolidated view.

## Approach

Led the Usage Insights product track end to end:

- **Unified POST dispatcher** replacing per-endpoint analytics calls
- **KPI and trend APIs** for latency, tokens, failures, users, and tasks
- **Server-side pagination** and **presigned CSV export** for large datasets
- **React + ECharts** dashboards in production
- Consolidated analytics response models into a single module

## Stack

Java (backend APIs), PostgreSQL, React, ECharts, Redis (caching)

## Outcome

Shipped as the largest product track at Cimba.ai. Gave the team real-time visibility into agent performance across all providers.
