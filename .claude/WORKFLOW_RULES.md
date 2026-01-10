# Claude Workflow Rules (Mandatory)

This repository follows a strict incremental development workflow.
These rules are **mandatory** for every task you perform in this repo.

## 1) Output Contract (Always)
After completing any change, you MUST provide:

1. **Summary** of what changed (bullet list)
2. **Files touched** (list)
3. **Suggested commit message** (exact format below)
4. **Docs updates** status:
   - Did you update `CHANGELOG.md`? (Yes/No + why)
   - Did you update `README.md`? (Yes/No + why)

### Suggested commit message format
Suggested commit message:
<type>: <short description>

Examples:
- feat: add page builder section renderer
- fix: correct nginx routing for /uploads
- chore: scaffold repo structure and docs
- docs: update architecture overview

## 2) Git Safety Rules
- **DO NOT** run: `git add`, `git commit`, `git push`, `git reset --hard`
- You may reference diffs or file contents, but never execute destructive git commands.

## 3) Always Keep Changes Small
- Work in **small blocks** (phase + micro-step).
- Only implement what the current phase/block requires.
- Avoid large refactors unless explicitly requested.

## 4) Documentation Rules (README + CHANGELOG are first-class)
### CHANGELOG.md
- If a change affects features, behavior, configuration, endpoints, routing, UI flows, or infra setup,
  you MUST update `CHANGELOG.md` under **[Unreleased]**.
- Keep entries concise and user-facing.

### README.md
Update `README.md` when:
- new service is added to docker-compose
- ports, routes, or environment variables change
- developer setup steps change
- project structure changes

## 5) Phase Discipline
- Respect the current phase scope.
- If you notice additional improvements, list them as **Follow-ups** instead of implementing them.

## 6) Quality Gates (Minimum)
Before finishing, quickly verify:
- files are named consistently
- content is clear and professional
- no secrets are committed (no real credentials in env files)
- placeholders are clearly marked as placeholders

## 7) Communication Style
- Use English in repo docs unless told otherwise.
- Keep responses actionable and structured.
- If assumptions are made, state them explicitly.

## 8) Optional (When helpful)
If you introduce a non-obvious decision, add a short note under `docs/architecture/overview.md`.
