export type MarkdownTableAction = "add-row-after" | "add-column-after" | "delete-table";

export interface MarkdownTableMutationResult {
  changed: boolean;
  markdown: string;
  selectionStart: number;
  selectionEnd: number;
}

interface LineRange {
  text: string;
  start: number;
  end: number;
}

interface ParsedRow {
  kind: "header" | "delimiter" | "body";
  cells: string[];
}

function getLineRanges(markdown: string): LineRange[] {
  const lines: LineRange[] = [];
  let start = 0;
  for (let index = 0; index <= markdown.length; index += 1) {
    if (index === markdown.length || markdown[index] === "\n") {
      lines.push({ text: markdown.slice(start, index), start, end: index });
      start = index + 1;
    }
  }
  return lines;
}

function findLineIndex(lines: LineRange[], cursor: number): number {
  for (let index = 0; index < lines.length; index += 1) {
    if (cursor <= lines[index].end) {
      return index;
    }
  }
  return Math.max(lines.length - 1, 0);
}

function isTableLine(line: string): boolean {
  return line.includes("|");
}

function splitTableCells(line: string): string[] {
  const trimmed = line.trim();
  const withoutLeading = trimmed.replace(/^\|/, "");
  const withoutTrailing = withoutLeading.replace(/\|$/, "");
  return withoutTrailing.split("|").map((cell) => cell.trim());
}

function isDelimiterCell(value: string): boolean {
  return /^:?-{3,}:?$/.test(value.trim());
}

function isDelimiterLine(line: string): boolean {
  const cells = splitTableCells(line);
  return cells.length > 0 && cells.every(isDelimiterCell);
}

function normalizeRows(rows: ParsedRow[]): ParsedRow[] {
  const columnCount = rows.reduce((max, row) => Math.max(max, row.cells.length), 0);
  return rows.map((row) => {
    const next = [...row.cells];
    while (next.length < columnCount) {
      next.push("");
    }
    if (row.kind === "delimiter") {
      return {
        ...row,
        cells: next.map((cell) => (isDelimiterCell(cell) ? cell.trim() : "---"))
      };
    }
    return { ...row, cells: next };
  });
}

function serializeRow(row: ParsedRow): string {
  if (row.kind === "delimiter") {
    return `| ${row.cells.map((cell) => (isDelimiterCell(cell) ? cell.trim() : "---")).join(" | ")} |`;
  }
  return `| ${row.cells.map((cell) => cell.trim()).join(" | ")} |`;
}

function inferColumnIndex(line: string, offsetInLine: number, columnCount: number): number {
  if (columnCount <= 1) {
    return 0;
  }
  const safeOffset = Math.max(0, Math.min(line.length, offsetInLine));
  const before = line.slice(0, safeOffset);
  const pipeCount = (before.match(/\|/g) ?? []).length;
  const leadingPipe = /^\s*\|/.test(line) ? 1 : 0;
  const raw = pipeCount - leadingPipe;
  return Math.max(0, Math.min(columnCount - 1, raw));
}

function computeCellCursorOffset(rows: ParsedRow[], rowIndex: number, columnIndex: number): number {
  let offset = 0;
  for (let index = 0; index < rows.length; index += 1) {
    if (index === rowIndex) {
      const cells = rows[index].cells;
      offset += 2;
      for (let cellIndex = 0; cellIndex < Math.min(columnIndex, cells.length - 1); cellIndex += 1) {
        offset += cells[cellIndex].trim().length + 3;
      }
      return offset;
    }
    offset += serializeRow(rows[index]).length + 1;
  }
  return offset;
}

