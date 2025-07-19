import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Plus, LogOut, Search, BookOpen } from 'lucide-react';
import Auth from './components/Auth';
import NotesList from './components/NotesList';
import NoteEditor from './components/NoteEditor';
import Dashboard from './components/Dashboard';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [editNote, setEditNote] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [activeView, setActiveView] = useState('notes');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchNotes();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [token, search]);

  async function fetchNotes() {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5050/api/notes?search=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
        if (data.length && !selectedId) setSelectedId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(note) {
    const method = note.id ? 'PUT' : 'POST';
    const url = note.id ? `http://localhost:5050/api/notes/${note.id}` : 'http://localhost:5050/api/notes';
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(note),
      });
      if (res.ok) {
        await fetchNotes();
        setEditNote(null);
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  }

  async function handleDelete(id) {
    try {
      await fetch(`http://localhost:5050/api/notes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedId(null);
      await fetchNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  }

  function handleLogout() {
    setToken(null);
    setNotes([]);
    setSelected