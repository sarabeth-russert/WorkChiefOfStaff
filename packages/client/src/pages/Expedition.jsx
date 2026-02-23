import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui';
import useAgentStore from '../stores/agentStore';
import AgentCard from '../components/agent/AgentCard';
import TaskInput from '../components/agent/TaskInput';
import ResponseDisplay from '../components/agent/ResponseDisplay';

const Expedition = () => {
  const {
    agents,
    setAgents,
    submitTask,
    currentResponse,
    currentAgent,
    isProcessing,
    connected,
    error
  } = useAgentStore();

  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    // Fetch available agents from server
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5554';
    fetch(`${apiUrl}/api/agents`)
      .then(res => res.json())
      .then(data => {
        if (data.agents && data.agents.length > 0) {
          setAgents(data.agents);
          setSelectedAgent(data.agents[0]); // Select first agent by default
        }
      })
      .catch(err => {
        console.error('Error fetching agents:', err);
        // Fallback to hardcoded Explorer agent if fetch fails
        const explorerAgent = {
          name: 'Explorer',
          type: 'explorer',
          icon: '🗺️',
          personality: 'Curious, methodical, and detail-oriented',
          role: 'Code discovery, refactoring, and architecture analysis',
          skills: ['Code analysis', 'Pattern recognition', 'Dependency mapping']
        };
        setAgents([explorerAgent]);
        setSelectedAgent(explorerAgent);
      });
  }, [setAgents]);

  const handleSubmitTask = (task) => {
    if (selectedAgent) {
      submitTask(selectedAgent.type, 'custom', task);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-6xl font-poster text-vintage-text text-letterpress mb-4">
          🗺️ Expedition
        </h1>
        <p className="text-lg text-vintage-text opacity-80">
          Chief of Staff - AI Agent Orchestration
        </p>
        {!connected && (
          <p className="text-terracotta-dark mt-2">
            ⚠️ Connecting to server...
          </p>
        )}
      </div>

      {/* Agent Selection */}
      {agents.length > 0 && (
        <div>
          <h2 className="text-3xl font-poster text-vintage-text mb-4">
            Select Your Agent
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <AgentCard
                key={agent.type}
                agent={agent}
                selected={selectedAgent?.type === agent.type}
                onSelect={() => setSelectedAgent(agent)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Task Input */}
      {selectedAgent && (
        <Card>
          <TaskInput
            onSubmit={handleSubmitTask}
            isProcessing={isProcessing}
            selectedAgent={selectedAgent}
          />
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-terracotta-dark">
          <p className="text-terracotta-dark">
            <strong>Error:</strong> {error}
          </p>
        </Card>
      )}

      {/* Response Display */}
      {currentResponse && (
        <ResponseDisplay
          response={currentResponse}
          agent={agents.find(a => a.type === currentAgent)}
        />
      )}
    </div>
  );
};

export default Expedition;
