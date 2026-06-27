# Spec: <feature-title>

Style: Gherkin

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

## User story
- As a <user role>
- I want <capability>
- so that <outcome>

## Scenarios

Use Gherkin `Given / When / Then`. Each scenario gets a unique ID.

```gherkin
Feature: <feature-title>

  Scenario: S-1 <happy path>
    Given <initial context>
    And <additional context>
    When <action or event>
    Then <expected observable outcome>

  Scenario: S-2 <validation failure>
    Given <invalid input setup>
    When <action>
    Then <error message>
    And <state should not change>

  Scenario: S-3 <recovery path>
    Given <degraded condition>
    When <action>
    Then <fallback behavior>
    And <user-facing message>
```

## Acceptance criteria
- Every scenario must be implementable as a test.
- Map each scenario to a test or audit step:
  - S-1 → <test name or location>
  - S-2 → <test name or location>

## Failure modes and recovery
- <Failure mode>: <expected behavior, retry, message, recovery path>

## Open questions
- <Questions that block "Ready" status. Move to approval queue if blocking.>
