export interface SearchableNote {
  id: string;
  title: string;
  snippet: string;
  tags: string[];
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

    const results: SearchResult[] = [];

    for (const [noteId, indexed] of this.notes.entries()) {
      const haystack = `${indexed.note.title} ${indexed.note.snippet} ${indexed.markdown}`.toLowerCase();
      if (!haystack.includes(trimmed)) {
        continue;
      }

      let score = 1;
      if (indexed.note.title.toLowerCase().includes(trimmed)) {
        score += 3;
      }
      if (indexed.note.tags.some((tag) => tag.includes(trimmed))) {
        score += 2;
      }

      results.push({ noteId, score });
    }

    return results.sort((left, right) => right.score - left.score);
  }
}
