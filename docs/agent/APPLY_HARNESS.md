# Applying This Harness To An Existing Project

**Audience.** An AI assistant (Codex, Claude Code, Cursor, Aider, etc.) that has
been pointed at this starter folder from *a different working directory* and
asked to apply the harness to that other repository.

**Operating mode.** Four-phase, opt-in playbook: audit → plan → apply → verify.
Never overwrite working systems silently. If a layer already exists in the
target repo with a working configuration, merge or skip rather than replace.

**Goal.** Reproduce in the target repo not just the *files* but the *operating
discipline* of this starter: documentation-first execution, single source of
truth, approval-queue handling of unclear decisions, and a stable taxonomy of
docs (governance, operating, specs, ADRs, learnings, templates, status).

---

## Core principles to transfer

These are the rules that make the harness work. Every layer below exists to
support one of them. If a target repo cannot honor a principle, document why in
`docs/learnings/` rather than silently dropping it.

1. **Documentation-first.** Behavior, structure, and intent live in docs before
   code. A code change is incomplete if related docs were not updated.
2. **Single source of truth.** Each operating fact has exactly one home. Other
   files become thin pointers. Entry files (`AGENTS.md` is canonical;
   `CLAUDE.md`, `.cursor/rules/*`, `GEMINI.md`, etc. are pointers) follow this.
3. **Approval-queue discipline.** Unclear or multi-option decisions never get
   silently committed. They go to `docs/operations/approval-queue.md` and get
   resolved by promotion to ADR or to a learning entry.
4. **Layered decisions.** Heavy/durable → ADR. Lightweight repo-wide rule →
   learning. Open question → approval queue. Per-feature behavior contract →
   spec. Living recovery state → `current-state.md`. Milestone artifact →
   `docs/status/`.
5. **Lean context.** Read the smallest set of docs needed. The
   `SESSION_START.md` snapshot exists so the assistant does not need to read
   ten files at session start.
6. **No false claims.** A check is "passed" only if it actually ran. CI and
   hooks enforce this for docs (markdownlint, lychee, gitleaks, placeholder
   guard).

---

## Phase 0: Read-only audit of the target repo

Do not write anything yet. Build a picture of what already exists.

