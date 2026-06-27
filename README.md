# What if…? — 카톡 평행우주 시뮬레이터

해커톤 프로젝트. 카톡 대화 내보내기를 분석해 **어디서 어긋났는지** 찾고 **"그때 이렇게 말했더라면"**을 시뮬레이션합니다.

| 항목 | 위치 |
|------|------|
| **앱 (Next.js)** | [`web/`](web/) — `npm run dev` |
| **정본 PRD** | [`docs/project/prd-what-if.md`](docs/project/prd-what-if.md) |
| **현재 상태** | [`docs/operations/current-state.md`](docs/operations/current-state.md) |
| **E2E 시나리오** | [`docs/qa/e2e-scenarios.md`](docs/qa/e2e-scenarios.md) |

```bash
cd web && cp .env.example .env.local   # OPENROUTER_API_KEY (선택)
npm install && npm run dev             # http://localhost:3000
npm run validate                       # 루트 골든 샘플 3종 검증
```

루트에는 문서 운영 하네스(`AGENTS.md`, 승인 큐, lefthook)와 제품 문서가 함께 있습니다.

---

## Project Docs Starter (하네스)

이 저장소는 문서 우선 운영체계 + 위 제품 앱을 함께 관리합니다.

현재 상태:
- **앱 구현:** `web/` (Phase 1 — P0 기능 완료, 빌드·validate 통과)
- Git 저장소, lefthook 검증 훅 설치됨
- 정본 PRD·브리프·todo-plan 동기화됨

문서 언어 정책:
- 에이전트가 직접 해석해야 하는 운영 문서와 규칙 문서는 영어로 유지
- 제품 기획, 브리프, 사용자 관점 문서는 한국어 중심으로 유지
- 혼합 문서는 구조와 제어 문구는 영어, 제품 내용은 한국어 우선

핵심 원칙:
- 문서 우선, 구현 후행
- 코드 변경과 문서 변경을 항상 함께 관리
- 충돌하는 요구나 불명확한 의사결정은 추측하지 않고 승인 큐에 기록
- 짧은 세션에서도 바로 이어갈 수 있도록 현재 상태를 지속적으로 문서화
- 진입파일은 `AGENTS.md` 하나가 정본 (Codex/Cursor/Claude Code/Aider 등 공통 표준)

## 빠른 시작 (Quick Start)

이 스타터를 새 프로젝트로 가져오는 가장 안전한 방법은 **기존 `.git`을 가져오지 않는 것**이다. 다음 중 하나를 선택한다.

```sh
# 1) degit (가장 간단, .git 자동 제거)
npx degit <github-org>/<starter-repo> my-project
cd my-project && git init -b main && git add . && git commit -m "chore: bootstrap from project-starter"

# 2) GitHub CLI 템플릿 복사 (이 저장소를 GitHub Template으로 마킹한 경우)
gh repo create my-project --template <github-org>/<starter-repo> --private --clone
cd my-project

# 3) 수동 복사 (네트워크 없이)
cp -R project-starter my-project
cd my-project && rm -rf .git && git init -b main && git add . && git commit -m "chore: bootstrap"
```

복사 직후 반드시 바꿔야 할 항목:
1. 저장소 이름과 프로젝트명 (`<project-name>` 검색해 일괄 치환)
2. `docs/operations/current-state.md`의 `Last updated` 날짜
3. 제품 문제 정의와 1차 대상 사용자 (`docs/project/product-brief.md`)
4. MVP 범위와 비범위
5. 첫 플랫폼 범위
6. 라이선스 선택 여부

검증 훅 설치 (선택, 코드가 들어오기 시작할 때 권장):

```sh
brew install lefthook gitleaks lychee
npm install -g markdownlint-cli
lefthook install
git config commit.template .gitmessage
```

## 문서 시작점

- [에이전트 정본 진입](AGENTS.md)
- [세션 시작 한 장 요약](docs/agent/SESSION_START.md)
- [에이전트 공용 워크플로](docs/agent/WORKFLOW.md)
- [에이전트 문서 인덱스](docs/agent/INDEX.md)
- [문서 거버넌스](docs/DOCUMENTATION_SYSTEM.md)
- [문서 운영 맵](docs/README.md)
- [기본 워크플로](docs/operations/workflow.md)
- [프로젝트 부트스트랩 체크리스트](docs/operations/bootstrap-checklist.md)
- [현재 상태 / 세션 복구](docs/operations/current-state.md)
- [우선순위 TODO 계획](docs/operations/todo-plan.md)
- [승인 대기 큐](docs/operations/approval-queue.md)
- [E2E 시나리오 체크리스트](docs/qa/e2e-scenarios.md)
- [기능 스펙 디렉토리](docs/specs/README.md)
- [학습/컨벤션 누적](docs/learnings/README.md)
- [비밀/MCP 권한 정책](docs/agent/SECRETS_POLICY.md)
- [Claude 권한 가드레일](.claude/settings.json) · [MCP 서버 예시](.mcp.json.example)
- [기존 리포에 하네스 적용 플레이북](docs/agent/APPLY_HARNESS.md)
- [제품 브리프 초안](docs/project/product-brief.md)
- [상태 보고서 정책](docs/agent/status_report.md)
- [문서 템플릿](docs/templates/README.md)

## 추천 시작 순서

1. `AGENTS.md`와 `docs/agent/SESSION_START.md`를 먼저 읽는다.
2. `docs/operations/bootstrap-checklist.md`를 따라간다.
3. `docs/project/product-brief.md`를 채운다.
4. `docs/operations/approval-queue.md`에서 미결정 항목을 정리한다.
5. `docs/qa/e2e-scenarios.md`에 실제 핵심 흐름을 적는다.
6. 핵심 기능마다 `/spec-new <title>`로 스펙을 먼저 만든다.
7. 그 다음에만 아키텍처와 구현 계획으로 이동한다.

