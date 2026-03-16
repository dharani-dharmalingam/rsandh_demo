import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { EmployerContent } from "./types";

/** Directory for reading published content (repo/bundle). */
const CONTENT_DIR = path.join(process.cwd(), "content");

/** In serverless (Vercel, Lambda) the app dir is read-only. Use /tmp for writes. */
function isServerless(): boolean {
  return process.env.VERCEL === "1" || process.cwd().startsWith("/var/task");
}

/** Directory for writing draft/published during extraction. Writable in serverless. */
function getWritableContentDir(): string {
  if (isServerless()) {
    return path.join(os.tmpdir(), "rsandh-content");
  }
  return CONTENT_DIR;
}

/** True when content writes go to /tmp (ephemeral). Caller may return payload in API response. */
export function isContentWrittenToTmp(): boolean {
  return isServerless();
}

function ensureContentDir() {
  const writable = getWritableContentDir();
  if (!fs.existsSync(writable)) {
    fs.mkdirSync(writable, { recursive: true });
  }
}

function publishedPath(slug: string) {
  return path.join(CONTENT_DIR, `${slug}.published.json`);
}

function draftPath(slug: string) {
  return path.join(getWritableContentDir(), `${slug}.draft.json`);
}

function writablePublishedPath(slug: string) {
  return path.join(getWritableContentDir(), `${slug}.published.json`);
}

export function getPublishedContent(slug: string): EmployerContent {
  const filePath = publishedPath(slug);
  if (!fs.existsSync(filePath)) {
    throw new Error(`No published content found for employer: ${slug}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as EmployerContent;
}

export function getDraftContent(slug: string): EmployerContent {
  const draft = draftPath(slug);
  if (fs.existsSync(draft)) {
    const raw = fs.readFileSync(draft, "utf-8");
    return JSON.parse(raw) as EmployerContent;
  }
  return getPublishedContent(slug);
}

export function saveContent(slug: string, data: EmployerContent): void {
  ensureContentDir();
  fs.writeFileSync(draftPath(slug), JSON.stringify(data, null, 2), "utf-8");
}

export function publishContent(slug: string): void {
  const draft = draftPath(slug);
  const published = isServerless()
    ? writablePublishedPath(slug)
    : publishedPath(slug);

  if (fs.existsSync(draft)) {
    fs.copyFileSync(draft, published);
    fs.unlinkSync(draft);
  } else {
    throw new Error(`No draft to publish for employer: ${slug}`);
  }
}

export function hasDraft(slug: string): boolean {
  const draft = draftPath(slug);
  return fs.existsSync(draft);
}

export function listEmployers(): string[] {
  ensureContentDir();
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".published.json"))
    .map((f) => f.replace(".published.json", ""));
}

export function employerExists(slug: string): boolean {
  return fs.existsSync(publishedPath(slug));
}
