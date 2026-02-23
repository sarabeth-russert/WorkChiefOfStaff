import { useState, useEffect } from 'react';
import useConfigStore from '../../stores/configStore';
import Button from '../ui/Button';

const SettingsPanel = () => {
  const { settings, updateSettings, fetchSettings } = useConfigStore();

  const [maxTokens, setMaxTokens] = useState(4096);
  const [temperature, setTemperature] = useState(1.0);
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (settings) {
      setMaxTokens(settings.defaultMaxTokens || 4096);
      setTemperature(settings.defaultTemperature || 1.0);
      setStreamingEnabled(settings.streamingEnabled !== false);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await updateSettings({
        defaultMaxTokens: maxTokens,
        defaultTemperature: temperature,
        streamingEnabled: streamingEnabled
      });
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Reset all settings to defaults?')) {
      setMaxTokens(4096);
      setTemperature(1.0);
      setStreamingEnabled(true);
      setMessage({ type: 'info', text: 'Settings reset. Click Save to apply.' });
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Max Tokens Setting */}
      <div>
        <label className="block text-primary font-semibold mb-2">
          Default Max Tokens
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1024"
            max="8192"
            step="256"
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value))}
            className="flex-1 h-2 bg-sand rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #D4735E 0%, #D4735E ${((maxTokens - 1024) / (8192 - 1024)) * 100}%, #E8D4A8 ${((maxTokens - 1024) / (8192 - 1024)) * 100}%, #E8D4A8 100%)`
            }}
          />
          <div className="w-24 text-right">
            <span className="text-xl font-bold text-primary">{maxTokens}</span>
            <span className="text-sm text-secondary ml-1">tokens</span>
          </div>
        </div>
        <p className="text-sm text-secondary mt-2">
          Maximum number of tokens for agent responses. Higher values allow longer responses but cost more.
        </p>
      </div>

      {/* Temperature Setting */}
      <div>
        <label className="block text-primary font-semibold mb-2">
          Default Temperature
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="flex-1 h-2 bg-sand rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #4A7859 0%, #4A7859 ${temperature * 100}%, #E8D4A8 ${temperature * 100}%, #E8D4A8 100%)`
            }}
          />
          <div className="w-24 text-right">
            <span className="text-xl font-bold text-primary">{temperature.toFixed(1)}</span>
          </div>
        </div>
        <p className="text-sm text-secondary mt-2">
          Controls randomness. Lower values (0.0-0.5) are more focused, higher values (0.5-1.0) are more creative.
        </p>
        <div className="flex justify-between text-xs text-secondary mt-1">
          <span>Precise</span>
          <span>Balanced</span>
          <span>Creative</span>
        </div>
      </div>

      {/* Streaming Setting */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={streamingEnabled}
            onChange={(e) => setStreamingEnabled(e.target.checked)}
            className="w-5 h-5 text-primary border-2 border-secondary rounded focus:ring-2 focus:ring-primary"
          />
          <div>
            <span className="text-primary font-semibold">Enable Streaming</span>
            <p className="text-sm text-secondary">
              Show agent responses in real-time as they're generated
            </p>
          </div>
        </label>
      </div>

      {/* Current Settings Summary */}
      <div className="p-4 bg-cream border-2 border-secondary rounded vintage-border">
        <h4 className="font-bold text-primary mb-3">Current Configuration</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-secondary">Max Tokens:</span>
            <span className="font-semibold text-primary">{maxTokens}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">Temperature:</span>
            <span className="font-semibold text-primary">{temperature.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">Streaming:</span>
            <span className="font-semibold text-primary">
              {streamingEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        <Button
          variant="secondary"
          onClick={handleReset}
        >
          Reset to Defaults
        </Button>
      </div>

      {/* Help Text */}
      <div className="p-4 bg-sand bg-opacity-50 border-2 border-primary rounded vintage-border">
        <h4 className="font-bold text-primary mb-2">ℹ️ About These Settings</h4>
        <ul className="text-sm text-secondary space-y-1">
          <li>• These are default values applied to all agents</li>
          <li>• Individual agents can override these settings</li>
          <li>• Changes take effect immediately for new tasks</li>
          <li>• Streaming provides better user experience but uses more bandwidth</li>
        </ul>
      </div>
    </div>
  );
};

export default SettingsPanel;
