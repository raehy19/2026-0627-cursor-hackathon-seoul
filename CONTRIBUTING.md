# Contributing

## Working model
- This repository is documentation-first.
- Do not start with implementation when the relevant docs are still missing or unclear.
- Pair meaningful behavior changes with documentation updates in the same unit of work.

## Before making changes
1. Read [AGENTS.md](AGENTS.md) (canonical entry).
2. Read [docs/agent/SESSION_START.md](docs/agent/SESSION_START.md).
3. Read [docs/agent/WORKFLOW.md](docs/agent/WORKFLOW.md).
4. Read [docs/agent/INDEX.md](docs/agent/INDEX.md).
5. Read [docs/README.md](docs/README.md).
6. Read [docs/operations/current-state.md](docs/operations/current-state.md).
7. Read [docs/operations/todo-plan.md](docs/operations/todo-plan.md).
8. Read [docs/operations/approval-queue.md](docs/operations/approval-queue.md).

## Change rules
- Prefer safe, local, reversible changes.
- Queue risky or multi-option changes before execution.
- Keep agent-facing docs in English.
- Keep product-facing planning docs in Korean unless the project decides otherwise.
- Do not edit versioned docs in place if the repo has adopted versioned contract documents.
- Run only the checks relevant to the files you touched, and report blockers explicitly.

## Conventional Commits

This repository uses [Conventional Commits](https://www.conventionalcommits.org/).
The `commit-msg` hook in [`lefthook.yml`](lefthook.yml) enforces the format.

```text
<type>(<optional-scope>)!: <subject>

<optional-body>

<optional-footer>
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
`build`, `ci`, `chore`, `revert`. Use `!` after the type/scope for breaking
changes (or include `BREAKING CHANGE:` in the footer).

Examples:
- `feat(specs): add EARS template`
- `fix(agent): correct broken link in INDEX`
- `docs(workflow): clarify session-start order`
- `chore(deps): bump lefthook to 1.7`

The `release-please` workflow generates `CHANGELOG.md` entries from these commits.
Do not hand-edit auto-generated release sections.

## Local setup

The repo ships with language-agnostic verification hooks. You only need them once
local code starts landing.

```sh
# macOS / Linux (Homebrew)
brew install lefthook gitleaks lychee
npm install -g markdownlint-cli

# Install repo hooks
lefthook install
```

Manual checks (run any time):

```sh
markdownlint --config .markdownlint.json '**/*.md'
lychee --config lychee.toml './**/*.md'
gitleaks detect --config .gitleaks.toml --redact
```

CI mirrors these checks via `.github/workflows/docs-check.yml`.

## Session close-out
- Update the relevant docs.
- Refresh `docs/operations/current-state.md`.
- Refresh `docs/agent/SESSION_START.md` if the active situation moved.
- Add any unresolved decision to the approval queue.
- Add a formal status report in `docs/status/` only when the work is a milestone, handoff, or explicit reporting task.
- Record notable repo-level changes in `CHANGELOG.md` (or rely on `release-please` once it is connected).