function detectTableAroundCursor(markdown: string, cursor: number): {
  lines: LineRange[];
  startLine: number;
  endLine: number;
  tableLineIndex: number;
} | null {
  const lines = getLineRanges(markdown);
  if (!lines.length) {
    return null;
  }

  const lineIndex = findLineIndex(lines, cursor);
  if (!isTableLine(lines[lineIndex].text)) {
    return null;
  }

  let startLine = lineIndex;
  while (startLine > 0 && isTableLine(lines[startLine - 1].text)) {
    startLine -= 1;
  }

  let endLine = lineIndex;
  while (endLine + 1 < lines.length && isTableLine(lines[endLine + 1].text)) {
    endLine += 1;
  }

  const tableLines = lines.slice(startLine, endLine + 1).map((line) => line.text);
  if (tableLines.length < 2 || !isDelimiterLine(tableLines[1])) {
    return null;
  }

  return {
    lines,
    startLine,
    endLine,
    tableLineIndex: lineIndex - startLine
  };
}

export function applyMarkdownTableAction(
  markdown: string,
  selectionStart: number,
  selectionEnd: number,
  action: MarkdownTableAction
): MarkdownTableMutationResult {
  const boundedStart = Math.max(0, Math.min(markdown.length, selectionStart));
  const boundedEnd = Math.max(0, Math.min(markdown.length, selectionEnd));
  const cursor = Math.min(boundedStart, boundedEnd);
  const table = detectTableAroundCursor(markdown, cursor);

  if (!table) {
    return {
      changed: false,
      markdown,
      selectionStart: boundedStart,
      selectionEnd: boundedEnd
    };
  }

  const tableLines = table.lines.slice(table.startLine, table.endLine + 1);

  if (action === "delete-table") {
    const removeStart = table.lines[table.startLine].start;
    let removeEnd = table.lines[table.endLine].end;
    if (removeEnd < markdown.length && markdown[removeEnd] === "\n") {
      removeEnd += 1;
    }
    const nextMarkdown = `${markdown.slice(0, removeStart)}${markdown.slice(removeEnd)}`;
    return {
      changed: true,
      markdown: nextMarkdown,
      selectionStart: removeStart,
      selectionEnd: removeStart
    };
  }

  let rows: ParsedRow[] = tableLines.map((line, index) => ({
    kind: index === 0 ? "header" : index === 1 ? "delimiter" : "body",
    cells: splitTableCells(line.text)
  }));
  rows = normalizeRows(rows);

  const columnCount = rows[0]?.cells.length ?? 0;
  if (!columnCount) {
    return {
      changed: false,
      markdown,
      selectionStart: boundedStart,
      selectionEnd: boundedEnd
    };
  }

  const activeLine = tableLines[Math.max(0, Math.min(tableLines.length - 1, table.tableLineIndex))];
  const offsetInLine = cursor - activeLine.start;
  const activeColumn = inferColumnIndex(activeLine.text, offsetInLine, columnCount);

  let targetRow = table.tableLineIndex;
  let targetColumn = activeColumn;

  if (action === "add-row-after") {
    const insertAt = table.tableLineIndex <= 1 ? 2 : table.tableLineIndex + 1;
    const row: ParsedRow = { kind: "body", cells: new Array(columnCount).fill("") };
    rows = [...rows.slice(0, insertAt), row, ...rows.slice(insertAt)];
    targetRow = insertAt;
  } else if (action === "add-column-after") {
    const insertAt = activeColumn + 1;
    rows = rows.map((row) => {
      const nextCells = [...row.cells];
      nextCells.splice(insertAt, 0, row.kind === "delimiter" ? "---" : "");
      return { ...row, cells: nextCells };
    });
    targetColumn = insertAt;
    if (targetRow === 1) {
      targetRow = 0;
    }
  }

  const serializedRows = rows.map(serializeRow);
  const nextTable = serializedRows.join("\n");
  const replaceStart = table.lines[table.startLine].start;
  const replaceEnd = table.lines[table.endLine].end;
  const nextMarkdown = `${markdown.slice(0, replaceStart)}${nextTable}${markdown.slice(replaceEnd)}`;
  const cursorOffset = computeCellCursorOffset(rows, Math.min(targetRow, rows.length - 1), targetColumn);
  const nextCursor = replaceStart + cursorOffset;

  return {
    changed: true,
    markdown: nextMarkdown,
    selectionStart: nextCursor,
    selectionEnd: nextCursor
  };
}
