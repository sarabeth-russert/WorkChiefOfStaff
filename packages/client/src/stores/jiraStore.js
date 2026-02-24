import { create } from 'zustand';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5554';

const useJiraStore = create((set, get) => ({
  // State
  configured: false,
  projects: [],
  issues: [],
  selectedProject: null,
  selectedIssue: null,
  loading: false,
  error: null,

  // Actions
  configure: async (config) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/jira/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await response.json();
      set({ configured: data.configured, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  testConnection: async () => {
    try {
      const response = await fetch(`${API_URL}/api/jira/test`);
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/jira/projects`);
      const data = await response.json();
      set({ projects: data.projects || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchIssues: async (projectKey, options = {}) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (options.maxResults) params.append('maxResults', options.maxResults);
      if (options.startAt) params.append('startAt', options.startAt);
      if (options.status) params.append('status', options.status);
      if (options.assignee) params.append('assignee', options.assignee);
      if (options.myIssuesOnly !== undefined) params.append('myIssuesOnly', options.myIssuesOnly);

      const response = await fetch(
        `${API_URL}/api/jira/projects/${projectKey}/issues?${params}`
      );
      const data = await response.json();
      set({ issues: data.issues || [], loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchIssue: async (issueKey) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/jira/issues/${issueKey}`);
      const data = await response.json();
      set({ selectedIssue: data.issue, loading: false });
      return data.issue;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createIssue: async (issueData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/jira/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueData)
      });
      const data = await response.json();

      if (data.success) {
        // Refresh issues list
        if (get().selectedProject) {
          await get().fetchIssues(get().selectedProject);
        }
      }

      set({ loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateIssue: async (issueKey, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/jira/issues/${issueKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await response.json();

      if (data.success) {
        // Refresh issue
        await get().fetchIssue(issueKey);
      }

      set({ loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addComment: async (issueKey, comment) => {
    try {
      const response = await fetch(`${API_URL}/api/jira/issues/${issueKey}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  transitionIssue: async (issueKey, status) => {
    try {
      const response = await fetch(`${API_URL}/api/jira/issues/${issueKey}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await response.json();

      if (data.success) {
        // Refresh issue
        await get().fetchIssue(issueKey);
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  searchIssues: async (jql, options = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/jira/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jql, ...options })
      });
      const data = await response.json();
      set({ issues: data.issues || [], loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  setSelectedProject: (projectKey) => set({ selectedProject: projectKey }),

  clearError: () => set({ error: null })
}));

export default useJiraStore;
