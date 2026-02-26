import { create } from 'zustand';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || '';

const useWellnessStore = create((set, get) => {
  // Initialize socket connection to current origin (Vite proxy will forward to backend)
  const socket = io(window.location.origin, {
    path: '/socket.io',
    transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  // Socket event handlers for wellness events
  socket.on('wellness:standup', (data) => {
    console.log('Wellness standup notification:', data);
    get().addNotification({
      id: `standup-${Date.now()}`,
      type: 'standup',
      priority: 'normal',
      title: 'Time for Standup',
      message: data.guidance || data.message || 'Your daily standup meeting is starting.',
      timestamp: new Date().toISOString(),
      sessionId: data.sessionId,
      data: data
    });
  });

  socket.on('wellness:retro', (data) => {
    console.log('Wellness retro notification:', data);
    get().addNotification({
      id: `retro-${Date.now()}`,
      type: 'retro',
      priority: 'normal',
      title: 'Time for Retrospective',
      message: data.guidance || data.message || 'Your retrospective meeting is starting.',
      timestamp: new Date().toISOString(),
      sessionId: data.sessionId,
      data: data
    });
  });

  socket.on('wellness:stress-alert', (data) => {
    console.log('Wellness stress alert:', data);
    get().addNotification({
      id: `stress-${Date.now()}`,
      type: 'stress-alert',
      priority: 'high',
      title: 'High Stress Alert',
      message: data.message || 'Your stress levels are elevated. Consider taking a break.',
      timestamp: new Date().toISOString(),
      data: data
    });
  });

  return {
    // State
    socket,
    configured: false,
    dailyMetrics: null,
    trends: [],
    settings: {
      standupTime: '09:00',
      retroTime: '16:00',
      stressThreshold: 70,
      notificationsEnabled: true
    },
    loading: false,
    error: null,
    notifications: [],
    activeSession: null,
    sessionPanelOpen: false,
    sessionMessages: [],
    sendingMessage: false,

    // Actions
    configure: async (config) => {
      set({ loading: true, error: null });
      try {
        const response = await fetch(`${API_URL}/api/wellness/configure`, {
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
        const response = await fetch(`${API_URL}/api/wellness/test`);
        const data = await response.json();
        return data;
      } catch (error) {
        return { success: false, message: error.message };
      }
    },

    fetchDailyMetrics: async (date = null) => {
      set({ loading: true, error: null });
      try {
        const queryParam = date ? `?date=${date}` : '';
        const response = await fetch(`${API_URL}/api/wellness/daily${queryParam}`);
        const data = await response.json();
        set({ dailyMetrics: data.metrics || null, loading: false });
        return data;
      } catch (error) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    fetchTrends: async (days = 7) => {
      set({ loading: true, error: null });
      try {
        const response = await fetch(`${API_URL}/api/wellness/trends?days=${days}`);
        const data = await response.json();
        set({ trends: data.trends || [], loading: false });
        return data;
      } catch (error) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    updateSettings: async (newSettings) => {
      set({ loading: true, error: null });
      try {
        const response = await fetch(`${API_URL}/api/wellness/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings)
        });
        const data = await response.json();

        if (data.success) {
          set({
            settings: { ...get().settings, ...newSettings },
            loading: false
          });
        } else {
          set({ loading: false });
        }

        return data;
      } catch (error) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    refreshData: async () => {
      set({ loading: true, error: null });
      try {
        await Promise.all([
          get().fetchDailyMetrics(),
          get().fetchTrends()
        ]);
        set({ loading: false });
      } catch (error) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    addNotification: (notification) => {
      const { notifications } = get();
      set({
        notifications: [notification, ...notifications]
      });
    },

    dismissNotification: (notificationId) => {
      const { notifications } = get();
      set({
        notifications: notifications.filter(n => n.id !== notificationId)
      });
    },

    clearError: () => set({ error: null }),

    startSession: async (sessionId, date) => {
      set({ loading: true, error: null });
      try {
        // If date is not provided, use today's date
        const sessionDate = date || new Date().toISOString().split('T')[0];

        const response = await fetch(`${API_URL}/api/wellness/session/${sessionId}?date=${sessionDate}`);
        const data = await response.json();

        if (data.success) {
          // Store the date with the session for later use
          const sessionWithDate = {
            ...data.session,
            date: sessionDate
          };

          set({
            activeSession: sessionWithDate,
            sessionMessages: data.session.conversation || [],
            sessionPanelOpen: true,
            loading: false
          });
        } else {
          set({ error: data.message || 'Failed to load session', loading: false });
        }

        return data;
      } catch (error) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    sendSessionMessage: async (message) => {
      const { activeSession, sessionMessages } = get();
      if (!activeSession) {
        throw new Error('No active session');
      }

      // Extract date from session (it should be stored when session was loaded)
      // Parse date from session ID or use startedAt timestamp
      const date = activeSession.date || new Date(activeSession.startedAt).toISOString().split('T')[0];

      set({ sendingMessage: true, error: null });
      try {
        const response = await fetch(`${API_URL}/api/wellness/session/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            sessionId: activeSession.id,
            message,
            conversationHistory: sessionMessages
          })
        });
        const data = await response.json();

        if (data.success) {
          // Append user message and Guide response to session messages
          const userMessage = {
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
          };
          const assistantMessage = {
            role: 'assistant',
            content: data.response,
            timestamp: new Date().toISOString()
          };

          set({
            sessionMessages: [...sessionMessages, userMessage, assistantMessage],
            sendingMessage: false
          });
        } else {
          set({ error: data.message || 'Failed to send message', sendingMessage: false });
        }

        return data;
      } catch (error) {
        set({ error: error.message, sendingMessage: false });
        throw error;
      }
    },

    completeSession: async (summary) => {
      const { activeSession } = get();
      if (!activeSession) {
        throw new Error('No active session');
      }

      // Extract date from session
      const date = activeSession.date || new Date(activeSession.startedAt).toISOString().split('T')[0];

      set({ loading: true, error: null });
      try {
        const response = await fetch(`${API_URL}/api/wellness/session/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            sessionId: activeSession.id,
            summary
          })
        });
        const data = await response.json();

        if (data.success) {
          set({
            activeSession: null,
            sessionPanelOpen: false,
            sessionMessages: [],
            loading: false
          });
        } else {
          set({ error: data.message || 'Failed to complete session', loading: false });
        }

        return data;
      } catch (error) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    closeSessionPanel: () => {
      set({ sessionPanelOpen: false });
    },

    openSessionPanel: () => {
      const { activeSession } = get();
      if (activeSession) {
        set({ sessionPanelOpen: true });
      }
    }
  };
});

export default useWellnessStore;
