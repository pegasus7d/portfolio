---
title: "Cutting 71% Duplicate YAML: Re-architecting LLM Test Infrastructure"
slug: "ask-cimba-test-infra"
date: "2026-02-15"
tags: ["testing", "java", "ci-cd", "llm"]
summary: "How I replaced a 700-line Python test runner with modular Java and consolidated 55 provider files into 11 shared question sets."
draft: false
---

At Cimba.ai, our LLM regression tests had grown organically. A ~700-line Python runner, 55 separate YAML files per provider, and no isolation between follow-up and general test cases. Adding a new provider meant copying an entire file tree.

## The problem

Five LLM providers (OpenAI, Claude, Azure OpenAI, DeepSeek, Gemini) each had their own set of question files. Most questions were identical across providers — only the provider config differed. The result was 71% duplicated YAML.

## The fix

I re-architected the system from scratch:

1. **Modular Java runner** replacing the monolithic Python script
2. **11 shared question sets** that all providers reference
3. **5 provider-specific config files** for auth and model settings
4. **Isolated follow-up test cases** with dedicated chat semantics, separated from general regression
5. **CI/CD pipeline** with three-channel Slack routing — each provider gets its own report channel

## Result

Adding a sixth provider now means writing one config file and selecting which shared question sets apply. The test suite is faster to maintain and easier to trust.
