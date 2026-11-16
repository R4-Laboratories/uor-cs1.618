# Autonomous Evolution Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task.

**Goal:** Continuously evaluate bounded game-code improvements and redeploy accepted generations through GitHub.
**Architecture:** Versioned policy → candidate source generator → independent browser/graph measurements → Prism admission → full game gates → hash-bound commit → explicit Pages dispatch and deployment watcher.
**Tech Stack:** TypeScript, Three.js, Playwright, LexLean/PrismPM Wasm, GitHub Actions.
**Spec:** docs/superpowers/specs/2026-11-16-autonomous-evolution-design.md

## Global Constraints
- Preserve game rules and protocol; exact bot graph/routes and bounded rendering fidelity.
- No force push, arbitrary generated code, credential in browser, fabricated benefit or gate bypass.
- Hourly bounded attempts; finite frontier can settle without source churn.
- Separate build evidence from proofs; retain the existing open PrismPM full-verification gate.

## Review Focus
- Invalid metrics, empty samples or mismatched candidate hashes must reject promotion.
- Failed tests and racing main updates must leave deployed source untouched.
- Visual optimizations must not accidentally batch dynamic players/weapons or corrupt rollback.
- Scheduled token pushes require explicit deployment, and failed gates must never be retried as deploy-only failures.
- Generated code must be reproducible from admitted state and never modify its own admission policy.

### Tasks
- [x] Pin references and model policy; compile and test finite admission Wasm.
- [x] Implement bounded renderer and navigation source generators, runtime integration and rollback; add semantic tests and falsifiers.
- [x] Build deterministic multi-view graphics and exact navigation evaluators; measure a real baseline and candidate.
- [x] Add tick/search/ledger and hash-bound publication; test rejected candidates, stale evidence and concurrency.
- [x] Add scheduled engine, build stamp and deployment watcher; tests for missing runs, pending, gate failure and bounded deploy retry.
- [ ] Run full gates and fresh code review; fix findings; deploy; dispatch and observe an actual GitHub engine tick and its Pages outcome.
