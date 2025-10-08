import { Mark, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface WikiLinkOptions {
  HTMLAttributes: Record<string, any>;
  onLinkClick?: (target: string) => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    wikiLink: {
      /**
       * Set a wiki link mark
       */
      setWikiLink: (attributes: { target: string; alias?: string }) => ReturnType;
      /**
       * Toggle a wiki link mark
       */
      toggleWikiLink: (attributes: { target: string; alias?: string }) => ReturnType;
      /**
       * Unset a wiki link mark
       */
      unsetWikiLink: () => ReturnType;
    };
  }
}

export const WikiLink = Mark.create<WikiLinkOptions>({
  name: 'wikiLink',

  priority: 1000,

  inclusive: false,

  addOptions() {
    return {
      HTMLAttributes: {},
      onLinkClick: undefined,
    };
  },

  addAttributes() {
    return {
      target: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-target'),
        renderHTML: (attributes) => {
          if (!attributes.target) {
            return {};
          }
          return {
            'data-target': attributes.target,
          };
        },
      },
      alias: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-alias'),
        renderHTML: (attributes) => {
          if (!attributes.alias) {
            return {};
          }
          return {
            'data-alias': attributes.alias,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-wiki-link]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-wiki-link': '',
        class: 'wiki-link',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setWikiLink:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      toggleWikiLink:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
      unsetWikiLink:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey('wikiLink');

    return [
      new Plugin({
        key: pluginKey,
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];
            const doc = state.doc;
            const regex = /\[\[([^\]|]+)(\|([^\]]+))?\]\]/g;

            console.log('[WikiLink] Running decoration scan...');

            doc.descendants((node, pos) => {
              if (!node.isText || !node.text) {
                return;
              }

              const text = node.text;
              console.log('[WikiLink] Scanning text node:', text);
              let match;

              while ((match = regex.exec(text)) !== null) {
                const start = pos + match.index;
                const end = start + match[0].length;
                const target = match[1].trim();
                const alias = match[3]?.trim();

                console.log('[WikiLink] Found link:', { text: match[0], target, alias, start, end });

                decorations.push(
                  Decoration.inline(start, end, {
                    class: 'wiki-link-decoration',
                    'data-target': target,
                    'data-alias': alias || undefined,
                  })
                );
              }
            });

            console.log('[WikiLink] Created decorations:', decorations.length);
            return DecorationSet.create(doc, decorations);
          },
          handleClick: (_view, _pos, event) => {
            const target = event.target as HTMLElement;

            // Check if clicked element is a wiki link decoration
            if (target.classList.contains('wiki-link-decoration')) {
              const linkTarget = target.getAttribute('data-target');

              if (linkTarget && this.options.onLinkClick) {
                event.preventDefault();
                this.options.onLinkClick(linkTarget);
                return true;
              }
            }

            return false;
          },
        },
      }),
    ];
  },
});
