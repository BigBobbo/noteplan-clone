import { useLinks } from '../../hooks/useLinks';
import { useFileStore } from '../../store/fileStore';
import { Loading } from '../common/Loading';

export const BacklinkPanel: React.FC = () => {
  const { backlinks, loading } = useLinks();
  const { openFile, currentFile } = useFileStore();

  if (loading) {
    return (
      <div className="p-4">
        <Loading size="sm" text="Finding backlinks..." />
      </div>
    );
  }

  if (!currentFile) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <p className="text-sm">Open a file to see backlinks</p>
      </div>
    );
  }

  if (backlinks.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <p className="text-sm">No backlinks</p>
        <p className="text-xs mt-1">
          Other notes that link to this one will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="backlink-panel">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Linked Mentions ({backlinks.length})
        </h3>
      </div>
      <div className="overflow-y-auto">
        {backlinks.map((link, index) => (
          <div
            key={`${link.source}-${link.line}-${index}`}
            onClick={() => openFile(link.source)}
            className="backlink-item p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-colors"
          >
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              {link.sourceName}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {link.context}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
