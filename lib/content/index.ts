import fs from "node:fs";
import path from "node:path";
import type { EmployerContent } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");

function ensureContentDir() {
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }
}

function publishedPath(slug: string) {
  return path.join(CONTENT_DIR, `${slug}.published.json`);
}

function draftPath(slug: string) {
  return path.join(CONTENT_DIR, `${slug}.draft.json`);
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
  const published = publishedPath(slug);

  if (fs.existsSync(draft)) {
    fs.copyFileSync(draft, published);
    fs.unlinkSync(draft);
  } else {
    throw new Error(`No draft to publish for employer: ${slug}`);
  }
}

export function hasDraft(slug: string): boolean {
  return fs.existsSync(draftPath(slug));
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
