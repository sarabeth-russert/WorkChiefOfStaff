import React, { useState } from 'react';
import { Button, Input, Card } from '../ui';

const AddAppModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    script: '',
    cwd: '',
    port: '',
    env: {}
  });
  const [envKey, setEnvKey] = useState('');
  const [envValue, setEnvValue] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddEnvVar = () => {
    if (envKey && envValue) {
      setFormData(prev => ({
        ...prev,
        env: {
          ...prev.env,
          [envKey]: envValue
        }
      }));
      setEnvKey('');
      setEnvValue('');
    }
  };

  const handleRemoveEnvVar = (key) => {
    setFormData(prev => {
      const newEnv = { ...prev.env };
      delete newEnv[key];
      return { ...prev, env: newEnv };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Build PM2 name from app name
    const pm2Name = formData.name.toLowerCase().replace(/\s+/g, '-');

    const appData = {
      name: formData.name,
      pm2Name,
      script: formData.script,
      cwd: formData.cwd || process.cwd(),
      port: formData.port ? parseInt(formData.port) : null,
      env: formData.env,
      autoStart: false
    };

    onSubmit(appData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-cream rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-jungle">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-poster text-vintage-text">
              Register New Application
            </h2>
            <button
              onClick={onClose}
              className="text-3xl text-vintage-text hover:text-terracotta"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* App Name */}
            <div>
              <label className="block text-sm font-ui uppercase text-vintage-text mb-2">
                Application Name *
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="My Awesome App"
                required
              />
              <p className="text-xs text-vintage-text opacity-70 mt-1">
                A friendly name for your application
              </p>
            </div>

            {/* Script Path */}
            <div>
              <label className="block text-sm font-ui uppercase text-vintage-text mb-2">
                Script Path *
              </label>
              <Input
                name="script"
                value={formData.script}
                onChange={handleChange}
                placeholder="./src/index.js or npm start"
                required
              />
              <p className="text-xs text-vintage-text opacity-70 mt-1">
                Path to your startup script or npm command
              </p>
            </div>

            {/* Working Directory */}
            <div>
              <label className="block text-sm font-ui uppercase text-vintage-text mb-2">
                Working Directory
              </label>
              <Input
                name="cwd"
                value={formData.cwd}
                onChange={handleChange}
                placeholder="/path/to/your/app (optional)"
              />
              <p className="text-xs text-vintage-text opacity-70 mt-1">
                Leave empty to use current directory
              </p>
            </div>

            {/* Port */}
            <div>
              <label className="block text-sm font-ui uppercase text-vintage-text mb-2">
                Port
              </label>
              <Input
                name="port"
                type="number"
                value={formData.port}
                onChange={handleChange}
                placeholder="3000"
              />
              <p className="text-xs text-vintage-text opacity-70 mt-1">
                Port number your app runs on (optional)
              </p>
            </div>

            {/* Environment Variables */}
            <div>
              <label className="block text-sm font-ui uppercase text-vintage-text mb-2">
                Environment Variables
              </label>

              {/* Existing env vars */}
              {Object.keys(formData.env).length > 0 && (
                <div className="mb-3 space-y-2">
                  {Object.entries(formData.env).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 bg-sand p-2 rounded border-2 border-mustard"
                    >
                      <code className="flex-1 text-sm font-mono text-vintage-text">
                        {key}={value}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleRemoveEnvVar(key)}
                        className="text-terracotta hover:text-terracotta-dark"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new env var */}
              <div className="flex gap-2">
                <Input
                  value={envKey}
                  onChange={(e) => setEnvKey(e.target.value)}
                  placeholder="KEY"
                  className="flex-1"
                />
                <Input
                  value={envValue}
                  onChange={(e) => setEnvValue(e.target.value)}
                  placeholder="value"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddEnvVar}
                  disabled={!envKey || !envValue}
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-vintage-text opacity-70 mt-1">
                Add environment variables your app needs
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t-2 border-vintage-text">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
              >
                Register Application
              </Button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-sand rounded border-2 border-teal">
            <p className="text-sm text-vintage-text mb-2">
              <strong>📖 Quick Guide:</strong>
            </p>
            <ul className="text-xs text-vintage-text opacity-80 space-y-1 list-disc list-inside">
              <li>Name: A friendly display name for your app</li>
              <li>Script: Entry point (e.g., "index.js", "npm start", "yarn dev")</li>
              <li>Directory: Where your app files are located</li>
              <li>Port: Where your app listens (helps identify it)</li>
              <li>Env Vars: Configuration like API keys, URLs, etc.</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AddAppModal;
