# Pending Approval Queue

Keep this document concise. Only record items that require a real decision.

## Lifecycle

Every approval item moves through these states:

1. **open** — appended via `/approval-add`. Waiting for a decision.
2. **resolved** — the user has decided. Record `Decision:` and `Resolved:` date.
3. **routed** — moved out of the active list:
   - **High-impact** → promoted to an ADR via `/promote-to-adr <id>`. The
     resolved item gets a `Promoted to docs/architecture/adr/<file>.md` line and
     is moved to the archive section below.
   - **Low-impact** → captured as a one-line entry in `docs/learnings/` and
     moved to the archive section below.
   - **Dropped** → no longer relevant. State `Decision: dropped` with a reason.

Resolved items must not stay in the active list. The active list is only for
**open** decisions.

## Item format

```text
## <id>. <title>

- Status: open | resolved
- Opened: YYYY-MM-DD
- (when resolved) Resolved: YYYY-MM-DD
- (when resolved) Decision: <chosen option and one-line reason>
- (when promoted) Promoted to: <ADR path> or <learning path>
- Why it matters: <fill>
- Options:
  - <option A>
  - <option B>
- Recommended option: <fill>
- Risks: <fill>
- Affected areas: <fill>
```

---

## Active

### 1. Product problem statement and primary user
- Status: open
- Opened: 2026-05-03
- Why it matters: this anchors requirements, scope, architecture, and priorities.
- Options:
  - The user provides the problem statement directly.
  - A hypothesis draft is proposed first and then reviewed.
- Recommended option: get the problem statement and first target user directly from the user, then expand the docs.
- Risks: detailed planning without this will mostly be guesswork.
- Affected areas: product brief, E2E scenarios, architecture, implementation planning

### 2. MVP scope and out-of-scope boundary
- Status: open
- Opened: 2026-05-03
- Why it matters: this prevents over-design and unnecessary technical decisions.
- Options:
  - A narrow MVP focused only on the core value flow
  - A broad MVP that includes secondary features
- Recommended option: lock a narrow MVP first.
- Risks: broad scope will destabilize planning and sequencing early.
- Affected areas: planning docs, E2E checklist, implementation priorities

### 3. First platform scope
- Status: open
- Opened: 2026-05-03
- Why it matters: web, mobile, API, and internal-tool starts imply different architecture and planning paths.
- Options:
  - Web first
  - API first
  - Mobile first
  - Multi-platform from day one
- Recommended option: start with one platform only.
- Risks: simultaneous platform starts create premature complexity in an empty repository.
- Affected areas: architecture docs, implementation plan, testing strategy

### 4. Repository bootstrap strategy
- Status: open
- Opened: 2026-05-03
- Why it matters: Git initialization, mono-repo choice, and default tooling all depend on this.
- Options:
  - Start as a single-app repo after product definition
  - Start as a mono-repo after product definition
  - Keep docs only for now and decide right before implementation
- Recommended option: keep docs only for now and decide after product scope is defined.
- Risks: locking repository structure too early can freeze the wrong assumptions.
- Affected areas: root structure, tooling, deployment model

### 5. License choice
- Status: open
- Opened: 2026-05-03
- Why it matters: licensing is a legal decision that affects reuse, contribution, and distribution.
- Options:
  - Keep the repository private and effectively unlicensed
  - Choose a permissive open-source license
  - Choose a copyleft license
- Recommended option: decide explicitly before publishing or sharing outside the team.
- Risks: choosing the wrong license creates legal ambiguity or unintended reuse terms.
- Affected areas: repository metadata, distribution, contribution policy

---

## Resolved (archive)

<!--
Move resolved items here once they have been routed. Keep the original headings,
add Resolved/Decision/Promoted-to fields, and link to the ADR or learning entry
that captured the decision. Do not delete history.
-->

_None yet._
