// Shared constants and types for Adventureland Chief of Staff

export const AgentTypes = {
  EXPLORER: 'explorer',
  TRADER: 'trader',
  NAVIGATOR: 'navigator',
  ARCHAEOLOGIST: 'archaeologist',
  SCOUT: 'scout',
  GUIDE: 'guide'
};

export const TaskTypes = {
  CODE_REVIEW: 'code_review',
  REFACTOR: 'refactor',
  TEST: 'test',
  DEPLOY: 'deploy',
  DEPENDENCY_UPDATE: 'dependency_update',
  DOCUMENTATION: 'documentation',
  GIT_OPERATION: 'git_operation',
  CUSTOM: 'custom'
};

export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

export const AgentCharacters = {
  [AgentTypes.EXPLORER]: {
    name: 'Explorer',
    icon: '🗺️',
    role: 'Code discovery, refactoring, architecture',
    personality: 'Curious, methodical',
    skills: ['Code analysis', 'Pattern recognition', 'Dependency mapping']
  },
  [AgentTypes.TRADER]: {
    name: 'Trader',
    icon: '💰',
    role: 'Dependency management, optimization',
    personality: 'Pragmatic, efficiency-minded',
    skills: ['npm operations', 'Bundle optimization', 'Cost analysis']
  },
  [AgentTypes.NAVIGATOR]: {
    name: 'Navigator',
    icon: '🧭',
    role: 'Git operations, deployment',
    personality: 'Precise, strategic',
    skills: ['Git workflows', 'CI/CD', 'Release management']
  },
  [AgentTypes.ARCHAEOLOGIST]: {
    name: 'Archaeologist',
    icon: '🏺',
    role: 'Knowledge retrieval, documentation',
    personality: 'Patient, scholarly',
    skills: ['Doc search', 'API research', 'Tech debt analysis']
  },
  [AgentTypes.SCOUT]: {
    name: 'Scout',
    icon: '🔭',
    role: 'Testing, monitoring, error detection',
    personality: 'Alert, detail-oriented',
    skills: ['Test running', 'Performance monitoring', 'Bug detection']
  },
  [AgentTypes.GUIDE]: {
    name: 'Guide',
    icon: '📖',
    role: 'Onboarding, tutorials, best practices',
    personality: 'Friendly, educational',
    skills: ['Doc generation', 'Code examples', 'Mentoring']
  }
};

// Task routing map
export const TaskRouting = {
  [TaskTypes.CODE_REVIEW]: [AgentTypes.EXPLORER, AgentTypes.SCOUT],
  [TaskTypes.REFACTOR]: [AgentTypes.EXPLORER, AgentTypes.ARCHAEOLOGIST],
  [TaskTypes.TEST]: [AgentTypes.SCOUT],
  [TaskTypes.DEPLOY]: [AgentTypes.NAVIGATOR],
  [TaskTypes.DEPENDENCY_UPDATE]: [AgentTypes.TRADER],
  [TaskTypes.DOCUMENTATION]: [AgentTypes.GUIDE, AgentTypes.ARCHAEOLOGIST],
  [TaskTypes.GIT_OPERATION]: [AgentTypes.NAVIGATOR],
  [TaskTypes.CUSTOM]: [] // Will be determined by orchestrator
};
