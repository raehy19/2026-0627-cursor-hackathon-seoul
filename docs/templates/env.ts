// env.ts — 포트폴리오 표준: zod 환경변수 검증 (project-starter 템플릿)
//
// 목적: 빌드/부팅 시점에 누락·오타·형식오류를 "즉시 실패"시켜, 런타임에 undefined가
//       퍼지는 사고를 막는다. (T3-env 스타일의 경량 버전 — 추가 의존성은 zod 하나뿐.)
//
// 사용:
//   1) 이 파일을 앱의 src/env.ts (또는 web/src/env.ts)로 복사.
//   2) 아래 schema를 이 레포가 실제 쓰는 변수로 조정 — 필수는 .min(1)/.url(), 선택은 .optional().
//   3) 진입점에서 한 번 import: import "@/env";  (또는 import { env } from "@/env";)
//      Next.js면 next.config.* 상단에서 import 하면 빌드 때 검증된다.
//
// 규칙:
//   - 클라이언트에 노출할 값만 NEXT_PUBLIC_ 접두. 서버 비밀(키/토큰)은 절대 NEXT_PUBLIC_ 금지.
//   - GA ID는 하드코딩하지 말고 env로만 (NEXT_PUBLIC_GA_MEASUREMENT_ID).
import { z } from "zod";

const schema = z.object({
  // ── 서버 전용 (브라우저 노출 금지) ──
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "service-role 키 필요"), // 서버 액션/라우트에서만
  // ── 클라이언트 (NEXT_PUBLIC_*) ──
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("유효한 Supabase URL 필요"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, "publishable 키 필요"),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(), // canonical/OG 절대경로용
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z
    .string()
    .regex(/^G-[A-Z0-9]{8,}$/, "GA4 측정 ID 형식 G-XXXXXXXX")
    .optional(),
});

// Next.js는 클라이언트 번들에 NEXT_PUBLIC_* 리터럴만 인라인하므로 명시적으로 펼친다.
const parsed = schema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
});

if (!parsed.success) {
  console.error("❌ 환경변수 검증 실패:\n", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables — .env 확인");
}

export const env = parsed.data;
