import { useEffect, useState } from 'react';
import { useFileStore } from '../store/fileStore';
import { useLinkStore } from '../store/linkStore';
import {
  parseWikiLinks,
  resolveLink,
  extractContext,
  type Backlink,
} from '../services/linkService';
import { api } from '../services/api';

export const useLinks = () => {
  const { files, currentFile } = useFileStore();
  const { backlinks, setBacklinks } = useLinkStore();
  const [loading, setLoading] = useState(false);

  // Update backlinks when current file changes
  useEffect(() => {
    if (!currentFile) {
      setBacklinks([]);
      return;
    }

    const findBacklinks = async () => {
      setLoading(true);
      try {
        const foundBacklinks: Backlink[] = [];
        const currentFileName = currentFile.metadata.name.replace('.txt', '');

        // Load all files and check for links to current file
        for (const file of files) {
          try {
            const fileData = await api.getFile(file.path);
            const links = parseWikiLinks(fileData.content, file.path);

            // Check if any link points to current file
            for (const link of links) {
              if (
                link.target === currentFileName ||
                link.target === currentFile.metadata.name ||
                `${link.target}.txt` === currentFile.metadata.name
              ) {
                foundBacklinks.push({
                  source: file.path,
                  sourceName: file.name,
                  target: currentFile.metadata.path,
                  line: link.line,
                  context: extractContext(fileData.content, link.line),
                });
              }
            }
          } catch (error) {
            console.error(`Error loading file ${file.path}:`, error);
          }
        }

        setBacklinks(foundBacklinks);
      } catch (error) {
        console.error('Error finding backlinks:', error);
        setBacklinks([]);
      } finally {
        setLoading(false);
      }
    };

    findBacklinks();
  }, [currentFile, files, setBacklinks]);

  const getLinksInCurrentFile = () => {
    if (!currentFile) return [];
    return parseWikiLinks(currentFile.content, currentFile.metadata.path);
  };

  const navigateToLink = async (linkTarget: string) => {
    const targetPath = resolveLink(linkTarget, files);
    if (targetPath) {
      const { openFile } = useFileStore.getState();
      await openFile(targetPath);
    }
  };

  return {
    backlinks,
    links: getLinksInCurrentFile(),
    navigateToLink,
    loading,
  };
};
