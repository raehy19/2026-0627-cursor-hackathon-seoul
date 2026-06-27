# 포트폴리오 공통 표준 (Portfolio Standards)

> 전 서비스(특히 공개 웹)에 반복 적용하는 기본기. project-starter가 정본 — 신규/기존 레포가 상속.
> 코드 레퍼런스는 대시보드 [`comparisons/REUSE-MAP.md`], 전략은 [`comparisons/PORTFOLIO-STRATEGY.md`].

## 1. 환경변수 — zod 검증 (필수)
- **무엇**: 빌드/부팅 시 환경변수 스키마 검증으로 누락·오타·형식오류를 즉시 실패.
- **어떻게**: [`docs/templates/env.ts`](../templates/env.ts)를 `src/env.ts`로 복사 → 진입점/`next.config.*`에서 import.
- **규칙**: 서버 비밀은 절대 `NEXT_PUBLIC_` 금지. GA ID 등은 env로만(하드코딩 금지). 필수=`.min(1)`/`.url()`, 선택=`.optional()`.
- 현황: zod 의존 보유 레포 다수(ohmytrend·ohmyinfluencer·invera·content-lab·cardnews-maker)지만 **env 검증 전용 모듈은 아직 0** → 우선 도입 대상.

## 2. 보안 헤더 + rate-limit
- **헤더**: `next.config.*`의 `headers()`로 CSP·HSTS·X-Frame-Options·X-Content-Type-Options·Referrer-Policy·Permissions-Policy.
- **rate-limit**: 미들웨어에서 IP 기반 제한. **레퍼런스 = ohmyproduct** `web/src/lib/supabase/middleware.ts`(300req/min IP rate-limit + 정지/IP밴 게이트).
- 공개 폼/제출 엔드포인트 있는 커뮤니티 제품(ohmytrend·ohmyinfluencer·invera)에 우선.

## 3. SEO / AEO (공개 웹 전부)
- **MUST**: DB sitemap(**ISR/캐시 필수** — 안 그러면 봇 트래픽이 Vercel Hobby 한도 초과로 배포 정지, ohmyproduct 사례) · robots(검색/AI봇 허용목록 + Sitemap 라인) · 동적 라우트 `generateMetadata`+`revalidate` · GSC/네이버/빙 제출.
- **AMPLIFIER**: `feed.xml`(RSS) · `llms.txt` · JSON-LD · IndexNow.
- **레퍼런스**: parentlyze_web `src/lib/seo/*`(+IndexNow), ohmyproduct sitemap/robots/feed/jsonld. 상세 [`REUSE-MAP.md` §5].

## 4. Google Analytics (공개 웹 전부)
- **표준**: `npm i @next/third-parties` → `layout.tsx`에 `const gaId=process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID; {gaId && <GoogleAnalytics gaId={gaId}/>}`.
- env명 통일 **`NEXT_PUBLIC_GA_MEASUREMENT_ID`**, **하드코딩 ID 금지**(동의/DNT 필요 시 worldclonelab `GoogleAnalytics.tsx` 채용).
- 현황: active 3(fjord·parentlyze_web·worldclonelab) / wired-env 4(ohmyproduct·ohmytrend·ohmyinfluencer·potentivo — Vercel에 실 ID 설정 필요) / 미적용 다수.

## 적용 체크리스트 (공개 웹 신규/기존)
- [ ] zod `env.ts` 도입 (§1)
- [ ] GA4 `@next/third-parties` + env ID (§4)
- [ ] SEO/AEO: sitemap(ISR)+robots+JSON-LD+llms.txt+feed (§3)
- [ ] 보안 헤더 + rate-limit (§2)
- [ ] `@supabase/ssr` server/client/admin 3분할 + 라우트보호 미들웨어 (REUSE-MAP §1)
