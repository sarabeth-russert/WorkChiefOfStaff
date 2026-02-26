import React, { useState, useEffect } from 'react';
import { Card } from '../ui';
import Button from '../ui/Button';
import Input from '../ui/Input';

const WellnessSettings = ({ onSave, currentSettings = {} }) => {
  const [settings, setSettings] = useState({
    workStartTime: '09:00',
    workEndTime: '17:00',
    stressThreshold: 70,
    enableNotifications: true,
    ...currentSettings
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setSettings({
      workStartTime: '09:00',
      workEndTime: '17:00',
      stressThreshold: 70,
      enableNotifications: true,
      ...currentSettings
    });
  }, [currentSettings]);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSaveMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');

    try {
      if (onSave) {
        await onSave(settings);
      }
      setSaveMessage('Settings saved successfully!');
    } catch (error) {
      setSaveMessage(`Error saving settings: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <h3 className="text-2xl font-poster text-vintage-text mb-6">Wellness Settings</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            type="time"
            label="Work Start Time"
            value={settings.workStartTime}
            onChange={(e) => handleChange('workStartTime', e.target.value)}
            helperText="When should wellness checks begin?"
          />

          <Input
            type="time"
            label="Work End Time"
            value={settings.workEndTime}
            onChange={(e) => handleChange('workEndTime', e.target.value)}
            helperText="When should wellness checks end?"
          />
        </div>

        <Input
          type="number"
          label="Stress Threshold"
          value={settings.stressThreshold}
          onChange={(e) => handleChange('stressThreshold', parseInt(e.target.value))}
          min="0"
          max="100"
          helperText="Alert when stress levels exceed this percentage (0-100)"
        />

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="enableNotifications"
            checked={settings.enableNotifications}
            onChange={(e) => handleChange('enableNotifications', e.target.checked)}
            className="w-5 h-5 border-3 border-vintage-text rounded"
          />
          <label
            htmlFor="enableNotifications"
            className="font-ui text-lg uppercase tracking-wide text-vintage-text cursor-pointer"
          >
            Enable Wellness Notifications
          </label>
        </div>

        {saveMessage && (
          <div className={`p-4 rounded border-3 ${
            saveMessage.includes('Error')
              ? 'bg-terracotta-light border-terracotta-dark text-terracotta-dark'
              : 'bg-jungle-light border-jungle text-jungle-dark'
          }`}>
            <p className="font-ui">{saveMessage}</p>
          </div>
        )}

        <div className="flex gap-4">
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSettings({
                workStartTime: '09:00',
                workEndTime: '17:00',
                stressThreshold: 70,
                enableNotifications: true,
                ...currentSettings
              });
              setSaveMessage('');
            }}
          >
            Reset
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default WellnessSettings;
