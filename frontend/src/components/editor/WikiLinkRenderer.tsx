import React, { useEffect, useRef } from 'react';
import { useFileStore } from '../../store/fileStore';
import { resolveLink } from '../../services/linkService';

interface WikiLinkRendererProps {
  children: React.ReactNode;
}

export const WikiLinkRenderer: React.FC<WikiLinkRendererProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { files, openFile } = useFileStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('wiki-link')) {
        e.preventDefault();
        const linkTarget = target.getAttribute('data-target');
        if (linkTarget) {
          const resolvedPath = resolveLink(linkTarget, files);
          if (resolvedPath) {
            openFile(resolvedPath);
          }
        }
      }
    };

    containerRef.current.addEventListener('click', handleClick);

    return () => {
      containerRef.current?.removeEventListener('click', handleClick);
    };
  }, [files, openFile]);

  useEffect(() => {
    if (!containerRef.current) return;

    const processLinks = () => {
      const editorContent = containerRef.current?.querySelector('.ProseMirror');
      if (!editorContent) return;

      const walker = document.createTreeWalker(
        editorContent,
        NodeFilter.SHOW_TEXT,
        null
      );

      const nodesToReplace: Array<{ node: Text; parent: Node }> = [];

      let node: Text | null;
      while ((node = walker.nextNode() as Text)) {
        if (node.textContent && /\[\[([^\]|]+)(\|([^\]]+))?\]\]/.test(node.textContent)) {
          nodesToReplace.push({ node, parent: node.parentNode! });
        }
      }

      nodesToReplace.forEach(({ node, parent }) => {
        const text = node.textContent || '';
        const regex = /\[\[([^\]|]+)(\|([^\]]+))?\]\]/g;
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
          // Add text before the link
          if (match.index > lastIndex) {
            fragment.appendChild(
              document.createTextNode(text.substring(lastIndex, match.index))
            );
          }

          // Create wiki link span
          const span = document.createElement('span');
          span.className = 'wiki-link';
          span.textContent = match[3] || match[1]; // Use alias or target
          span.setAttribute('data-target', match[1]);
          span.style.cssText = `
            color: #2563eb;
            cursor: pointer;
            font-weight: 500;
            text-decoration: underline;
            text-decoration-style: dotted;
          `;

          fragment.appendChild(span);
          lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        }

        parent.replaceChild(fragment, node);
      });
    };

    // Process links with a small delay to let TipTap render
    const timer = setTimeout(processLinks, 100);

    // Set up MutationObserver to re-process when content changes
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      setTimeout(processLinks, 100);
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [files, openFile]);

  return <div ref={containerRef} className="h-full">{children}</div>;
};
