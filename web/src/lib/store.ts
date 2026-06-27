import { del, get, set } from "idb-keyval";
import type { AnalysisIndexEntry, StoredAnalysis } from "@/lib/types";

/**
 * IndexedDB persistence via idb-keyval. Local-only — nothing here ever touches a
 * server. See PRD §8.
 *   `analysis:{id}` -> StoredAnalysis
 *   `index`         -> AnalysisIndexEntry[]
 */

const INDEX_KEY = "index";
const analysisKey = (id: string) => `analysis:${id}`;

function toEntry(a: StoredAnalysis): AnalysisIndexEntry {
  return {
    id: a.id,
    title: a.title,
    createdAt: a.createdAt,
    mode: a.mode,
    me: a.me,
  };
}

/** Persist an analysis and upsert the index. Returns the stored record (id filled). */
export async function saveAnalysis(a: StoredAnalysis): Promise<StoredAnalysis> {
  const id = a.id || crypto.randomUUID();
  const record: StoredAnalysis = {
    ...a,
    id,
    createdAt: a.createdAt || Date.now(),
  };

  await set(analysisKey(id), record);

  const index = (await get<AnalysisIndexEntry[]>(INDEX_KEY)) ?? [];
  const next = [toEntry(record), ...index.filter((e) => e.id !== id)].sort(
    (x, y) => y.createdAt - x.createdAt,
  );
  await set(INDEX_KEY, next);

  return record;
}

export async function loadAnalysis(
  id: string,
): Promise<StoredAnalysis | undefined> {
  return get<StoredAnalysis>(analysisKey(id));
}

/** All saved analyses, newest first. */
export async function listAnalyses(): Promise<AnalysisIndexEntry[]> {
  const index = (await get<AnalysisIndexEntry[]>(INDEX_KEY)) ?? [];
  return [...index].sort((x, y) => y.createdAt - x.createdAt);
}

export async function deleteAnalysis(id: string): Promise<void> {
  await del(analysisKey(id));
  const index = (await get<AnalysisIndexEntry[]>(INDEX_KEY)) ?? [];
  await set(
    INDEX_KEY,
    index.filter((e) => e.id !== id),
  );
}
