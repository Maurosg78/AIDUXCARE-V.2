# ADR-002 — Source of Truth Guardian Hook
**Date:** 2025-10-06  
**Status:** Accepted  

## Context
Enforce Market: CA and Language: en-CA in every commit and PR.

## Decision
Husky + CI validation script block merges violating locale rules.

## Consequences
Prevents regression to ES default; all other markets behind feature flags.
