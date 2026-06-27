/**
 * Validation harness for the DATA CORE (parser + stats). Runs the public
 * parser/stats against the three real sample exports at the repo root and
 * asserts the byte-inspected facts. Run with:  cd web && npx tsx scripts/validate.ts
 *
 * The parser/stats modules only `import type` from "@/lib/types" (erased at
 * runtime), so importing them via relative paths works under tsx directly.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseKakaoExport } from "../src/lib/parser/index";
import { normalizeTxt, detectTxtLocale } from "../src/lib/parser/detect";
import { parseTxt } from "../src/lib/parser/txt";
import { computeDerivedStats } from "../src/lib/stats/index";
import type { ParseResult } from "../src/lib/types";

const ROOT = resolve(process.cwd(), "..");
const CSV_NAME = "KakaoTalk_Chat_공돌이들_2026-06-27-13-08-31.csv";
const ONE_NAME = "KakaoTalkChats (1).txt";
const BIG_NAME = "KakaoTalkChats.txt";
const FIVE = ["김건우", "김주형", "유기훈", "정래현", "한채린"];

let failures = 0;
function check(label: string, cond: boolean, detail?: string): void {
  const tag = cond ? "PASS" : "FAIL";
  if (!cond) failures++;
  console.log(`  [${tag}] ${label}${detail ? `  — ${detail}` : ""}`);
}

function fileFrom(name: string): File {
  const buf = readFileSync(resolve(ROOT, name));
  return new File([buf], name, { type: name.endsWith(".csv") ? "text/csv" : "text/plain" });
}

function showMsgs(parse: ParseResult, n: number): void {
  for (const m of parse.messages.slice(0, n)) {
    const flags = [m.isSystem && "SYS", m.isMedia && "MEDIA", m.isUrl && "URL"]
      .filter(Boolean)
      .join(",");
    const when = new Date(m.ts).toISOString();
    const text = m.text.replace(/\n/g, "\\n").slice(0, 60);
    console.log(`     ${when}  ${m.sender || "(system)"}: ${text}${flags ? `  <${flags}>` : ""}`);
  }
}

async function main(): Promise<void> {
  // --- CSV ----------------------------------------------------------------
  console.log("\n=== CSV (macOS, group) ===");
  const csv = await parseKakaoExport(fileFrom(CSV_NAME));
  check("format === 'csv'", csv.format === "csv", csv.format);
  check("participants.length === 5", csv.participants.length === 5, JSON.stringify(csv.participants));
  check("mode === 'group'", csv.mode === "group", csv.mode);
  check(
    "message count sane (~4400, not 4484)",
    csv.messages.length >= 4350 && csv.messages.length <= 4470 && csv.messages.length !== 4484,
    `count=${csv.messages.length}`,
  );
  check(
    "participants are the 5 expected",
    FIVE.every((n) => csv.participants.includes(n)),
    JSON.stringify(csv.participants),
  );
  if (csv.warnings) console.log(`     warnings: ${csv.warnings.join("; ")}`);
  console.log("   first 3 messages:");
  showMsgs(csv, 3);

  // --- 1:1 txt ------------------------------------------------------------
  console.log("\n=== (1).txt (Android EN, 1:1) ===");
  const one = await parseKakaoExport(fileFrom(ONE_NAME));
  check("format === 'android'", one.format === "android", one.format);
  check(
    "participants === [정래현, 서연이] (any order)",
    one.participants.length === 2 &&
      [...one.participants].sort().join(",") === ["서연이", "정래현"].sort().join(","),
    JSON.stringify(one.participants),
  );
  check("mode === 'one_on_one'", one.mode === "one_on_one", one.mode);
  const firstYear = new Date(one.messages[0].ts).getFullYear();
  check("first message timestamp is a real 2024 date", firstYear === 2024, `year=${firstYear}`);
  console.log("   first 5 messages:");
  showMsgs(one, 5);

  // --- big group txt ------------------------------------------------------
  console.log("\n=== KakaoTalkChats.txt (Android EN, big group) ===");
  const rawBig = readFileSync(resolve(ROOT, BIG_NAME), "utf8");
  const norm = normalizeTxt(rawBig);
  const locale = detectTxtLocale(norm);
  const t0 = performance.now();
  const { result: big, diag } = parseTxt(norm, locale);
  const ms = performance.now() - t0;
  check("format === 'android'", big.format === "android", big.format);
  check("mode === 'group'", big.mode === "group", `participants=${big.participants.length}`);
  check(
    "participants include the 5 names",
    FIVE.every((n) => big.participants.includes(n)),
    JSON.stringify(big.participants),
  );
  check("BOM stripped + U+202F normalized (match rate > 95%)", diag.matchRate > 0.95);
  console.log(
    `     diag: matched=${diag.matched} system=${diag.system} dividers=${diag.dividers} ` +
      `continuations=${diag.continuations} contentLines=${diag.contentLines} ` +
      `matchRate=${(diag.matchRate * 100).toFixed(2)}%`,
  );
  console.log(`     parsed ${big.messages.length} messages in ${ms.toFixed(1)} ms`);
  console.log(
    `     raw U+202F present in source: ${rawBig.includes("\u202f")} (proves normalization needed)`,
  );

  // --- stats perf on the big group file -----------------------------------
  const sg0 = performance.now();
  const bigStats = computeDerivedStats(big);
  const sgMs = performance.now() - sg0;
  check("big-file stats finish fast", sgMs < 3000, `${sgMs.toFixed(1)} ms`);
  console.log(
    `     group stats: people=${bigStats.perPerson.length} sessions=${bigStats.sessions.length} ` +
      `days=${bigStats.density.length} questionIgnoreRate=${(bigStats.questionIgnoreRate * 100).toFixed(1)}% ` +
      `in ${sgMs.toFixed(1)} ms`,
  );

  // --- stats on the 1:1 ---------------------------------------------------
  console.log("\n=== computeDerivedStats(1:1) ===");
  const stats = computeDerivedStats(one, "정래현");
  console.log("   perPerson medians / volume:");
  for (const p of stats.perPerson) {
    console.log(
      `     ${p.name}: msgs=${p.msgCount} avgLen=${p.avgLen.toFixed(1)} ` +
        `medianReplySec=${p.medianReplySec} laughRate=${(p.laughRate * 100).toFixed(0)}% ` +
        `questionRate=${(p.questionRate * 100).toFixed(0)}% init=${p.initiationCount} ` +
        `activeHours=[${p.activeHours.join(",")}]`,
    );
  }
  check("perPerson has 2 entries", stats.perPerson.length === 2);
  check("sessions produced", stats.sessions.length > 0, `#sessions=${stats.sessions.length}`);
  check("density non-empty", stats.density.length > 0, `days=${stats.density.length}`);
  check("latencyTrend non-empty", stats.latencyTrend.length > 0, `weeks=${stats.latencyTrend.length}`);
  console.log(
    `   #sessions=${stats.sessions.length}  questionIgnoreRate=${(stats.questionIgnoreRate * 100).toFixed(1)}%  ` +
      `doubleTexting=${JSON.stringify(stats.doubleTextingByPerson)}`,
  );
  console.log("   top-5 sessions by riskScore:");
  [...stats.sessions]
    .sort((x, y) => y.riskScore - x.riskScore)
    .slice(0, 5)
    .forEach((s) =>
      console.log(`     risk=${s.riskScore}  ${s.label}  msgs=${s.msgCount}  idx=[${s.startIdx}..${s.endIdx}]`),
    );

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
  if (failures > 0) process.exit(1);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
