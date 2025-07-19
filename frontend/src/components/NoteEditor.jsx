import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Globe, Lock, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function NoteEditor({ note, onSave, onChange, onCancel }) {
  const [editNote, setEditNote] = useState(note || { title: '', content: '', isPublic: false });
  const [isPreview, setIsPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const newNote = note || { title: '', content: '', isPublic: false };
    setEditNote(newNote);
    setHasChanges(false);
  }, [note]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    const updatedNote = { ...editNote, [name]: type === 'checkbox' ? checked : value };
    setEditNote(updatedNote);
    setHasChanges(true);
    if (onChange) onChange(updatedNote);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!editNote.title.trim() || !editNote.content.trim()) {
      alert('Please fill in both title and content');
      return;
    }
    
    setSaving(true);
    try {
      await onSave(editNote);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (hasChanges && !window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
      return;
    }
    if (onCancel) onCancel();
  }

  const isNewNote = !note?.id;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/20 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {isNewNote ? 'Create New Note' : 'Edit Note'}
          </h2>
          {hasChanges && (
            <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-full">
              Unsaved changes
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Preview Toggle */}
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isPreview
                ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400'
                : 'bg-white/20 dark:bg-black/20 text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-black/30'
            }`}
          >
            <Eye className="h-4 w-4 mr-1 inline" />
            {isPreview ? 'Edit' : 'Preview'}
          </button>
          
          {/* Cancel Button */}
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="p-2 rounded-lg bg-gray-500/20 hover:bg-gray-500/30 text-gray-600 dark:text-gray-400 transition-all"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="flex-1 flex flex-col space-y-4">
        {/* Title Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Title
          </label>
          <input
            name="title"
            value={editNote.title}
            onChange={handleChange}
            placeholder="Enter note title..."
            required
            className="w-full px-4 py-3 bg-white/30 dark:bg-slate-800/50 border border-emerald-200/50 dark:border-slate-600 rounded-lg text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Content
          </label>
          
          {isPreview ? (
            /* Preview Mode */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 p-4 bg-white/20 dark:bg-black/20 border border-white/30 dark:border-gray-600 rounded-lg overflow-y-auto"
            >
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{editNote.content || 'Nothing to preview...'}</ReactMarkdown>
              </div>
            </motion.div>
          ) : (
            /* Edit Mode */
            <motion.textarea
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              name="content"
              value={editNote.content}
              onChange={handleChange}
              placeholder="Write your note here... (Markdown supported)"
              required
              className="flex-1 resize-none px-4 py-3 bg-white/20 dark:bg-black/20 border border-white/30 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-mono text-sm leading-relaxed"
            />
          )}
        </div>

        {/* Privacy Toggle */}
        <div className="flex items-center justify-between p-4 bg-white/10 dark:bg-black/10 rounded-lg border border-white/20 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {editNote.isPublic ? (
              <Globe className="h-5 w-5 text-green-500" />
            ) : (
              <Lock className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                {editNote.isPublic ? 'Public Note' : 'Private Note'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {editNote.isPublic 
                  ? 'This note can be viewed by others'
                  : 'Only you can see this note'
                }
              </p>
            </div>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="isPublic"
              checked={editNote.isPublic}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="submit"
            disabled={saving || (!hasChanges && !isNewNote)}
            className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save Note'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default NoteEditor;
