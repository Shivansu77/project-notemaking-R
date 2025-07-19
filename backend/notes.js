// Notes management for Note Taking App
// In-memory notes storage

const { v4: uuidv4 } = require('uuid');

// In-memory notes store
const notes = [];

// Helper function to calculate reading time
function calculateReadingTime(content) {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// List notes for a user with optional search and filtering
async function listNotes(userId, options = {}) {
  try {
    const { search, filter } = options;
    
    let userNotes = notes.filter(note => note.owner === userId && !note.isDeleted);
    
    // Add search functionality
    if (search) {
      const searchLower = search.toLowerCase();
      userNotes = userNotes.filter(note => 
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower) ||
        (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }
    
    // Add filter functionality
    if (filter) {
      switch (filter) {
        case 'public':
          userNotes = userNotes.filter(note => note.isPublic);
          break;
        case 'private':
          userNotes = userNotes.filter(note => !note.isPublic);
          break;
        case 'recent':
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          userNotes = userNotes.filter(note => new Date(note.updatedAt) > weekAgo);
          break;
      }
    }
    
    // Sort by updated time (most recent first)
    userNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    return userNotes;
  } catch (error) {
    console.error('Error listing notes:', error);
    throw new Error('Failed to fetch notes');
  }
}

// Get single note
async function getNote(userId, noteId) {
  try {
    const note = notes.find(note => note.id === noteId && note.owner === userId && !note.isDeleted);
    
    if (note) {
      note.views++;
    }
    
    return note;
  } catch (error) {
    console.error('Error getting note:', error);
    throw new Error('Failed to fetch note');
  }
}

// Create new note
async function createNote(userId, { title, content, isPublic = false, tags = [], category = 'General' }) {
  try {
    const note = {
      id: uuidv4(),
      owner: userId,
      title,
      content,
      isPublic,
      tags,
      category,
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false
    };
    
    notes.push(note);
    return note;
  } catch (error) {
    console.error('Error creating note:', error);
    throw new Error('Failed to create note');
  }
}

// Update note
async function updateNote(userId, noteId, updateData) {
  try {
    const noteIndex = notes.findIndex(note => note.id === noteId && note.owner === userId && !note.isDeleted);
    
    if (noteIndex === -1) {
      return null;
    }
    
    const note = notes[noteIndex];
    
    // Update allowed fields
    const allowedUpdates = ['title', 'content', 'isPublic', 'tags', 'category'];
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        note[field] = updateData[field];
      }
    });
    
    note.updatedAt = new Date();
    
    return note;
  } catch (error) {
    console.error('Error updating note:', error);
    throw new Error('Failed to update note');
  }
}

// Delete note (soft delete)
async function deleteNote(userId, noteId) {
  try {
    const noteIndex = notes.findIndex(note => note.id === noteId && note.owner === userId && !note.isDeleted);
    
    if (noteIndex === -1) {
      return false;
    }
    
    // Soft delete
    notes[noteIndex].isDeleted = true;
    notes[noteIndex].deletedAt = new Date();
    
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw new Error('Failed to delete note');
  }
}

module.exports = {
  listNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  notes, // For testing/debugging only
};
