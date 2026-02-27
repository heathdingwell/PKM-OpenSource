export interface NoteRecord {
  id: string;
  path: string;
  title: string;
  snippet: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  linksOut: string[];
}
