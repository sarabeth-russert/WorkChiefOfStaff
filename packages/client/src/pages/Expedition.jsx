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
    error,
    conversationHistory,
    clearConversationHistory
  } = useAgentStore();

  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    // Fetch available agents from server
    const apiUrl = import.meta.env.VITE_API_URL || '';
    fetch(`${apiUrl}/api/agents`)
      .then(res => res.json())
      .then(data => {
        if (data.agents && data.agents.length > 0) {
          setAgents(data.agents);
          setSelectedAgent(data.agents[0]); // Select first agent by default
        }
      })
      .catch(err => {
        // Fetch failed; fall back to hardcoded agent
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
      {/* Hero — let the art breathe */}
      <div className="relative rounded-lg overflow-hidden shadow-vintage mb-2">
        <img
          src="/images/pages/expedition-header.png"
          alt="Expedition into the unknown"
          className="w-full h-52 md:h-72 object-cover"
          onError={(e) => e.target.style.display = 'none'}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream/40" />
        <div className="absolute top-4 left-4">
          <span className="inline-block bg-vintage-text/60 text-cream px-3 py-1 rounded font-ui text-xs uppercase tracking-widest">
            AI Agent Orchestration
          </span>
        </div>
      </div>
      <div className="text-center mb-8">
        <h1 className="text-5xl md:text-6xl font-poster text-vintage-text text-letterpress mb-1">
          Expedition
        </h1>
        <p className="font-serif text-vintage-text/50 text-base italic">
          Dispatch your crew and chart the course ahead
        </p>
        {!connected && (
          <p className="text-terracotta-dark mt-2 font-serif text-sm">
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
          {conversationHistory[selectedAgent.type]?.length > 0 && (
            <div className="mb-4 flex items-center justify-between p-3 bg-sand rounded border-2 border-mustard">
              <p className="text-sm text-vintage-text">
                <strong>Conversation Active:</strong> {conversationHistory[selectedAgent.type].length / 2} messages in history
              </p>
              <button
                onClick={() => clearConversationHistory(selectedAgent.type)}
                className="px-3 py-1 text-sm font-ui uppercase bg-terracotta text-cream rounded border-2 border-terracotta-dark hover:bg-terracotta-dark transition-colors"
              >
                Clear History
              </button>
            </div>
          )}
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
