# Secrets and MCP Permission Policy

Agents must read this before touching any token, key, environment variable, or MCP
credential. Defaults are conservative — widen only with explicit user approval.

## Hard rules

- Never commit a real secret. The `gitleaks` hook (`.gitleaks.toml`) and CI
  scanner enforce this.
- Never paste a real secret into a doc, comment, log, or chat output.
- Never echo a secret back to the user even when they share one in conversation.
  Acknowledge that you received it without quoting the value.
- Never write a secret to a path tracked by git. `.env*` files are gitignored;
  keep it that way.
- If a secret is suspected to have been exposed, treat it as compromised: tell
  the user, recommend rotation, and open an approval-queue item.

## Where secrets live

| Secret type | Location | Notes |
|-------------|----------|-------|
| App runtime secrets | `.env`, `.env.local` | Never committed. `.env.example` documents the shape. |
| CI/CD secrets | GitHub Actions repository secrets | Reference via `${{ secrets.NAME }}` only. |
| MCP server tokens | The MCP client's own credential store | Do not duplicate to repo files. |
| Personal tokens (PAT, etc.) | Each developer's machine | Out of scope for this repo. |

If a tool needs a value that is not yet defined, add it to `.env.example` with
a placeholder and document the purpose in the same PR.

## MCP permission matrix

The repo may be used with multiple MCP servers (`chrome-devtools`, file system
access, web fetch, GitHub, Slack, etc.). Treat each as an authority boundary.

| Capability | Default allowed? | Notes |
|------------|------------------|-------|
| Read repo files | Yes | Read-only inspection is always safe. |
| Edit repo files | Yes | Within the documented scope. |
| Run local shell commands | With confirmation | Reversible commands may run; destructive commands require explicit consent. |
| Outbound HTTP fetch | With confirmation for non-public hosts | Public docs are fine; internal URLs require approval. |
| Browser automation against logged-in sessions | With confirmation | A logged-in browser profile is itself a credential. |
| Posting to external services (GitHub, Slack, email, Linear) | Always requires explicit confirmation | Visible side effects must be authorized per action. |
| Running long-lived background agents | With approval-queue entry | Background tasks should be intentional and trackable. |

When a capability is exercised that is not in the "always" column, state what
you are about to do, why, and stop if the user does not confirm.

## Operational checks

Before opening or modifying any code that handles secrets:

1. Confirm the value comes from `process.env` / equivalent, not a literal.
2. Confirm `.env.example` documents the variable name with a non-real placeholder.
3. Confirm `.gitignore` covers the file or directory holding real values.
4. If a new external service is added, append it to the MCP matrix above.

## Enforced guardrails (config, not just policy)

Prose policy is backed by config where the tool allows it:

- `.claude/settings.json` sets `permissions.deny` for reads of `.env`, `.env.*`,
  `*.pem`, and SSH keys so an agent cannot pull secret files into context. Extend
  the list per project; do not loosen it without a reason. It also routes
  `git push --force` through an `ask` prompt.
- MCP servers are declared in `.mcp.json` (copy from `.mcp.json.example`). Real
  tokens are injected via environment-variable expansion (`${VAR}`), never written
  as literals into the committed file.

## When something looks wrong

- If a string in a diff matches `AKIA[A-Z0-9]{16}`, `xox[baprs]-`, `ghp_`,
  `sk-[A-Za-z0-9]{20,}`, or another known secret prefix, stop and warn the user.
- If `gitleaks` flags a file, do not "allowlist" the match without checking
  whether the value is real. Allowlists go in `.gitleaks.toml`, not inline.
- If unsure whether something counts as a secret, treat it as one until proven
  otherwise.

## Related
- `.gitleaks.toml`
- `.gitignore`
- `lefthook.yml` (`pre-commit` runs `gitleaks`)
- `.github/workflows/docs-check.yml` (CI scanner)
- `.claude/settings.json` (`permissions.deny` blocks reads of `.env*`, keys, and PEM files)
- `.mcp.json.example` (MCP server template; real tokens come from the environment, never the file)
