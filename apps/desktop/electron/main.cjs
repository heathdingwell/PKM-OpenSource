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
      notebook: notebookFromPath(relativePath, rawNote.notebook)
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
