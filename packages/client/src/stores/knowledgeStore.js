import { create } from 'zustand';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5554';

const useKnowledgeStore = create((set, get) => ({
  // State
  items: [],
  stats: null,
  searchResults: [],
  loading: false,
  error: null,
  searchQuery: '',

  // Actions
  fetchItems: async (options = {}) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams(options);
      const response = await fetch(`${API_URL}/api/knowledge?${params}`);
      const data = await response.json();
      set({ items: data.items || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const response = await fetch(`${API_URL}/api/knowledge/stats`);
      const data = await response.json();
      set({ stats: data });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  },

  search: async (query, options = {}) => {
    if (!query.trim()) {
      set({ searchResults: [], searchQuery: '' });
      return;
    }

    set({ loading: true, error: null, searchQuery: query });
    try {
      const params = new URLSearchParams({ q: query, ...options });
      const response = await fetch(`${API_URL}/api/knowledge/search?${params}`);
      const data = await response.json();
      set({
        searchResults: data.results || [],
        loading: false
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  addItem: async (itemData) => {
    try {
      const response = await fetch(`${API_URL}/api/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      const data = await response.json();

      if (data.success) {
        await get().fetchItems();
        await get().fetchStats();
      }

      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  updateItem: async (itemId, updates) => {
    try {
      const response = await fetch(`${API_URL}/api/knowledge/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await response.json();

      if (data.success) {
        await get().fetchItems();
      }

      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteItem: async (itemId) => {
    try {
      const response = await fetch(`${API_URL}/api/knowledge/${itemId}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        await get().fetchItems();
        await get().fetchStats();
      }

      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  clearSearch: () => set({ searchResults: [], searchQuery: '' }),
  clearError: () => set({ error: null })
}));

export default useKnowledgeStore;
