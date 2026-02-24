import React, { useState } from 'react';
import { Card, Button, Input } from '../ui';
import useJiraStore from '../../stores/jiraStore';

const JiraSettings = () => {
  const { configure, testConnection } = useJiraStore();
  const [config, setConfig] = useState({
    domain: '',
    username: '',
    apiToken: '',
    authMethod: 'bearer', // 'bearer' for PAT (default), 'basic' for username:password
    jiraType: '' // 'cloud' or 'server' - auto-detected if not specified
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      await configure(config);
      alert('Jira configuration saved!');
    } catch (error) {
      alert(`Error saving configuration: ${error.message}`);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await configure(config);
      const result = await testConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, message: error.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card variant="canvas" className="border-teal">
      <div className="mb-6">
        <h3 className="text-2xl font-poster text-vintage-text mb-2">
          🎫 Jira Integration
        </h3>
        <p className="text-sm text-vintage-text opacity-70">
          Connect to Jira Cloud to manage tickets from your Chief of Staff
        </p>
      </div>

      <div className="space-y-4">
        {/* Domain */}
        <div>
          <label className="block text-sm font-ui uppercase text-vintage-text mb-2">
            Jira Domain *
          </label>
          <Input
            name="domain"
            value={config.domain}
            onChange={handleChange}
            placeholder="jira.company.com or company.atlassian.net"
          />
          <p className="text-xs text-vintage-text opacity-70 mt-1">
            Your Jira domain (without https://) - Type is auto-detected
          </p>
        </div>

        {/* Personal Access Token */}
        <div>
          <label className="block text-sm font-ui uppercase text-vintage-text mb-2">
            Personal Access Token *
          </label>
          <Input
            name="apiToken"
            type="password"
            value={config.apiToken}
            onChange={handleChange}
            placeholder="Paste your Personal Access Token (PAT)"
          />
          <p className="text-xs text-vintage-text opacity-70 mt-1">
            <strong>Generate your PAT in Jira:</strong>
            <br />
            Profile → Security → Personal Access Tokens → Create
          </p>
        </div>

        {/* Username (optional for debugging) */}
        <div>
          <label className="block text-sm font-ui uppercase text-vintage-text mb-2">
            Username (Optional)
          </label>
          <Input
            name="username"
            value={config.username}
            onChange={handleChange}
            placeholder="Your Jira username (optional)"
          />
          <p className="text-xs text-vintage-text opacity-70 mt-1">
            Only needed for troubleshooting. PAT authentication doesn't require username.
          </p>
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={`p-3 rounded border-2 ${
              testResult.success
                ? 'bg-jungle bg-opacity-10 border-jungle text-jungle'
                : 'bg-terracotta bg-opacity-10 border-terracotta-dark text-terracotta-dark'
            }`}
          >
            <p className="text-sm font-ui">
              {testResult.success ? '✅' : '❌'} {testResult.message}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t-2 border-vintage-text">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing || !config.domain || !config.apiToken}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!config.domain || !config.apiToken}
          >
            Save Configuration
          </Button>
        </div>
      </div>

      {/* Help */}
      <div className="mt-6 p-4 bg-sand rounded border-2 border-teal">
        <p className="text-sm text-vintage-text mb-2">
          <strong>📖 Quick Setup Guide (Updated for PAT):</strong>
        </p>
        <div className="text-xs text-vintage-text opacity-80 space-y-2">
          <div>
            <p className="font-semibold">✅ For SSO Users (Recommended):</p>
            <ol className="list-decimal list-inside ml-2 space-y-1">
              <li>Log into Jira → Profile → Security</li>
              <li>Generate a Personal Access Token (PAT)</li>
              <li>Copy the PAT immediately</li>
              <li>Enter domain: jira.company.com (no https://)</li>
              <li>Paste your PAT in the token field</li>
              <li>Leave username blank (not needed for PAT)</li>
            </ol>
          </div>
          <div className="mt-2 p-2 bg-jungle bg-opacity-10 rounded">
            <p className="font-semibold text-jungle-dark">🔑 Authentication Method:</p>
            <p className="mt-1">Now using Bearer token authentication (like PortOS) for better PAT support!</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default JiraSettings;
