import { useState, useEffect } from 'react';
import useConfigStore from '../../stores/configStore';
import Button from '../ui/Button';

const agentTypes = [
  { type: 'explorer', name: 'Explorer', icon: '🗺️' },
  { type: 'trader', name: 'Trader', icon: '💰' },
  { type: 'navigator', name: 'Navigator', icon: '🧭' },
  { type: 'archaeologist', name: 'Archaeologist', icon: '🏺' },
  { type: 'scout', name: 'Scout', icon: '🔭' },
  { type: 'guide', name: 'Guide', icon: '📖' }
];

const PromptEditor = () => {
  const {
    prompts,
    fetchPrompt,
    updatePrompt,
    exportPrompt,
    importPrompt
  } = useConfigStore();

  const [selectedAgent, setSelectedAgent] = useState('explorer');
  const [promptData, setPromptData] = useState(null);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [personality, setPersonality] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadPrompt(selectedAgent);
  }, [selectedAgent]);

  const loadPrompt = async (agentType) => {
    const prompt = await fetchPrompt(agentType);
    setPromptData(prompt);

    if (prompt) {
      setSystemPrompt(prompt.prompts?.system || '');
      setPersonality(prompt.prompts?.personality || '');
    } else {
      setSystemPrompt('');
      setPersonality('');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await updatePrompt(selectedAgent, {
        prompts: {
          system: systemPrompt,
          personality: personality
        }
      });
      setMessage({ type: 'success', text: 'Prompt saved successfully!' });
      await loadPrompt(selectedAgent);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save prompt' });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    const json = await exportPrompt(selectedAgent);
    if (json) {
      // Create download
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedAgent}-prompt.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const text = await file.text();
        await importPrompt(selectedAgent, text);
        await loadPrompt(selectedAgent);
        setMessage({ type: 'success', text: 'Prompt imported successfully!' });
      }
    };
    input.click();
  };

  const handleReset = () => {
    if (confirm('Reset to default prompt? This will clear your custom prompt.')) {
      setSystemPrompt('');
      setPersonality('');
      setMessage({ type: 'info', text: 'Prompt reset. Click Save to apply.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Agent Selector */}
      <div>
        <label className="block text-primary font-semibold mb-2">
          Select Agent
        </label>
        <div className="grid grid-cols-3 gap-3">
          {agentTypes.map(agent => (
            <button
              key={agent.type}
              onClick={() => setSelectedAgent(agent.type)}
              className={`p-3 border-2 rounded vintage-border transition-all ${
                selectedAgent === agent.type
                  ? 'border-primary bg-sand shadow-vintage'
                  : 'border-secondary bg-cream hover:border-primary'
              }`}
            >
              <span className="text-2xl mr-2">{agent.icon}</span>
              <span className="font-bold text-primary">{agent.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`p-3 border-2 rounded vintage-border ${
            message.type === 'success'
              ? 'bg-jungle bg-opacity-10 border-jungle text-jungle'
              : message.type === 'error'
              ? 'bg-red-100 border-red-400 text-red-700'
              : 'bg-teal bg-opacity-10 border-teal text-teal'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Version Info */}
      {promptData && (
        <div className="p-3 bg-cream border-2 border-secondary rounded vintage-border">
          <div className="text-sm text-secondary">
            Version: <span className="font-mono">{promptData.version}</span>
            {promptData.history && promptData.history.length > 0 && (
              <span className="ml-4">
                ({promptData.history.length} revision{promptData.history.length !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Personality Editor */}
      <div>
        <label className="block text-primary font-semibold mb-2">
          Personality
        </label>
        <input
          type="text"
          value={personality}
          onChange={(e) => setPersonality(e.target.value)}
          placeholder="e.g., Curious, methodical, detail-oriented"
          className="w-full p-3 border-2 border-secondary rounded vintage-border bg-cream focus:border-primary focus:outline-none"
        />
      </div>

      {/* System Prompt Editor */}
      <div>
        <label className="block text-primary font-semibold mb-2">
          System Prompt
        </label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder={`Enter custom system prompt for ${selectedAgent}...\n\nLeave empty to use the agent's default prompt.`}
          className="w-full h-96 p-4 border-2 border-secondary rounded vintage-border bg-cream focus:border-primary focus:outline-none font-mono text-sm resize-y"
        />
        <p className="text-sm text-secondary mt-2">
          Tip: Use the agent's personality traits and role to craft an effective prompt.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Prompt'}
        </Button>
        <Button
          variant="secondary"
          onClick={handleReset}
        >
          Reset to Default
        </Button>
        <Button
          variant="secondary"
          onClick={handleExport}
          disabled={!promptData}
        >
          Export
        </Button>
        <Button
          variant="secondary"
          onClick={handleImport}
        >
          Import
        </Button>
      </div>

      {/* Help Text */}
      <div className="p-4 bg-sand bg-opacity-50 border-2 border-primary rounded vintage-border">
        <h4 className="font-bold text-primary mb-2">ℹ️ About Prompts</h4>
        <ul className="text-sm text-secondary space-y-1">
          <li>• System prompts define how an agent behaves and responds</li>
          <li>• Each agent has a default prompt based on their role</li>
          <li>• Custom prompts override the default behavior</li>
          <li>• Leave fields empty to use built-in defaults</li>
          <li>• Changes take effect immediately for new tasks</li>
        </ul>
      </div>
    </div>
  );
};

export default PromptEditor;
