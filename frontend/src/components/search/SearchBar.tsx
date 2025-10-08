import { useState, useEffect, useRef } from 'react';
import { useSearch } from '../../hooks/useSearch';
import { SearchResults } from './SearchResults';

interface SearchBarProps {
  onClose?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { search, results, isSearching, clearResults } = useSearch();

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Debounced search
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        search(query);
        setShowResults(true);
      } else {
        clearResults();
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, search, clearResults]);

  const handleClear = () => {
    setQuery('');
    clearResults();
    setShowResults(false);
    inputRef.current?.focus();
  };

  return (
    <div className="search-container relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes..."
          className="w-full px-4 py-2 pl-10 pr-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
        <div className="absolute left-3 top-2.5 text-gray-400">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {isSearching && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Searching...
          </div>
        </div>
      )}

      {showResults && !isSearching && results.length > 0 && (
        <SearchResults results={results} query={query} onClose={onClose} />
      )}

      {showResults && !isSearching && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No results found for "{query}"
          </div>
        </div>
      )}
    </div>
  );
};
