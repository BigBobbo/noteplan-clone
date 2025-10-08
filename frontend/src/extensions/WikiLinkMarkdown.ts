/**
 * Custom markdown serializer that preserves wiki links
 * This prevents tiptap-markdown from escaping [[ and ]] brackets
 */
export const wikiLinkMarkdownTransformer = {
  /**
   * Before the content is parsed, preserve wiki links by temporarily replacing them
   */
  preProcess: (markdown: string): string => {
    console.log('[WikiLinkTransformer] preProcess input:', markdown.substring(0, 200));

    // Remove ALL escape characters from wiki links
    let processed = markdown.replace(/\\\[\\\[/g, '[[').replace(/\\\]\\\]/g, ']]');

    console.log('[WikiLinkTransformer] preProcess output:', processed.substring(0, 200));
    return processed;
  },

  /**
   * After the content is serialized, ensure wiki links aren't escaped
   */
  postProcess: (markdown: string): string => {
    console.log('[WikiLinkTransformer] postProcess input:', markdown.substring(0, 200));

    // Remove escape characters from wiki links
    let processed = markdown.replace(/\\\[\\\[/g, '[[').replace(/\\\]\\\]/g, ']]');

    console.log('[WikiLinkTransformer] postProcess output:', processed.substring(0, 200));
    return processed;
  },
};

