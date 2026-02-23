import { create } from 'zustand';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5554';

const useAppStore = create((set, get) => ({
  // State
  apps: [],
  pm2Available: false,
  systemStats: null,
  loading: false,
  error: null,

  // Actions
  fetchApps: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/apps`);
      const data = await response.json();
      set({
        apps: data.apps || [],
        pm2Available: data.pm2Available,
        loading: false
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  startApp: async (appId) => {
    try {
      const response = await fetch(`${API_URL}/api/apps/${appId}/start`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        // Refresh apps list
        await get().fetchApps();
      }

      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  stopApp: async (appId) => {
    try {
      const response = await fetch(`${API_URL}/api/apps/${appId}/stop`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        await get().fetchApps();
      }

      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  restartApp: async (appId) => {
    try {
      const response = await fetch(`${API_URL}/api/apps/${appId}/restart`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        await get().fetchApps();
      }

      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  fetchSystemStats: async () => {
    try {
      const response = await fetch(`${API_URL}/api/system/stats`);
      const data = await response.json();
      set({ systemStats: data });
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  },

  clearError: () => set({ error: null })
}));

export default useAppStore;
