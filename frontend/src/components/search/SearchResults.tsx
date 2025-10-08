import { useFileStore } from '../../store/fileStore';
import type { SearchResult } from '../../services/searchService';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  onClose?: () => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  query,
  onClose,
}) => {
  const { openFile } = useFileStore();

  const handleResultClick = async (path: string) => {
    await openFile(path);
    onClose?.();
  };

  const highlightQuery = (text: string, query: string): React.ReactNode => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-800 text-gray-900 dark:text-gray-100"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="search-results absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
      {results.map((result) => (
        <div
          key={result.path}
          onClick={() => handleResultClick(result.path)}
          className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
        >
          <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
            {highlightQuery(result.name, query)}
          </div>
          {result.contexts.length > 0 && (
            <div className="space-y-1">
              {result.contexts.map((context, idx) => (
                <div
                  key={idx}
                  className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2"
                >
                  {highlightQuery(context, query)}
                </div>
              ))}
            </div>
          )}
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {result.path}
          </div>
        </div>
      ))}
    </div>
  );
};
