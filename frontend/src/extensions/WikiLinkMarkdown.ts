/**
 * Custom markdown transformer for wiki links only
 * Simplified version that doesn't modify task markers or other text
 */
export const wikiLinkMarkdownTransformer = {
  /**
   * Before the content is parsed - only handle wiki links
   */
  preProcess: (markdown: string): string => {
    // Only process wiki links - remove escape characters if any
    // Don't modify tasks, bullets, or any other content
    return markdown.replace(/\\\[\\\[/g, '[[').replace(/\\\]\\\]/g, ']]');
  },

  /**
   * After the content is serialized - only handle wiki links
   */
  postProcess: (markdown: string): string => {
    // Only process wiki links - remove escape characters if any
    // Don't modify tasks, bullets, or any other content
    return markdown.replace(/\\\[\\\[/g, '[[').replace(/\\\]\\\]/g, ']]');
  },
};

