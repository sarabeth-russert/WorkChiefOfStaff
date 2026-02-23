import { useState, useEffect } from 'react';
import useConfigStore from '../../stores/configStore';
import Button from '../ui/Button';
import Input from '../ui/Input';

const ProviderSelector = () => {
  const {
    providers,
    currentProvider,
    providerTypes,
    setProvider,
    updateProviderConfig,
    validateProvider
  } = useConfigStore();

  const [selectedType, setSelectedType] = useState('');
  const [config, setConfig] = useState({});
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  useEffect(() => {
    if (currentProvider && providers[currentProvider]) {
      setSelectedType(currentProvider);
      setConfig(providers[currentProvider]);
    }
  }, [currentProvider, providers]);

  const handleProviderChange = (type) => {
    setSelectedType(type);
    if (providers[type]) {
      setConfig(providers[type]);
    } else {
      // Initialize with defaults
      const providerType = providerTypes.find(p => p.type === type);
      const defaultConfig = { type };
      if (providerType?.credentialFields) {
        providerType.credentialFields.forEach(field => {
          defaultConfig[field] = '';
        });
      }
      setConfig(defaultConfig);
    }
    setValidationResult(null);
  };

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setValidationResult(null);
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      const isValid = await validateProvider(selectedType, config);
      setValidationResult(isValid ? 'success' : 'error');
    } catch (error) {
      setValidationResult('error');
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    await updateProviderConfig(selectedType, config);
  };

  const handleActivate = async () => {
    await setProvider(selectedType, config);
  };

  const isCurrentProvider = selectedType === currentProvider;

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div>
        <label className="block text-primary font-semibold mb-2">
          Select Provider
        </label>
        <div className="grid grid-cols-2 gap-4">
          {providerTypes.map(type => (
            <button
              key={type.type}
              onClick={() => handleProviderChange(type.type)}
              className={`p-4 border-2 rounded vintage-border transition-all ${
                selectedType === type.type
                  ? 'border-primary bg-sand shadow-vintage'
                  : 'border-secondary bg-cream hover:border-primary'
              }`}
            >
              <div className="font-bold text-primary mb-1">{type.name}</div>
              <div className="text-sm text-secondary">{type.description}</div>
              {providers[type.type]?.enabled && (
                <div className="mt-2 text-xs text-jungle font-semibold">
                  ✓ Configured
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Status Indicator */}
      {isCurrentProvider && (
        <div className="p-3 bg-jungle bg-opacity-10 border-2 border-jungle rounded vintage-border">
          <div className="flex items-center gap-2">
            <span className="text-jungle font-bold">✓ Active Provider</span>
          </div>
        </div>
      )}

      {/* Configuration Form */}
      {selectedType && (
        <div className="space-y-4">
          <h3 className="text-lg font-display text-primary letterpress">
            Configuration
          </h3>

          {selectedType === 'bedrock' && (
            <>
              <Input
                label="AWS Region"
                value={config.region || ''}
                onChange={(e) => handleConfigChange('region', e.target.value)}
                placeholder="us-east-1"
              />
              <Input
                label="Model ID"
                value={config.modelId || ''}
                onChange={(e) => handleConfigChange('modelId', e.target.value)}
                placeholder="anthropic.claude-3-5-sonnet-20241022-v2:0"
              />
              <div className="text-sm text-secondary">
                <p>AWS credentials are loaded from your environment:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>AWS_PROFILE (if set)</li>
                  <li>AWS credentials file (~/.aws/credentials)</li>
                  <li>IAM role (if running on EC2/ECS)</li>
                </ul>
              </div>
            </>
          )}

          {selectedType === 'anthropic' && (
            <>
              <Input
                label="API Key"
                type="password"
                value={config.apiKey || ''}
                onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                placeholder="sk-ant-..."
              />
              <Input
                label="Model ID"
                value={config.modelId || ''}
                onChange={(e) => handleConfigChange('modelId', e.target.value)}
                placeholder="claude-3-5-sonnet-20241022"
              />
            </>
          )}
        </div>
      )}

      {/* Validation Result */}
      {validationResult && (
        <div
          className={`p-3 border-2 rounded vintage-border ${
            validationResult === 'success'
              ? 'bg-jungle bg-opacity-10 border-jungle'
              : 'bg-red-100 border-red-400'
          }`}
        >
          <p className={validationResult === 'success' ? 'text-jungle' : 'text-red-700'}>
            {validationResult === 'success'
              ? '✓ Provider credentials are valid'
              : '✗ Provider validation failed. Check your credentials.'}
          </p>
        </div>
      )}

      {/* Actions */}
      {selectedType && (
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleValidate}
            disabled={validating}
          >
            {validating ? 'Validating...' : 'Test Connection'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleSave}
          >
            Save Configuration
          </Button>
          {!isCurrentProvider && (
            <Button
              variant="primary"
              onClick={handleActivate}
            >
              Activate Provider
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProviderSelector;
