---
title: "Distributed Encode Pipeline"
slug: "distributed-encode"
summary: "KEDA-driven autoscaling video encode on Kubernetes"
stack: ["Kubernetes", "Docker", "Redis", "BullMQ", "NFS", "KEDA", "FFmpeg"]
date: "2024-07-01"
status: "archived"
featured: false
---

## Problem

Video encoding at Ittiam Systems ran on static fleet sizes. Scaling was manual and wasteful — idle workers during low traffic, bottlenecks during spikes.

## Approach

Built an event-driven encode pipeline on Minikube:

- **NFS-backed shared storage** for media chunks across pods
- **KEDA** autoscaling based on Redis queue depth (not CPU)
- **Redis + BullMQ** workers consuming encode jobs from the queue
- **Docker images** and a full K8s dev stack (Ingress, metrics server, registry) for repeatable integration tests

Also fixed A/V sync issues in a production video pipeline using FFmpeg split-and-stitch over chunked media.

## Stack

Kubernetes (Minikube), Docker, Redis, BullMQ, NFS, KEDA, FFmpeg

## Outcome

Replaced static fleet sizing with demand-driven autoscaling. Gave the team a repeatable Kubernetes environment for testing encode pipelines.
