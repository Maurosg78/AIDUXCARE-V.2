#!/usr/bin/env -S tsx
/**
 * Aidux North — new-thread
 * Usage: pnpm north:new-thread "Threads: concurrent rendering" [slug]
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const FRONT = `---\nMarket: CA\nLanguage: en-CA\n---\n\n`;
const NORTH_DIR = "docs/north";
const INDEX_MD = path.join(NORTH_DIR, "INDEX.md");
const REDIRECTS = path.join(NORTH_DIR, "_redirects");

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function ensureDir(p: string) { await fs.mkdir(p, { recursive: true }); }
async function readIfExists(p: string){ try { return await fs.readFile(p,"utf8"); } catch { return ""; } }
async function writeFileIfChanged(p: string, content: string) {
  const current = await readIfExists(p);
  if (current !== content) { await ensureDir(path.dirname(p)); await fs.writeFile(p, content, "utf8"); }
}
async function appendUniqueLine(p: string, line: string) {
  const current = await readIfExists(p);
  const lines = current ? current.split(/\r?\n/) : [];
  if (!lines.includes(line)) {
    lines.push(line);
    const final = lines.join("\n").replace(/\n+$/,"") + "\n";
    await ensureDir(path.dirname(p));
    await fs.writeFile(p, final, "utf8");
  }
}
async function upsertIndexLink(title: string, relPath: string) {
  const header = `${FRONT}# Aidux North — INDEX\n\n`;
  let body = await readIfExists(INDEX_MD);
  if (!body) { await writeFileIfChanged(INDEX_MD, `${header}- [${title}](${relPath})\n`); return; }
  if (!/^---\nMarket: CA\nLanguage: en-CA\n---/m.test(body)) {
    const links = body.split("\n").filter(l => l.trim().startsWith("- ["));
    body = header + (links.length ? links.join("\n") + "\n" : "");
  }
  const link = `- [${title}](${relPath})`;
  if (!body.includes(link)) { if (!body.endsWith("\n")) body += "\n"; body += link + "\n"; }
  await fs.writeFile(INDEX_MD, body.replace(/\n*$/,"")+"\n","utf8");
}
async function ensureRedirects() {
  await ensureDir(NORTH_DIR);
  await appendUniqueLine(REDIRECTS, "/README_AIDUX_NORTH /docs/north/threads/README");
  await appendUniqueLine(REDIRECTS, "/README_AIDUX_NORTH.md /docs/north/threads/README.md");
}
async function main() {
  const [,, rawTitle, rawSlug] = process.argv;
  if (!rawTitle) { console.error('Usage: pnpm north:new-thread "<Title>" [slug]'); process.exit(1); }
  const title = rawTitle.trim();
  const slug = (rawSlug?.trim()) || slugify(title);
  const threadDir = path.join(NORTH_DIR, slug);
  const readme = path.join(threadDir, "README.md");
  const content = `${FRONT}# ${title}\n\n`;
  await ensureDir(threadDir);
  await writeFileIfChanged(readme, content);
  await upsertIndexLink(title, `./${slug}/README.md`);
  await ensureRedirects();
  console.log(`✓ Created/updated: ${readme}`);
  console.log(`✓ Indexed at: ${INDEX_MD}`);
  console.log(`✓ Redirects ensured at: ${REDIRECTS}`);
}
main().catch((err) => { console.error(err); process.exit(1); });
