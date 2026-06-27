# Spec: <feature-title>

Style: EARS

Status:
- Draft

Owner:
- <fill>

Related:
- Product brief section: <fill>
- ADR: <fill or none>
- E2E scenario: <fill or none>

## Goal
- <One sentence describing user value.>

## In scope
- <Bullet list of what this spec covers.>

## Out of scope
- <Bullet list of what this spec deliberately excludes.>

## Definitions
- <Term>: <definition>

## Requirements (EARS)

Use these EARS patterns. Each requirement gets a unique ID.

- **Ubiquitous**: `R-<n>: The <system> shall <response>.`
- **Event-driven**: `R-<n>: When <trigger>, the <system> shall <response>.`
- **State-driven**: `R-<n>: While <state>, the <system> shall <response>.`
- **Unwanted**: `R-<n>: If <unwanted condition>, then the <system> shall <response>.`
- **Optional feature**: `R-<n>: Where <feature included>, the <system> shall <response>.`

Example:

- R-1: When a signed-in user submits a valid form, the system shall persist the record and respond with the new resource id.
- R-2: If the form fails validation, then the system shall reject the submission and return field-level error messages.
- R-3: While the user has no internet connection, the system shall queue the submission locally and retry when connectivity returns.

### Requirements
- R-1: <fill>
- R-2: <fill>
- R-3: <fill>

## Acceptance criteria
- Each requirement above must be observable from outside the system.
- For each requirement, list the test or check that proves it:
  - R-1 → <test name or scenario>
  - R-2 → <test name or scenario>

## Failure modes and recovery
- <Failure mode>: <expected behavior, retry, message, recovery path>

## Open questions
- <Questions that block "Ready" status. Move to approval queue if blocking.>
