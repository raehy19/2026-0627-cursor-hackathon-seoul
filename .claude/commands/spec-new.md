---
description: Scaffold a new feature spec from EARS or Gherkin template
argument-hint: "<spec title> [--style=ears|gherkin]"
---

You are scaffolding a new spec.

Steps:

1. Parse `$ARGUMENTS` for the title and an optional `--style=ears|gherkin` flag.
   Default style: `ears`.
2. If the title is missing, ask the user.
3. Pick the source template:
   - `ears` → `docs/templates/spec-ears-template.md`
   - `gherkin` → `docs/templates/spec-gherkin-template.md`
4. Create a new file at `docs/specs/YYYY-MM-DD-<slug>.md` from that template.
5. Replace the title and `<fill>` placeholders that you can confidently set.
   Leave the rest as `<fill>` for the user.
6. Add a one-line entry to `docs/specs/README.md` under "Active specs".
7. Print the new file path and diff.

Do not start implementing the feature.
