import { create } from 'zustand';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5554';

const useConfigStore = create((set, get) => ({
  // State
  providers: {},
  currentProvider: null,
  providerTypes: [],
  models: [],
  currentModel: null,
  prompts: {},
  settings: {},
  loading: false,
  error: null,

  // Provider Management
  fetchProviders: async () => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`${API_URL}/api/config/providers`);
      const result = await response.json();

      if (result.success) {
        set({
          providers: result.data.providers,
          currentProvider: result.data.currentProvider,
          loading: false
        });
      } else {
        set({ error: result.error, loading: false });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchProviderTypes: async () => {
    try {
      const response = await fetch(`${API_URL}/api/config/providers/types`);
      const result = await response.json();

      if (result.success) {
        set({ providerTypes: result.data });
      }
    } catch (error) {
      console.error('Failed to fetch provider types:', error);
    }
  },

  setProvider: async (type, config = {}) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`${API_URL}/api/config/providers/current`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, config })
      });
      const result = await response.json();

      if (result.success) {
        set({
          currentProvider: type,
          loading: false
        });
        // Refresh providers
        await get().fetchProviders();
        // Refresh models for new provider
        await get().fetchModels();
      } else {
        set({ error: result.error, loading: false });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  updateProviderConfig: async (type, updates) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`${API_URL}/api/config/providers/${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const result = await response.json();

      if (result.success) {
        set({ loading: false });
        await get().fetchProviders();
      } else {
        set({ error: result.error, loading: false });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  validateProvider: async (type, config) => {
    try {
      const response = await fetch(`${API_URL}/api/config/providers/${type}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const result = await response.json();

      return result.success && result.data.valid;
    } catch (error) {
      console.error('Failed to validate provider:', error);
      return false;
    }
  },

  // Model Management
  fetchModels: async () => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`${API_URL}/api/config/models`);
      const result = await response.json();

      if (result.success) {
        set({ models: result.data, loading: false });
      } else {
        set({ error: result.error, loading: false });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchCurrentModel: async () => {
    try {
      const response = await fetch(`${API_URL}/api/config/models/current`);
      const result = await response.json();

      if (result.success) {
        set({ currentModel: result.data.modelId });
      }
    } catch (error) {
      console.error('Failed to fetch current model:', error);
    }
  },

  setModel: async (modelId) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`${API_URL}/api/config/models/current`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId })
      });
      const result = await response.json();

      if (result.success) {
        set({ currentModel: modelId, loading: false });
      } else {
        set({ error: result.error, loading: false });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Prompt Management
  fetchPrompts: async () => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`${API_URL}/api/config/prompts`);
      const result = await response.json();

      if (result.success) {
        set({ prompts: result.data, loading: false });
      } else {
        set({ error: result.error, loading: false });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchPrompt: async (agentType) => {
    try {
      const response = await fetch(`${API_URL}/api/config/prompts/${agentType}`);
      const result = await response.json();

      if (result.success) {
        set(state => ({
          prompts: {
            ...state.prompts,
            [agentType]: result.data
          }
        }));
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch prompt:', error);
      return null;
    }
  },

  updatePrompt: async (agentType, prompt) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`${API_URL}/api/config/prompts/${agentType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prompt)
      });
      const result = await response.json();

      if (result.success) {
        set(state => ({
          prompts: {
            ...state.prompts,
            [agentType]: result.data
          },
          loading: false
        }));
      } else {
        set({ error: result.error, loading: false });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  exportPrompt: async (agentType) => {
    try {
      const response = await fetch(`${API_URL}/api/config/prompts/${agentType}/export`, {
        method: 'POST'
      });
      const result = await response.json();

      if (result.success) {
        return result.data.json;
      }
      return null;
    } catch (error) {
      console.error('Failed to export prompt:', error);
      return null;
    }
  },

  importPrompt: async (agentType, json) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`${API_URL}/api/config/prompts/${agentType}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json })
      });
      const result = await response.json();

      if (result.success) {
        set(state => ({
          prompts: {
            ...state.prompts,
            [agentType]: result.data
          },
          loading: false
        }));
      } else {
        set({ error: result.error, loading: false });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Settings Management
  fetchSettings: async () => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`${API_URL}/api/config/settings`);
      const result = await response.json();

      if (result.success) {
        set({ settings: result.data, loading: false });
      } else {
        set({ error: result.error, loading: false });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  updateSettings: async (settings) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`${API_URL}/api/config/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const result = await response.json();

      if (result.success) {
        set({ settings: result.data, loading: false });
      } else {
        set({ error: result.error, loading: false });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Initialize all config data
  initialize: async () => {
    await get().fetchProviderTypes();
    await get().fetchProviders();
    await get().fetchModels();
    await get().fetchCurrentModel();
    await get().fetchSettings();
    await get().fetchPrompts();
  }
}));

export default useConfigStore;
