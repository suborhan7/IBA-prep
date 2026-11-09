"use client";
import type { Question } from "./types";
import { db } from "./db";

/**
 * Approved AI-generated questions, registered at runtime from the database.
 * Kept separate from the question bank so the app shell doesn't pull the
 * whole bank into every page.
 */
export const CUSTOM = new Map<string, Question>();

export function registerCustom(qs: Question[]) {
  CUSTOM.clear();
  for (const q of qs) CUSTOM.set(q.id, q);
}

/** Make sure approved custom questions are registered (used before restoring a saved session). */
export async function loadCustom() {
  registerCustom(await db.custom.where("status").equals("approved").toArray());
}
