import { useEffect } from 'react';
import useConfigStore from '../../stores/configStore';
import Button from '../ui/Button';

const ModelSelector = () => {
  const {
    models,
    currentModel,
    currentProvider,
    setModel,
    fetchModels
  } = useConfigStore();

  useEffect(() => {
    fetchModels();
  }, [currentProvider]);

  const handleSelectModel = async (modelId) => {
    await setModel(modelId);
  };

  return (
    <div className="space-y-6">
      {/* Current Provider Info */}
      <div className="p-4 bg-sand bg-opacity-50 border-2 border-primary rounded vintage-border">
        <div className="text-sm text-secondary mb-1">Current Provider</div>
        <div className="text-lg font-bold text-primary">
          {currentProvider === 'bedrock' ? 'AWS Bedrock' : 'Anthropic'}
        </div>
      </div>

      {/* Model List */}
      <div>
        <h3 className="text-lg font-display text-primary letterpress mb-4">
          Available Models
        </h3>

        {models.length === 0 ? (
          <p className="text-secondary">No models available. Please configure a provider first.</p>
        ) : (
          <div className="space-y-3">
            {models.map(model => (
              <div
                key={model.id}
                className={`p-4 border-2 rounded vintage-border transition-all ${
                  currentModel === model.id
                    ? 'border-primary bg-sand shadow-vintage'
                    : 'border-secondary bg-cream hover:border-primary'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-primary">
                        {model.name}
                      </h4>
                      {currentModel === model.id && (
                        <span className="px-2 py-1 bg-jungle text-white text-xs font-bold rounded">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-secondary mb-3">
                      Model ID: <code className="font-mono bg-cream px-1">{model.id}</code>
                    </p>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-secondary">Context Window:</span>
                        <span className="ml-2 font-semibold text-primary">
                          {model.contextWindow?.toLocaleString()} tokens
                        </span>
                      </div>
                      <div>
                        <span className="text-secondary">Max Output:</span>
                        <span className="ml-2 font-semibold text-primary">
                          {model.maxOutput?.toLocaleString()} tokens
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    {currentModel !== model.id && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSelectModel(model.id)}
                      >
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Model Info */}
      <div className="p-4 bg-cream border-2 border-secondary rounded vintage-border">
        <h4 className="font-bold text-primary mb-2">ℹ️ About Models</h4>
        <ul className="text-sm text-secondary space-y-1">
          <li>• <strong>Claude 3.5 Sonnet</strong>: Best balance of intelligence and speed</li>
          <li>• <strong>Claude 3 Opus</strong>: Most capable model for complex tasks</li>
          <li>• <strong>Claude 3 Sonnet</strong>: Good performance and cost-effectiveness</li>
          <li>• <strong>Claude 3 Haiku</strong>: Fastest responses, lower cost</li>
        </ul>
      </div>
    </div>
  );
};

export default ModelSelector;
