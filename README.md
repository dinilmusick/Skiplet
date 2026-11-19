# Skiplet — Meditations Template

A lightweight React + TypeScript + Vite starting point for exhibition-grade interactive explorations. Create projects named `MDT-*` from this template.

## Design first

Each project must establish concept/truth tags, emotion tags, art-style tags, a color scheme, a fixed palette and material/texture choices in `meditations.config.json`. Ask the user for these choices or obtain permission to select them. Every visible color must come from the chosen palette; use meaningful motion and respect reduced-motion preferences.

## Engineering

Modern stable React, strict TypeScript, modern CSS, fetch-first Request/Response interfaces, and serverless-compatible deployment. No mandatory authentication, database, queues or backend. Authored source files must remain within 200 lines.

## Agent instructions

Read `AGENTS.md` before editing. Preserve reusable UI and service boundaries for eventual reviewed adoption into Floks, Kloks and Skipo. The promotion preflight is not a full migration.

## Commands

```bash
npm install
npm run dev
npm run check
node scripts/promotion-plan.mjs
```

The GitHub template must be verified in repository settings before using “Use this template.” CI checks run on GitHub Actions.
