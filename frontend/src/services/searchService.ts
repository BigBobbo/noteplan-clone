import FlexSearch from 'flexsearch';

export interface SearchResult {
  path: string;
  name: string;
  score: number;
  contexts: string[];
}

export class SearchService {
  private index: any;
  private fileMap: Map<number, { path: string; name: string; content: string }>;
  private idCounter: number;

  constructor() {
    this.index = new FlexSearch.Index({
      tokenize: 'forward',
      cache: true,
    });
    this.fileMap = new Map();
    this.idCounter = 0;
  }

  /**
   * Index multiple files at once
   */
  async indexFiles(
    files: Array<{ path: string; name: string; content: string }>
  ): Promise<void> {
    this.clear();

    files.forEach((file) => {
      const id = this.idCounter++;
      this.fileMap.set(id, file);
      this.index.add(id, `${file.name} ${file.content}`);
    });
  }

  /**
   * Add or update a single file in the index
   */
  async indexFile(file: {
    path: string;
    name: string;
    content: string;
  }): Promise<void> {
    // Find existing entry
    let existingId: number | null = null;
    for (const [id, f] of this.fileMap.entries()) {
      if (f.path === file.path) {
        existingId = id;
        break;
      }
    }

    if (existingId !== null) {
      // Update existing
      this.index.update(existingId, `${file.name} ${file.content}`);
      this.fileMap.set(existingId, file);
    } else {
      // Add new
      const id = this.idCounter++;
      this.fileMap.set(id, file);
      this.index.add(id, `${file.name} ${file.content}`);
    }
  }

  /**
   * Remove a file from the index
   */
  async removeFile(path: string): Promise<void> {
    for (const [id, file] of this.fileMap.entries()) {
      if (file.path === path) {
        this.index.remove(id);
        this.fileMap.delete(id);
        break;
      }
    }
  }

  /**
   * Search for files matching query
   */
  async search(query: string, limit = 50): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    const results = await this.index.search(query, { limit });
    const searchResults: SearchResult[] = [];

    for (const id of results as number[]) {
      const file = this.fileMap.get(id);
      if (file) {
        searchResults.push({
          path: file.path,
          name: file.name,
          score: 1, // FlexSearch doesn't provide scores in this mode
          contexts: this.extractContexts(file.content, query),
        });
      }
    }

    return searchResults;
  }

  /**
   * Extract context snippets around query matches
   */
  private extractContexts(
    content: string,
    query: string,
    radius = 50
  ): string[] {
    const regex = new RegExp(query, 'gi');
    const contexts: string[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      const start = Math.max(0, match.index - radius);
      const end = Math.min(content.length, match.index + query.length + radius);
      let context = content.substring(start, end);

      // Add ellipsis
      if (start > 0) context = '...' + context;
      if (end < content.length) context = context + '...';

      contexts.push(context);

      if (contexts.length >= 3) break; // Limit to 3 contexts per file
    }

    return contexts;
  }

  /**
   * Clear all indexed files
   */
  clear(): void {
    this.fileMap.clear();
    this.idCounter = 0;
    // Recreate index
    this.index = new FlexSearch.Index({
      tokenize: 'forward',
      cache: true,
    });
  }
}

// Singleton instance
export const searchService = new SearchService();
