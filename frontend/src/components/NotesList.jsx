import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Globe, Lock, Clock, FileText } from 'lucide-react';

function NotesList({ notes, onSelect, selectedId, onDelete, loading }) {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateContent = (content, maxLength = 100) => {
    if (!content) return 'No content';
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center">
        <FileText className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-2" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No notes found
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
          Create your first note to get started
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <div className="h-full overflow-y-auto space-y-2 pr-2">
        <AnimatePresence>
          {notes.map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                note.id === selectedId
                  ? 'bg-emerald-500/20 border-2 border-emerald-500/50 shadow-lg'
                  : 'bg-white/10 dark:bg-slate-800/10 border border-white/20 dark:border-slate-700 hover:bg-white/20 dark:hover:bg-slate-800/20 hover:border-white/30 dark:hover:border-slate-600'
              }`}
              onClick={() => onSelect(note.id)}
            >
              {/* Note Header */}
              <div className="flex items-start justify-between mb-2">
                <h3 className={`font-medium text-sm line-clamp-1 ${
                  note.id === selectedId
                    ? 'text-emerald-900 dark:text-emerald-100'
                    : 'text-gray-800 dark:text-gray-200'
                }`}>
                  {note.title || 'Untitled Note'}
                </h3>
                
                {/* Privacy Icon */}
                <div className="flex items-center space-x-1 ml-2">
                  {note.isPublic ? (
                    <Globe className="h-3 w-3 text-green-500" title="Public" />
                  ) : (
                    <Lock className="h-3 w-3 text-gray-400" title="Private" />
                  )}
                </div>
              </div>

              {/* Note Preview */}
              <p className={`text-xs mb-3 line-clamp-2 ${
                note.id === selectedId
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {truncateContent(note.content)}
              </p>

              {/* Note Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(note.updatedAt)}</span>
                </div>
                
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this note?')) {
                      onDelete(note.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/20 text-red-500 hover:text-red-600 transition-all duration-200"
                  title="Delete note"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              {/* Selection Indicator */}
              {note.id === selectedId && (
                <motion.div
                  layoutId="selectedNote"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-full"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default NotesList;
