# E2E Scenario Checklist

This document is the baseline for auditing real user journeys after the product is defined.

## Current status
- The product is still undefined, so this doc only provides shared audit axes for now.

## Common critical scenario axes

### 1. First entry / onboarding
- How does the user enter for the first time
- What must be understood on the first screen
- How is the initial empty state handled

### 2. Core value flow
- Can the user achieve the main goal in one clear flow
- Are input validation and failure recovery defined
- Is draft state or retry behavior needed

### 3. Create / update / delete
- Is the post-create state transition clear
- How are edit conflicts and partial failures handled
- If deletion exists, are warning and recovery expectations sufficient

### 4. Auth / permissions
- Is login requirement explicit
- Are role-based differences defined
- Is unauthorized access handled in both UX and security terms

### 5. Async work / external integrations
- What state does the user see during delay
- Is retry or deduplication required
- Is there a recovery path for integration failures

### 6. Payments / irreversible actions
- Does the product include payment or irreversible actions
- Are confirmation and auditability required
- Is consistency protected after failure

### 7. Error / empty state / observability
- Are empty, loading, and error states all defined
- Are user-facing messages separated from operator debugging details
- Are the necessary logs and metrics identified

## Actions after product definition
- Write at least three real scenarios.
- For each scenario, document entry conditions, success path, failure path, and recovery path.
- Link the scenario to the related docs and implementation boundaries.
