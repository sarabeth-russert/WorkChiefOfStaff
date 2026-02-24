import { create } from 'zustand';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5554';

const useAgentStore = create((set, get) => {
  // Initialize socket connection
  const socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  // Socket event handlers
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    set({ connected: true });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
    set({ connected: false });
  });

  socket.on('agent:task:started', (data) => {
    console.log('Task started:', data);
    set({ isProcessing: true, currentTaskId: data.taskId });
  });

  socket.on('agent:task:chunk', (data) => {
    console.log('Task chunk:', data);
    const { currentResponse } = get();
    set({
      currentResponse: currentResponse + data.chunk,
      currentAgent: data.agentType
    });
  });

  socket.on('agent:task:response', (data) => {
    console.log('Task response:', data);
    set({
      currentResponse: data.response,
      currentAgent: data.agentType
    });
  });

  socket.on('agent:task:completed', (data) => {
    console.log('Task completed:', data);
    const { tasks, conversationHistory } = get();

    // Update conversation history for this agent
    const agentHistory = conversationHistory[data.agentType] || [];
    const updatedHistory = {
      ...conversationHistory,
      [data.agentType]: [
        ...agentHistory,
        { role: 'user', content: data.task },
        { role: 'assistant', content: data.response }
      ]
    };

    set({
      isProcessing: false,
      conversationHistory: updatedHistory,
      tasks: [...tasks, {
        id: data.taskId,
        timestamp: new Date().toISOString(),
        status: 'completed',
        ...data
      }]
    });
  });

  socket.on('agent:task:error', (data) => {
    console.error('Task error:', data);
    set({
      isProcessing: false,
      error: data.error
    });
  });

  return {
    // State
    socket,
    connected: false,
    agents: [],
    currentAgent: null,
    currentResponse: '',
    currentTaskId: null,
    isProcessing: false,
    tasks: [],
    error: null,
    conversationHistory: {}, // Store conversation history per agent type

    // Actions
    setAgents: (agents) => set({ agents }),

    submitTask: (agentType, taskType, task) => {
      const { socket, conversationHistory } = get();
      set({
        isProcessing: true,
        currentResponse: '',
        error: null
      });

      // Get conversation history for this agent
      const history = conversationHistory[agentType] || [];

      socket.emit('agent:task', {
        agentType,
        taskType,
        task,
        history // Send conversation history
      });
    },

    clearError: () => set({ error: null }),

    clearCurrentResponse: () => set({
      currentResponse: '',
      currentAgent: null,
      currentTaskId: null
    }),

    clearConversationHistory: (agentType) => {
      const { conversationHistory } = get();
      if (agentType) {
        // Clear specific agent's history
        const updated = { ...conversationHistory };
        delete updated[agentType];
        set({ conversationHistory: updated });
      } else {
        // Clear all conversation history
        set({ conversationHistory: {} });
      }
    }
  };
});

export default useAgentStore;