| Concern | What to look for |
|---------|------------------|
| Entry files | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursor/rules/`, `.windsurfrules`, `.aider.conf.yml`, `.clinerules`, `.continuerules`, `.rules` |
| Existing rule content | Any `## Start Here`, workflow doc, operating loop, or coding-rules doc |
| Doc governance | `docs/DOCUMENTATION.md`, README sections describing where docs live, ownership rules |
| Doc taxonomy in use | Existing folders under `docs/`: `adr/`, `decisions/`, `rfcs/`, `specs/`, `runbooks/`, `architecture/`, `operations/`, `qa/`, `learnings/`, `status/`, `templates/`, `project/` |
| Operating docs | Anything resembling `current-state`, `todo-plan`, `approval-queue`, `bootstrap-checklist` |
| Session recovery | A "what's the state right now" doc, a CHANGELOG, a "weekly notes" log |
| Templates | `docs/templates/`, `.github/PULL_REQUEST_TEMPLATE.md`, ADR template, RFC template |
| Language policy | English / target's local language / mixed; product vs ops separation |
| Naming conventions | ADR file naming, dated note naming, `archive/` patterns |
| CI | `.github/workflows/`, `.gitlab-ci.yml`, CircleCI, etc. |
| Git hooks | `lefthook.yml`, `.husky/`, `.pre-commit-config.yaml`, `lint-staged`, `simple-git-hooks` |
| Commit conventions | `commitlint.config.*`, `.gitmessage`, husky `commit-msg`, existing Conventional Commits in `git log` |
| Release tooling | `release-please-config.json`, `.changeset/`, `semantic-release`, `standard-version`, manual `CHANGELOG.md` |
| Secrets handling | `.gitleaks*`, `.trufflehogignore`, `.env.example`, `SECURITY.md` |
| Implementation language | `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, etc. |
| Repo phase | Brand-new vs in-flight feature work vs maintenance. This shapes what is "safe" to add. |

Output a short audit summary back to the user. Do not start writing yet.

---

## Phase 1: Propose an adoption plan

For each row in the matrix below, output one of `keep` / `merge` / `add` /
`skip` and a one-line reason. Get user approval before Phase 2.

| Layer | Files in this starter |
|-------|------------------------|
| Canonical entry | `AGENTS.md` |
| Tool entry pointers | `CLAUDE.md`, `.cursor/rules/00-entry.mdc` |
| Documentation governance | `docs/DOCUMENTATION_SYSTEM.md` |
| Agent workflow + index | `docs/agent/WORKFLOW.md`, `docs/agent/INDEX.md` |
| Session snapshot | `docs/agent/SESSION_START.md` |
| Operating docs | `docs/operations/{current-state,todo-plan,approval-queue,workflow,bootstrap-checklist}.md` |
| Specs layer | `docs/specs/README.md` + spec templates |
| ADRs layer | `docs/architecture/{README,adr/README}.md` |
| Learnings layer | `docs/learnings/README.md` |
| Status report policy | `docs/agent/status_report.md`, `docs/status/{README,archive/README}.md` |
| QA scenario axes | `docs/qa/e2e-scenarios.md` |
| Templates | `docs/templates/*.md` |
| Verification automation | `lefthook.yml`, `.markdownlint.json`, `lychee.toml`, `.gitleaks.toml`, `.github/workflows/docs-check.yml` |
| Slash / custom commands | `.claude/commands/*.md` (+ `## Commands` table in `AGENTS.md`) |
| Conventional Commits + release | `.gitmessage`, `release-please-config.json`, `.release-please-manifest.json`, `.github/workflows/release-please.yml` |
| Secrets policy | `docs/agent/SECRETS_POLICY.md` |
| Local browser/lane policy | `docs/agent/LOCAL_BROWSER_PROFILES_AND_PORTS.md` (only if relevant) |

Example output:

```text
| Layer                          | Action  | Reason                                  |
|--------------------------------|---------|-----------------------------------------|
| Canonical entry                | merge   | CLAUDE.md has 3 unique rules to absorb  |
| Documentation governance       | add     | No equivalent governance doc            |
| Operating docs                 | add     | Only manual CHANGELOG today             |
| Specs layer                    | skip    | docs/rfcs/ already in use; reuse it     |
| Verification automation        | merge   | Husky exists; add lychee + gitleaks     |
| Conventional Commits           | keep    | commitlint already enforced             |
| Release tooling                | keep    | semantic-release wired                  |
```

---

## Phase 2: Apply layer by layer

Apply in this order. Each step is idempotent and respects prior systems.

### 2.1 Entry layer (canonical AGENTS.md)

- If the target has no entry files, copy `AGENTS.md` from this starter and
  adapt phase/scope lines.
- If the target already has `AGENTS.md`:
  - Preserve all project-specific content.
  - Add only the missing structural sections: Language Policy,
    Documentation-First Rules, Documentation Sync Rules, Lean Context Rules,
    Approval Rules, Required Operating Outputs, Conventions And Learnings,
    Commit And Release Rules, Commands, Verification Layer.
  - Do not change product/business statements.
- If the target has `CLAUDE.md` / `GEMINI.md` / `.cursor/rules/*` with real
  rules: move those rules into `AGENTS.md` (merge, dedupe), then slim each
  tool entry file to a 3–10 line pointer.
- For tools the target uses but the starter does not (`.windsurfrules`,
  `.clinerules`, `.aider.conf.yml`), add a 1-line pointer file that points to
  `AGENTS.md`.
- **Make the pointer actually load.** A Markdown link is not auto-imported. If
  the target uses Claude Code, the `CLAUDE.md` pointer should use the native
  `@AGENTS.md` (and `@docs/agent/SESSION_START.md`) import syntax so canonical
  rules reach the model, not just a "go read that file" link.

### 2.2 Documentation governance

This is what makes the system reproducible across new docs. Skipping this
turns the harness into "just some files".

- If `docs/DOCUMENTATION_SYSTEM.md` (or equivalent) is absent, copy it from
  this starter and adapt:
  - Document categories table (which folder owns what)
  - Single-source-of-truth rule
  - Versioned vs evergreen distinction
  - Naming conventions: `YYYY-MM-DD-topic.md` for ADRs,
    `YYYY_MMDD_HHMM_description.md` for non-standard dated docs
  - Archive rules
  - Conflict rules (route to approval queue, not guesswork)
  - Decision flow (approval queue → ADR or learning)
  - Expansion rule (update governance before adding new doc families)
- If a similar governance doc exists, keep it; only add the *missing rules*
  that the harness depends on (decision flow, approval queue exit routing,
  versioned vs evergreen rule).
- Decide language policy explicitly. The starter splits English (operating
  docs) and Korean (product docs). Mirror the target's reality; do not
  blanket-apply this starter's split.

### 2.3 Agent workflow and index

- Add `docs/agent/WORKFLOW.md` if no equivalent operating loop exists. Adapt
  the Read Path to the target's actual entry-file layout and any extra
  policies (e.g. localhost lanes, design review).
- Add `docs/agent/INDEX.md` as the situational lookup. Trim rows that do
  not apply and add rows for the target's existing docs.

### 2.4 Session snapshot

- Add `docs/agent/SESSION_START.md` only if no equivalent "current state in
  one page" doc exists.
- Initial content must reflect the *target* repo: actual current phase,
  active focus, critical unknowns. Do not paste this starter's content.
- Keep under ~150 lines and link to policy docs rather than inlining policy.

### 2.5 Operating docs

These four files are the daily working surface.

- `docs/operations/current-state.md` — living recovery log. Add if missing.
  Initial fields: Last updated, Current Phase, Repository Status, Critical
  Unknowns, Next Safe Actions. Do not import the starter's "Completed in
  this session" list.
- `docs/operations/todo-plan.md` — P0/P1/P2/P3 priority buckets. Reflect the
  target's real next steps, not the starter's.
- `docs/operations/approval-queue.md` — open decisions inbox with the
  lifecycle (`open → resolved → routed`) and `## Resolved (archive)`
  section. If the target uses an external tracker (Linear, GitHub Issues
  with a label), document that in `AGENTS.md` and keep the queue empty.
- `docs/operations/workflow.md` — human-readable operating loop and the
  Section A–E checkpoint format.
- `docs/operations/bootstrap-checklist.md` — useful even on existing repos
  for periodic hygiene; otherwise skip.

### 2.6 Documentation taxonomy folders

Add only the folders the target actually needs. Each has a clear role.

| Folder | Role | When to add |
|--------|------|-------------|
| `docs/specs/` | Per-feature behavior contract before code | If target has no `specs/`, `rfcs/`, or equivalent |
| `docs/architecture/adr/` | Durable architectural decisions | If target has no ADR / decisions folder |
| `docs/learnings/` | Lightweight repo-wide micro-conventions | Always useful; add if absent |
| `docs/qa/` | E2E scenario axes and validation viewpoints | Add if no QA doc surface exists |
| `docs/status/` | Milestone, handoff, audit reports | Add if formal reporting is expected |
| `docs/project/` | Product brief, target users, scope | Skip if target already has product docs elsewhere |
| `docs/plans/` | Dated multi-step plans | Add if planning docs are needed |
| `docs/templates/` | Reusable formats | Always copy the templates the target needs |

When the target already has a similarly purposed folder (e.g. `docs/rfcs/`
for specs, `decisions/` for ADRs), **reuse the target's path** and adapt
the slash commands and governance doc to point there.

### 2.7 Reusable templates

Copy the templates the target needs into `docs/templates/`:

- `adr-template.md`
- `plan-template.md`
- `session-checkpoint-template.md`
- `approval-item-template.md`
- `status-report-template.md`
- `learning-template.md`
- `spec-ears-template.md`
- `spec-gherkin-template.md`
- `tasks-template.md` (the spec → tasks bridge; pair with the `/spec-tasks` command)

Skip any template whose corresponding folder was skipped in 2.6.

### 2.8 Verification automation

Conflict-aware adoption:

- **Hooks runner.** If `husky` is already installed, do **not** add `lefthook`.
  Add equivalent hooks under husky instead (commit-msg regex, gitleaks, link
  check, placeholder guard).
- **markdownlint.** Add `.markdownlint.json` if absent. If present, leave it.
- **lychee.** Add `lychee.toml` if absent.
- **gitleaks.** Add `.gitleaks.toml` if absent. If `trufflehog` or another
  scanner is in use, skip.
- **CI workflow.** Add `.github/workflows/docs-check.yml` only if a similar
  workflow does not already cover markdown lint, link check, secret scan,
  and a placeholder guard. Otherwise, propose a diff to extend the
  existing workflow.
- **Placeholder guard.** Adapt the path: it must point to whichever doc the
  target uses for session recovery.
- **Claude permission guardrail (optional).** If the target uses Claude Code,
  add a minimal `.claude/settings.json` with `permissions.deny` for secret-file
  reads (`.env*`, keys, PEM). Merge into any existing settings; never overwrite.

### 2.9 Slash / custom commands

- Copy `.claude/commands/*.md` to the target.
- Add a `## Commands` table to `AGENTS.md` so Codex/Cursor/Aider users see
  the same semantics as plain prompts.
- Adapt command bodies if the target's filenames differ
  (e.g. `docs/decisions/` instead of `docs/architecture/adr/`,
  `docs/rfcs/` instead of `docs/specs/`).

### 2.10 Conventional Commits + release tooling

- If the target already enforces Conventional Commits (commitlint, husky
  commit-msg), keep it. Do not add the starter's lefthook regex.
- If `release-please`, `semantic-release`, `changesets`, or
  `standard-version` is wired, keep it. Do not install another release tool.
- Only add `.gitmessage` and the `release-please` workflow if neither exists,
  and switch `release-type` from `simple` to the target's actual language
  (`node`, `python`, `go`, `rust`, ...).

### 2.11 Secrets policy

- Add `docs/agent/SECRETS_POLICY.md` if no equivalent (`SECURITY.md`,
  `docs/security/`) covers secret handling and MCP permissions.
- Tailor the MCP matrix to the tools the target actually uses. Do not paste
  the starter's matrix verbatim.
- If the target uses MCP servers, add a `.mcp.json.example` (not a live
  `.mcp.json` with real values). Tokens must come from environment-variable
  expansion (`${VAR}`), never literals in the committed file.

### 2.12 Browser / local-lane policy (only if relevant)

- If the target has a web UI, internal admin, or multi-port localhost setup,
  copy `docs/agent/LOCAL_BROWSER_PROFILES_AND_PORTS.md` and fill it out.
- If the target is a CLI/library with no browser surface, skip.

---

## Phase 3: Verify and commit

Before declaring the harness applied:

1. Run a link check (`lychee` or equivalent) on all changed and new docs.
2. Run `markdownlint` on the same set.
3. Confirm no real secret was introduced. Run `gitleaks` if newly configured.
4. Confirm `AGENTS.md` is the canonical entry and other entry files are
   pointers, not duplicates.
5. Confirm the doc taxonomy is internally consistent: every folder added in
   2.6 has at least its `README.md`, every template referenced from a
   command exists, every link from `INDEX.md` resolves.
6. Confirm commit messages used during this work follow whatever convention
   the target enforces.

Suggested commit shape if Conventional Commits is in effect:

```text
feat(harness): adopt project-starter documentation harness

- entry: canonicalize AGENTS.md, slim other entry files to pointers
- governance: add docs/DOCUMENTATION_SYSTEM.md
- agent docs: add WORKFLOW.md, INDEX.md, SESSION_START.md
- operations: add current-state, todo-plan, approval-queue (with lifecycle)
- taxonomy: add specs / adr / learnings / qa / status / templates layers
- automation: add markdownlint + lychee + gitleaks docs-check workflow
- secrets: add docs/agent/SECRETS_POLICY.md and MCP permission matrix

Adopted from: <starter repo or path> commit <sha>
```

If the user prefers smaller commits, split by layer using the same prefixes.

---

## Doc taxonomy cheat sheet

When a piece of information arrives, route it to exactly one home.

| If you have… | It belongs in | Notes |
|--------------|---------------|-------|
| An open question with multiple options | `docs/operations/approval-queue.md` | Resolve via `/promote-to-adr` or `/learning-add` |
| A made decision that is durable, structural, or hard to reverse | `docs/architecture/adr/YYYY-MM-DD-*.md` | Created from a resolved approval item |
| A lightweight repo-wide micro-rule | `docs/learnings/` | One-liner or short file |
| A per-feature behavior contract | `docs/specs/YYYY-MM-DD-*.md` | EARS or Gherkin |
| Today's working state for session recovery | `docs/operations/current-state.md` | Living, evergreen |
| Active priorities by P0–P3 | `docs/operations/todo-plan.md` | Living, evergreen |
| Operating loop / how we work | `docs/operations/workflow.md` and `docs/agent/WORKFLOW.md` | Stable |
| One-page snapshot for fast session start | `docs/agent/SESSION_START.md` | Refresh whenever active focus changes |
| Doc ownership / archive / naming rules | `docs/DOCUMENTATION_SYSTEM.md` | Update before adding new doc families |
| A milestone, handoff, or audit report | `docs/status/YYYY_MMDD_HHMM_*.md` | Older copies move to `status/archive/` |
| Reusable doc format | `docs/templates/` | Copy + adapt; do not leave placeholders |
| Browser / local-lane assignments | `docs/agent/LOCAL_BROWSER_PROFILES_AND_PORTS.md` | Only if applicable |
| Secrets / MCP rules | `docs/agent/SECRETS_POLICY.md` | Always |
| Product problem, users, scope | `docs/project/product-brief.md` | Korean is fine if that is the team's working language |
| E2E scenario axes and real journeys | `docs/qa/e2e-scenarios.md` | Link to specs that cover each scenario |

If two homes seem possible, default to the queue, then resolve into the right
home. Never invent a new doc family without updating `DOCUMENTATION_SYSTEM.md`
first.

---

## Out of scope (do not auto-import)

- The starter's `docs/project/product-brief.md` content. The target has its
  own product context.
- The starter's `approval-queue.md` example items 1–5.
- The starter's bootstrap checklist body (the *file* may be useful, but its
  content assumes a brand-new repo).
- License decisions.
- The `release-please` `release-type: simple` default — pick the target's
  real language instead.
- The starter's `documentation-foundation-plan.md` (it is the starter's own
  meta plan).
- The starter's "Current Repository Phase: do not create application code
  yet" line — the target almost certainly has code already.

---

## Failure handling

- If a layer cannot be applied without overwriting working code, stop and
  return to the user with the diff and a short question.
- If two systems conflict (e.g. husky + lefthook, release-please +
  semantic-release), pick the one already in use and record the
  substitution as a learning so future agents see the rationale.
- If the user revokes approval mid-way, do not leave half-merged config.
  Either complete the layer or revert it cleanly.
- If `DOCUMENTATION_SYSTEM.md` and any existing target governance disagree,
  do not silently overwrite. Add an approval-queue item and let the user
  pick.