## 에이전트와 첫 작업

새 프로젝트로 복사한 직후, 에이전트(Claude Code / Codex / Cursor / Aider 등)에 아래 한 줄 중 하나를 던지면 컨텍스트가 자동으로 잡힌다. 각 어시스턴트의 진입파일이 `AGENTS.md`를 가리키므로 동일하게 동작한다.

```text
Read AGENTS.md and docs/agent/SESSION_START.md first.
Summarize the current operating state and propose the safest next step.
Do not write code yet.
```

부트스트랩을 같이 진행하고 싶을 때:

```text
Walk me through docs/operations/bootstrap-checklist.md one item at a time.
For each unclear decision, append it to the approval queue with /approval-add
instead of guessing.
```

첫 기능 정의로 들어갈 때:

```text
Read docs/specs/README.md, then run /spec-new "<feature title>"
using the EARS template. Stop after the spec is drafted.
```

## 다른 기존 프로젝트에 이 하네스 적용하기

이 폴더는 새 프로젝트용 템플릿이지만, **이미 코드가 있는 기존 리포에 부분 적용**하는 참조 자료로도 동작한다. 에이전트가 이 폴더를 읽고 다른 작업 디렉토리에 옮겨 심는 절차는 [docs/agent/APPLY_HARNESS.md](docs/agent/APPLY_HARNESS.md)에 4단계(Audit → Plan → Apply → Verify)로 정리되어 있다.

대상 리포에서 에이전트에 다음과 같이 지시하면 된다.

```text
Apply the project-starter harness to this repo.
Use <path-to-this-starter>/docs/agent/APPLY_HARNESS.md as your playbook.
Audit first, then propose an adoption plan layer by layer, and only apply
each layer with my approval. Do not overwrite existing tooling that already
works (husky, commitlint, semantic-release, existing ADR folder, etc.).
```

플레이북이 옮기는 것은 단순 파일이 아니라 **이 프로젝트의 운영 규율 자체**다.

- 핵심 원칙 6가지: documentation-first / SSoT / approval-queue 규율 / 결정 레이어 분리(ADR·learning·queue·spec) / lean context / no-false-claims
- 문서 거버넌스(`DOCUMENTATION_SYSTEM.md`) — 카테고리, 명명 규칙, archive, 충돌 처리, 결정 흐름
- 에이전트 워크플로 / INDEX / SESSION_START 한 장 요약
- 운영 4종 세트 — current-state / todo-plan / approval-queue (lifecycle 포함) / workflow / bootstrap-checklist
- 문서 분류 폴더 — specs / architecture/adr / learnings / qa / status / templates / project / plans (대상에 이미 있으면 그쪽 경로 재사용)
- 재사용 템플릿 8종 (ADR, plan, checkpoint, approval-item, status-report, learning, EARS spec, Gherkin spec)
- 검증 자동화 (lefthook/husky 중 기존 채택, markdownlint, lychee, gitleaks, GH Actions)
- 슬래시/커스텀 명령 + `AGENTS.md` `## Commands` 표
- Conventional Commits + release-please (또는 기존 commitlint/semantic-release/changesets와 충돌 회피)
- 비밀/MCP 정책 + 브라우저/로컬 레인 정책(해당될 때만)

대상 리포에 이미 husky / commitlint / semantic-release / changesets / ADR 폴더 / RFC 폴더 등이 있으면 모두 우선 보존하고, 충돌 시에는 학습(`docs/learnings/`)에 사유를 남긴다. 스타터의 예시 승인 항목, product-brief, license 결정, "코드 작성 금지" 문구 등은 자동 임포트하지 않는다.

플레이북 끝에는 **doc taxonomy cheat sheet**가 있어 "정보 X가 들어왔을 때 어느 문서로 라우팅하는가"가 한 장에 정리되어 있다.

## 운영 슬래시 명령

`.claude/commands/`에 정의되어 있고, 다른 어시스턴트에서는 `AGENTS.md`의 `## Commands` 표가 동일한 의미를 명시한다.

| 명령 | 역할 |
|------|------|
| `/session-start` | `docs/agent/SESSION_START.md`를 운영 문서 기준으로 갱신 |
| `/checkpoint` | A–E 체크포인트 작성 + `current-state.md` 갱신 |
| `/approval-add <title>` | 승인 큐에 항목 추가 (자동 채번) |
| `/approval-resolve <id> <decision>` | 큐 항목 닫기 + ADR/learning 라우팅 |
| `/promote-to-adr <id>` | 결정된 큐 항목을 ADR로 승격 |
| `/learning-add <rule>` | 가벼운 컨벤션을 `docs/learnings/`에 누적 |
| `/spec-new <title> [--style=ears\|gherkin]` | 스펙 스캐폴드 |
| `/spec-tasks <spec>` | Ready 상태 스펙을 요구사항 ID에 연결된 태스크 목록으로 분해 |

## 호환되는 어시스턴트

- Codex, OpenAI Agents SDK 등 — `AGENTS.md` 자동 인식
- Claude Code — `CLAUDE.md` (정본 포인터)
- Cursor — `.cursor/rules/00-entry.mdc` (정본 포인터)
- Aider, Continue.dev, Windsurf, Cline, Zed 등 — `AGENTS.md`를 직접 참조하거나 각 도구의 1줄 포인터 파일을 추가

새 어시스턴트 지원이 필요하면 진입파일을 `AGENTS.md`로 향하는 1줄 포인터로만 추가한다. 규칙 본문은 절대 복제하지 않는다.
