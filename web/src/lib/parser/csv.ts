import Papa from "papaparse";
import type { Msg, ParseResult } from "@/lib/types";
import {
  classifyMedia,
  classifyUrl,
  isStandaloneSystem,
  stripBom,
} from "./detect";

/**
 * macOS CSV export. Header is exactly `Date,User,Message`; Date is
 * `YYYY-MM-DD HH:MM:SS` (24h, no AM/PM). Values are RFC-4180 quoted, so we MUST
 * use papaparse (never regex). Rows whose Date is empty/unparseable are CSV
 * multiline leakage and are merged into the previous message.
 */
type CsvRow = { Date?: string; User?: string; Message?: string };

function parseCsvDate(value: string): number {
  // "2026-03-26 10:23:30" -> local time. ISO-like with a space is interpreted
  // as local; swapping the space for "T" keeps engines consistent.
  return new Date(value.replace(" ", "T")).getTime();
}

export function parseCsv(rawText: string, title: string): ParseResult {
  const text = stripBom(rawText);
  const parsed = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: "greedy",
  });

  const messages: Msg[] = [];
  const participants: string[] = [];
  const seen = new Set<string>();
  const warnings: string[] = [];
  let mergedContinuations = 0;
  let droppedRows = 0;

  for (const row of parsed.data) {
    const dateStr = (row.Date ?? "").trim();
    const messageText = row.Message ?? "";
    const ts = dateStr ? parseCsvDate(dateStr) : Number.NaN;

    if (!dateStr || Number.isNaN(ts)) {
      // Continuation of the previous message (multiline leak) — never a record.
      const prev = messages[messages.length - 1];
      if (prev && messageText) {
        prev.text += "\n" + messageText;
        mergedContinuations++;
      } else {
        droppedRows++;
      }
      continue;
    }

    const sender = (row.User ?? "").trim();
    const isSystem = isStandaloneSystem(messageText) || sender === "";
    const msg: Msg = {
      ts,
      sender,
      text: messageText,
      isSystem,
    };
    if (!isSystem) {
      if (classifyMedia(messageText)) msg.isMedia = true;
      else if (classifyUrl(messageText)) msg.isUrl = true;
      if (!seen.has(sender)) {
        seen.add(sender);
        participants.push(sender);
      }
    }
    messages.push(msg);
  }

  if (mergedContinuations)
    warnings.push(`merged ${mergedContinuations} CSV continuation row(s)`);
  if (droppedRows) warnings.push(`dropped ${droppedRows} unparseable CSV row(s)`);
  if (parsed.errors.length)
    warnings.push(`papaparse reported ${parsed.errors.length} row error(s)`);

  return {
    format: "csv",
    title: title || "대화",
    participants,
    messages,
    mode: participants.length === 2 ? "one_on_one" : "group",
    warnings: warnings.length ? warnings : undefined,
  };
}
