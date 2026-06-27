# Local Browser Profiles And Ports

Use this file only if the project introduces browser automation, manual localhost
QA, or multiple browser lanes. It exists to prevent port and profile collisions
across the services and projects running on one machine.

## Current Status
- No dedicated localhost ports, browser profiles, or DevTools lanes are assigned yet.

## Tool Preference
- Prefer `chrome-devtools` MCP first for browser inspection, screenshots, console
  and network checks, and manual flow validation.
- Use Playwright only when deterministic regression coverage or explicit Playwright
  work is required.

## When To Update This File
- The project starts a web app or local admin surface.
- Browser automation requires stable profile separation.
- Multiple local services need fixed ports.
- A team needs named browser lanes for reproducible QA.

## Lane Registry

Record one row per long-lived local surface. Keep a port stable once assigned.

| Service | URL + port | Browser profile / lane | DevTools port | Owner / use | Login / seed notes |
|---------|-----------|------------------------|---------------|-------------|--------------------|
| _example: web_ | `http://localhost:3000` | `chrome-web` | 9222 | dev UI | seeded test user |
| _example: admin_ | `http://localhost:3100` | `chrome-admin` | 9223 | internal admin | requires admin login |

## Suggested Port Ranges

Pick a fixed base per project so two projects never fight for the same port.

- App / web dev server: `3000–3099`
- Secondary surface (admin, docs, storybook): `3100–3199`
- API / backend: `4000–4099`
- DevTools remote-debugging: `9222–9299` (one per browser profile)

## Collision Checklist (before claiming a port or profile)

1. Is the port already listed above or held by another running service
   (`lsof -i :<port>`)? If so, pick the next free one in the range.
2. Does the browser profile directory already belong to another lane? Never share
   one logged-in profile across two services — a logged-in profile is a credential.
3. If this machine keeps a shared cross-project port registry, reconcile against it
   and link it here so other projects can see this project's allocation.

## Minimum Fields To Record
- Service name
- Localhost URL and fixed port
- Browser profile or lane name
- DevTools port if applicable
- Owner or intended use
- Special login or seed-data requirements
