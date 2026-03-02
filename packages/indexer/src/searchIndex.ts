export interface SearchableNote {
  id: string;
  title: string;
  snippet: string;
  tags: string[];
  updatedAt?: string;
}

export interface SearchResult {
  noteId: string;
  score: number;
}

interface IndexedNote {
  note: SearchableNote;
  markdown: string;
}

export class SearchIndex {
  private readonly notes = new Map<string, IndexedNote>();

  upsert(note: SearchableNote, markdown: string): void {
    this.notes.set(note.id, { note, markdown });
  }

  search(query: string): SearchResult[] {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return [];
    }

    const tokens = trimmed.split(/\s+/).filter(Boolean);
    if (!tokens.length) {
      return [];
    }

    const scored: Array<{ noteId: string; score: number; updatedAtMs: number }> = [];

    for (const [noteId, indexed] of this.notes.entries()) {
      const title = indexed.note.title.toLowerCase();
      const snippet = indexed.note.snippet.toLowerCase();
      const markdown = indexed.markdown.toLowerCase();
      const haystack = `${title} ${snippet} ${markdown}`;
      if (!tokens.every((token) => haystack.includes(token))) {
        continue;
      }

      let score = 1;
      if (title === trimmed) {
        score += 12;
      } else if (title.startsWith(trimmed)) {
        score += 8;
      } else if (title.includes(trimmed)) {
        score += 4;
      }

      if (snippet.includes(trimmed)) {
        score += 2;
      }
      if (markdown.includes(trimmed)) {
        score += 1;
      }

      for (const token of tokens) {
        if (title.includes(token)) {
          score += 1.5;
        } else if (snippet.includes(token)) {
          score += 0.8;
        } else if (markdown.includes(token)) {
          score += 0.4;
        }
      }

      const tagMatches = indexed.note.tags.reduce((count, tag) => {
        const normalized = tag.toLowerCase();
        return count + (tokens.some((token) => normalized.includes(token)) ? 1 : 0);
      }, 0);
      if (tagMatches) {
        score += tagMatches * 1.2;
      }

      const updatedAtMs = indexed.note.updatedAt ? Date.parse(indexed.note.updatedAt) : Number.NaN;
      scored.push({
        noteId,
        score,
        updatedAtMs: Number.isFinite(updatedAtMs) ? updatedAtMs : 0
      });
    }

    if (!scored.length) {
      return [];
    }

    const recencyOrder = [...scored].sort((left, right) => right.updatedAtMs - left.updatedAtMs);
    const recencyRank = new Map<string, number>(recencyOrder.map((entry, index) => [entry.noteId, index]));
    const recencyWindow = Math.max(scored.length - 1, 1);

    const results = scored.map((entry) => {
      const rank = recencyRank.get(entry.noteId) ?? recencyWindow;
      const recencyBoost = ((recencyWindow - rank) / recencyWindow) * 2;
      return { noteId: entry.noteId, score: entry.score + recencyBoost };
    });

    return results.sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.noteId.localeCompare(right.noteId);
    });
  }
}
