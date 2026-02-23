import { useEffect, useState } from 'react';
import useConfigStore from '../stores/configStore';
import ProviderSelector from '../components/settings/ProviderSelector';
import ModelSelector from '../components/settings/ModelSelector';
import PromptEditor from '../components/settings/PromptEditor';
import SettingsPanel from '../components/settings/SettingsPanel';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('providers');
  const { initialize, loading, error } = useConfigStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const tabs = [
    { id: 'providers', label: 'Providers', icon: '🔌' },
    { id: 'models', label: 'Models', icon: '🤖' },
    { id: 'prompts', label: 'Prompts', icon: '📝' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-display text-primary letterpress mb-2">
          Chief of Staff Settings
        </h1>
        <p className="text-secondary">
          Configure your AI providers, models, and agent prompts
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border-2 border-red-400 rounded vintage-border">
          <p className="text-red-700 font-semibold">⚠️ Error: {error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b-2 border-primary pb-2">
        {tabs.map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'primary' : 'secondary'}
            onClick={() => setActiveTab(tab.id)}
            className="px-6 py-2"
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
              <p className="mt-4 text-secondary">Loading configuration...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'providers' && (
              <Card className="max-w-4xl">
                <h2 className="text-2xl font-display text-primary mb-4 letterpress">
                  AI Provider Configuration
                </h2>
                <p className="text-secondary mb-6">
                  Choose and configure your AI provider. Switch between AWS Bedrock and Anthropic direct API.
                </p>
                <ProviderSelector />
              </Card>
            )}

            {activeTab === 'models' && (
              <Card className="max-w-4xl">
                <h2 className="text-2xl font-display text-primary mb-4 letterpress">
                  Model Selection
                </h2>
                <p className="text-secondary mb-6">
                  Select which Claude model to use for your agents.
                </p>
                <ModelSelector />
              </Card>
            )}

            {activeTab === 'prompts' && (
              <Card className="max-w-6xl">
                <h2 className="text-2xl font-display text-primary mb-4 letterpress">
                  Agent Prompts
                </h2>
                <p className="text-secondary mb-6">
                  Customize system prompts for each agent to adjust their personality and behavior.
                </p>
                <PromptEditor />
              </Card>
            )}

            {activeTab === 'settings' && (
              <Card className="max-w-4xl">
                <h2 className="text-2xl font-display text-primary mb-4 letterpress">
                  Global Settings
                </h2>
                <p className="text-secondary mb-6">
                  Configure default parameters for all agents.
                </p>
                <SettingsPanel />
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Settings;
