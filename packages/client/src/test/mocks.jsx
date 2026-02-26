import { vi } from 'vitest';

// Mock Socket.io client
export const createMockSocket = () => {
  const eventHandlers = new Map();

  const mockSocket = {
    id: 'mock-socket-id',
    connected: true,
    on: vi.fn((event, handler) => {
      eventHandlers.set(event, handler);
    }),
    off: vi.fn((event) => {
      eventHandlers.delete(event);
    }),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
    // Helper method to trigger events in tests
    _triggerEvent: (event, data) => {
      const handler = eventHandlers.get(event);
      if (handler) handler(data);
    },
    _getEventHandlers: () => eventHandlers
  };

  return mockSocket;
};

// Mock socket.io-client module
export const mockSocketIO = () => {
  const mockSocket = createMockSocket();

  vi.mock('socket.io-client', () => ({
    io: vi.fn(() => mockSocket)
  }));

  return mockSocket;
};

// Mock agent data for tests
export const mockAgents = [
  {
    name: 'Explorer',
    type: 'explorer',
    icon: '🗺️',
    personality: 'Curious, methodical, and detail-oriented',
    role: 'Code discovery, refactoring, and architecture analysis',
    skills: ['Code analysis', 'Pattern recognition', 'Dependency mapping']
  },
  {
    name: 'Scout',
    type: 'scout',
    icon: '🔍',
    personality: 'Alert, detail-oriented, and vigilant',
    role: 'Testing, monitoring, and error detection',
    skills: ['Test running', 'Performance monitoring', 'Bug detection']
  },
  {
    name: 'Guide',
    type: 'guide',
    icon: '📚',
    personality: 'Patient, knowledgeable, and supportive',
    role: 'Documentation and knowledge sharing',
    skills: ['Documentation', 'Code explanation', 'Best practices']
  }
];

// Mock fetch responses
export const createMockFetchResponse = (data, ok = true) => ({
  ok,
  json: async () => data,
  text: async () => JSON.stringify(data),
  status: ok ? 200 : 500
});

// Mock zustand store for testing
export const createMockStore = (initialState = {}) => {
  const defaultState = {
    socket: createMockSocket(),
    connected: true,
    agents: [],
    currentAgent: null,
    currentResponse: '',
    currentTaskId: null,
    isProcessing: false,
    tasks: [],
    error: null,
    conversationHistory: {},
    setAgents: vi.fn(),
    submitTask: vi.fn(),
    clearError: vi.fn(),
    clearCurrentResponse: vi.fn(),
    clearConversationHistory: vi.fn(),
    ...initialState
  };

  return defaultState;
};
