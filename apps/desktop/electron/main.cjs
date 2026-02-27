const { app, BrowserWindow, ipcMain } = require("electron");
const { randomUUID } = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const VAULT_DIR_NAME = "vault";
const VAULT_INDEX_NAME = ".vault-index.json";

function vaultRootPath() {
  return path.join(app.getPath("userData"), VAULT_DIR_NAME);
}

function vaultIndexPath() {
  return path.join(vaultRootPath(), VAULT_INDEX_NAME);
}

function isObject(value) {
  return Boolean(value) && typeof value === "object";
}

function normalizeSegment(segment) {
  return segment.replace(/[<>:"|?*\u0000-\u001F]/g, "-").replace(/\s+/g, " ").trim();
}

function sanitizeNotePath(input) {
  const normalized = typeof input === "string" ? input : "";
  const segments = normalized
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .filter((segment) => segment !== "." && segment !== "..")
    .map(normalizeSegment)
    .filter(Boolean);

  let fileName = segments.pop() || "untitled.md";
  if (!fileName.toLowerCase().endsWith(".md")) {
    fileName = `${fileName}.md`;
  }

  return [...segments, fileName].join("/");
}

function sanitizeAttachmentName(input) {
  const raw = typeof input === "string" ? input : "";
  const baseName = path.basename(raw).replace(/[\\/]/g, "");
  const ext = path.extname(baseName);
  const stem = ext ? baseName.slice(0, -ext.length) : baseName;
  const normalizedStem = normalizeSegment(stem) || "attachment";
  const normalizedExt = ext ? normalizeSegment(ext) : "";
  return `${normalizedStem}${normalizedExt}`;
}

function uniqueRelativePath(basePath, used) {
  const ext = path.extname(basePath) || ".md";
  const stem = basePath.slice(0, -ext.length);
  let candidate = basePath;
  let counter = 2;

  while (used.has(candidate.toLowerCase())) {
    candidate = `${stem} ${counter}${ext}`;
    counter += 1;
  }

  used.add(candidate.toLowerCase());
  return candidate;
}

async function uniqueFileNameInDir(dirPath, fileName) {
  const ext = path.extname(fileName);
  const stem = ext ? fileName.slice(0, -ext.length) : fileName;
  let candidate = fileName;
  let counter = 2;

  while (await pathExists(path.join(dirPath, candidate))) {
    candidate = `${stem} ${counter}${ext}`;
    counter += 1;
  }

  return candidate;
}

function parseTitleAndSnippet(markdown) {
  const normalized = typeof markdown === "string" ? markdown.replace(/\r\n/g, "\n") : "";
  const titleMatch = normalized.match(/^#\s+(.*)$/m);
  const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : "Untitled";
  const snippet = normalized
    .replace(/^---[\s\S]*?---\n?/m, "")
    .replace(/^#\s+.*$/m, "")
    .replace(/[#>*`\-\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  return { title, snippet };
}

function extractTags(markdown) {
  const tags = new Set();
  for (const match of markdown.matchAll(/(^|\s)#([a-zA-Z0-9/_-]+)/g)) {
    if (match[2]) {
      tags.add(match[2].toLowerCase());
    }
  }
  return [...tags];
}

function extractWikilinks(markdown) {
  const links = new Set();
  for (const match of markdown.matchAll(/\[\[([^\]]+)\]\]/g)) {
    if (match[1]) {
      links.add(match[1].trim());
    }
  }
  return [...links];
}

function notebookFromPath(relativePath, fallback) {
  if (typeof fallback === "string" && fallback.trim()) {
    return fallback.trim();
  }
  const first = relativePath.split("/")[0];
  return first || "Inbox";
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function ensureParentDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function readVaultIndex() {
  try {
    const raw = await fs.readFile(vaultIndexPath(), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return [];
    }
    console.error("Failed to read vault index", error);
    return [];
  }
}

async function writeVaultIndex(entries) {
  await ensureParentDir(vaultIndexPath());
  await fs.writeFile(vaultIndexPath(), JSON.stringify(entries, null, 2), "utf8");
}

async function walkMarkdownFiles(rootDir, currentDir = rootDir) {
  const results = [];
  let entries = [];

  try {
    entries = await fs.readdir(currentDir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const absolute = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      const nested = await walkMarkdownFiles(rootDir, absolute);
      results.push(...nested);
      continue;
    }

    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".md")) {
      continue;
    }

    const relative = path.relative(rootDir, absolute).split(path.sep).join("/");
    results.push(relative);
  }

  return results;
}

async function hydrateFromIndex(rootDir, indexEntries) {
  const hydrated = [];

  for (const rawEntry of indexEntries) {
    if (!isObject(rawEntry)) {
      continue;
    }

    const relativePath = sanitizeNotePath(rawEntry.path);
    if (!relativePath) {
      continue;
    }

    const absolutePath = path.join(rootDir, relativePath);
    if (!(await pathExists(absolutePath))) {
      continue;
    }

    let markdown = "# Untitled\n\n";
    try {
      markdown = await fs.readFile(absolutePath, "utf8");
    } catch {
      continue;
    }

    const parsed = parseTitleAndSnippet(markdown);
    const now = new Date().toISOString();

    hydrated.push({
      id: typeof rawEntry.id === "string" ? rawEntry.id : randomUUID(),
      path: relativePath,
      title: typeof rawEntry.title === "string" && rawEntry.title.trim() ? rawEntry.title : parsed.title,
      snippet: typeof rawEntry.snippet === "string" ? rawEntry.snippet : parsed.snippet,
      tags: Array.isArray(rawEntry.tags) ? rawEntry.tags.filter((tag) => typeof tag === "string") : extractTags(markdown),
      linksOut: Array.isArray(rawEntry.linksOut)
        ? rawEntry.linksOut.filter((link) => typeof link === "string")
        : extractWikilinks(markdown),
      createdAt: typeof rawEntry.createdAt === "string" ? rawEntry.createdAt : now,
      updatedAt: typeof rawEntry.updatedAt === "string" ? rawEntry.updatedAt : now,
      notebook: notebookFromPath(relativePath, rawEntry.notebook),
      isTemplate: Boolean(rawEntry.isTemplate),
      markdown
    });
  }

  return hydrated;
}

async function hydrateFromMarkdownFiles(rootDir) {
  const files = await walkMarkdownFiles(rootDir);
  const notes = [];

  for (const relativePath of files) {
    const absolutePath = path.join(rootDir, relativePath);

    let markdown = "# Untitled\n\n";
    let stats;
    try {
      const [raw, statInfo] = await Promise.all([fs.readFile(absolutePath, "utf8"), fs.stat(absolutePath)]);
      markdown = raw;
      stats = statInfo;
    } catch {
      continue;
    }

    const parsed = parseTitleAndSnippet(markdown);
    notes.push({
      id: randomUUID(),
      path: relativePath,
      title: parsed.title,
      snippet: parsed.snippet,
      tags: extractTags(markdown),
      linksOut: extractWikilinks(markdown),
      createdAt: stats.birthtime?.toISOString?.() || new Date().toISOString(),
      updatedAt: stats.mtime?.toISOString?.() || new Date().toISOString(),
      notebook: notebookFromPath(relativePath),
      isTemplate: false,
      markdown
    });
  }

  return notes;
}

async function loadVaultNotes() {
  const rootDir = vaultRootPath();
  await fs.mkdir(rootDir, { recursive: true });

  const indexEntries = await readVaultIndex();
  if (indexEntries.length > 0) {
    const fromIndex = await hydrateFromIndex(rootDir, indexEntries);
    if (fromIndex.length > 0) {
      return fromIndex;
    }
  }

  const fromMarkdown = await hydrateFromMarkdownFiles(rootDir);
  if (fromMarkdown.length > 0) {
    return fromMarkdown;
  }

  return null;
}

async function pruneEmptyDirs(startDir, stopDir) {
  let current = startDir;

  while (current !== stopDir) {
    let items = [];

    try {
      items = await fs.readdir(current);
    } catch {
      return;
    }

    if (items.length > 0) {
      return;
    }

    await fs.rmdir(current);
    current = path.dirname(current);
  }
}

async function saveVaultNotes(payload) {
  if (!Array.isArray(payload)) {
    return false;
  }

  const rootDir = vaultRootPath();
  await fs.mkdir(rootDir, { recursive: true });

  const previousIndex = await readVaultIndex();
  const previousByLower = new Map();
  for (const entry of previousIndex) {
    if (!isObject(entry)) {
      continue;
    }
    const relative = sanitizeNotePath(entry.path);
    if (!relative) {
      continue;
    }
    previousByLower.set(relative.toLowerCase(), relative);
  }
  const previousPaths = new Set(previousByLower.keys());

  const usedPaths = new Set();
  const nextIndex = [];

  for (const rawNote of payload) {
    if (!isObject(rawNote)) {
      continue;
    }

    const sourcePath = sanitizeNotePath(rawNote.path);
    if (!sourcePath) {
      continue;
    }

    const relativePath = uniqueRelativePath(sourcePath, usedPaths);
    const absolutePath = path.join(rootDir, relativePath);
    const markdown = typeof rawNote.markdown === "string" ? rawNote.markdown : "# Untitled\n\n";

    await ensureParentDir(absolutePath);
    await fs.writeFile(absolutePath, markdown, "utf8");

    const parsed = parseTitleAndSnippet(markdown);
    const now = new Date().toISOString();

    nextIndex.push({
      id: typeof rawNote.id === "string" ? rawNote.id : randomUUID(),
      path: relativePath,
      title: typeof rawNote.title === "string" && rawNote.title.trim() ? rawNote.title : parsed.title,
      snippet: typeof rawNote.snippet === "string" ? rawNote.snippet : parsed.snippet,
      tags: Array.isArray(rawNote.tags)
        ? rawNote.tags.filter((tag) => typeof tag === "string")
        : extractTags(markdown),
      linksOut: Array.isArray(rawNote.linksOut)
        ? rawNote.linksOut.filter((link) => typeof link === "string")
        : extractWikilinks(markdown),
      createdAt: typeof rawNote.createdAt === "string" ? rawNote.createdAt : now,
      updatedAt: typeof rawNote.updatedAt === "string" ? rawNote.updatedAt : now,
      notebook: notebookFromPath(relativePath, rawNote.notebook),
      isTemplate: Boolean(rawNote.isTemplate)
    });
  }

  await writeVaultIndex(nextIndex);

  const nextPaths = new Set(nextIndex.map((entry) => entry.path.toLowerCase()));
  const removed = [...previousPaths].filter((entry) => !nextPaths.has(entry));

  for (const removedPath of removed) {
    const originalRelative = previousByLower.get(removedPath) || removedPath;
    const absolutePath = path.join(rootDir, originalRelative);
    try {
      await fs.rm(absolutePath, { force: true });
      await pruneEmptyDirs(path.dirname(absolutePath), rootDir);
    } catch {
      // Ignore cleanup failures.
    }
  }

  return true;
}

async function saveVaultAttachment(payload) {
  if (!isObject(payload)) {
    return null;
  }

  const notePath = sanitizeNotePath(payload.notePath);
  if (!notePath) {
    return null;
  }

  const base64 = typeof payload.base64 === "string" ? payload.base64 : "";
  if (!base64.trim()) {
    return null;
  }

  const rawName = typeof payload.fileName === "string" ? payload.fileName : "attachment.bin";
  const fileName = sanitizeAttachmentName(rawName);
  const rootDir = vaultRootPath();
  const noteDir = path.posix.dirname(notePath);
  const attachmentsDirRelative =
    noteDir === "." ? "attachments" : path.posix.join(noteDir, "attachments");
  const attachmentsDirAbsolute = path.join(rootDir, ...attachmentsDirRelative.split("/"));

  await fs.mkdir(attachmentsDirAbsolute, { recursive: true });

  const uniqueFileName = await uniqueFileNameInDir(attachmentsDirAbsolute, fileName);
  const attachmentRelativePath = path.posix.join(attachmentsDirRelative, uniqueFileName);
  const attachmentAbsolutePath = path.join(rootDir, ...attachmentRelativePath.split("/"));
  const buffer = Buffer.from(base64, "base64");

  await fs.writeFile(attachmentAbsolutePath, buffer);

  const relativeFromNote = path.posix.relative(
    noteDir === "." ? "" : noteDir,
    attachmentRelativePath
  );

  return {
    relativePath: relativeFromNote.startsWith(".") ? relativeFromNote : `./${relativeFromNote}`,
    storedPath: attachmentRelativePath,
    sizeBytes: buffer.length
  };
}

function isExternalReference(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }
  if (trimmed.startsWith("#")) {
    return true;
  }
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
}

function normalizeLinkTarget(value) {
  return value.trim().replace(/^<|>$/g, "");
}

async function cloneAttachmentLinks(payload) {
  if (!isObject(payload)) {
    return null;
  }

  const sourceNotePath = sanitizeNotePath(payload.sourceNotePath);
  const targetNotePath = sanitizeNotePath(payload.targetNotePath);
  const markdown = typeof payload.markdown === "string" ? payload.markdown : "";

  if (!sourceNotePath || !targetNotePath || !markdown.trim()) {
    return { markdown };
  }

  const rootDir = vaultRootPath();
  const sourceDir = path.posix.dirname(sourceNotePath);
  const targetDir = path.posix.dirname(targetNotePath);
  const targetAttachmentsRelative =
    targetDir === "." ? "attachments" : path.posix.join(targetDir, "attachments");
  const targetAttachmentsAbsolute = path.join(rootDir, ...targetAttachmentsRelative.split("/"));
  await fs.mkdir(targetAttachmentsAbsolute, { recursive: true });

  const copiedMap = new Map();
  const linkPattern = /(!?\[[^\]]*\])\(([^)]+)\)/g;
  const rewritten = [];
  let cursor = 0;
  let match;

  while ((match = linkPattern.exec(markdown)) !== null) {
    const [full, label, rawTarget] = match;
    rewritten.push(markdown.slice(cursor, match.index));
    cursor = match.index + full.length;

    const cleanedTarget = normalizeLinkTarget(rawTarget);
    if (isExternalReference(cleanedTarget)) {
      rewritten.push(full);
      continue;
    }

    const sourceCandidate = cleanedTarget.replace(/^\.\/+/, "");
    const sourceRelative = path.posix.normalize(path.posix.join(sourceDir === "." ? "" : sourceDir, sourceCandidate));
    if (!sourceRelative || sourceRelative.startsWith("..")) {
      rewritten.push(full);
      continue;
    }

    let nextRelative = copiedMap.get(sourceRelative);
    if (!nextRelative) {
      const sourceAbsolute = path.join(rootDir, ...sourceRelative.split("/"));
      if (!(await pathExists(sourceAbsolute))) {
        rewritten.push(full);
        continue;
      }

      const safeName = sanitizeAttachmentName(path.posix.basename(sourceRelative));
      const uniqueName = await uniqueFileNameInDir(targetAttachmentsAbsolute, safeName);
      const targetRelative = path.posix.join(targetAttachmentsRelative, uniqueName);
      const targetAbsolute = path.join(rootDir, ...targetRelative.split("/"));

      await fs.copyFile(sourceAbsolute, targetAbsolute);
      const relativeFromTargetDir = path.posix.relative(targetDir === "." ? "" : targetDir, targetRelative);
      nextRelative = relativeFromTargetDir.startsWith(".") ? relativeFromTargetDir : `./${relativeFromTargetDir}`;
      copiedMap.set(sourceRelative, nextRelative);
    }

    rewritten.push(`${label}(${nextRelative})`);
  }

  rewritten.push(markdown.slice(cursor));
  return { markdown: rewritten.join(""), copied: copiedMap.size };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: "#f4f2ec",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (!app.isPackaged) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  ipcMain.handle("vault:load", async () => {
    try {
      return await loadVaultNotes();
    } catch (error) {
      console.error("Failed to load vault state", error);
      return null;
    }
  });

  ipcMain.handle("vault:save", async (_event, payload) => {
    try {
      return await saveVaultNotes(payload);
    } catch (error) {
      console.error("Failed to save vault state", error);
      return false;
    }
  });

  ipcMain.handle("vault:attach", async (_event, payload) => {
    try {
      return await saveVaultAttachment(payload);
    } catch (error) {
      console.error("Failed to save vault attachment", error);
      return null;
    }
  });

  ipcMain.handle("vault:clone-attachments", async (_event, payload) => {
    try {
      return await cloneAttachmentLinks(payload);
    } catch (error) {
      console.error("Failed to clone note attachments", error);
      return null;
    }
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
