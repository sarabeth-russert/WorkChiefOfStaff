import React, { useState, useEffect } from 'react';
import { Card } from '../ui';
import Button from '../ui/Button';
import Input from '../ui/Input';

const OuraSetup = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState(window.location.origin + '/medic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authState, setAuthState] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || '';

  // Check for OAuth callback code in URL
  useEffect(() => {
    // Prevent duplicate execution (React StrictMode calls useEffect twice)
    let isProcessing = sessionStorage.getItem('oura_oauth_processing');
    if (isProcessing === 'true') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (code && state) {
      sessionStorage.setItem('oura_oauth_processing', 'true');
      handleOAuthCallback(code, state);
    }
  }, []);

  const handleOAuthCallback = async (code, state) => {
    // Retrieve stored state and redirectUri from sessionStorage
    const storedState = sessionStorage.getItem('oura_oauth_state');
    const storedRedirectUri = sessionStorage.getItem('oura_redirect_uri');

    console.log('OAuth Callback Debug:', {
      urlState: state,
      storedState: storedState,
      storedRedirectUri: storedRedirectUri,
      match: state === storedState
    });

    if (state !== storedState) {
      setError(`Invalid state parameter. Expected: ${storedState?.substring(0, 10)}..., Got: ${state?.substring(0, 10)}...`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/wellness/oauth/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri: storedRedirectUri })
      });

      const data = await response.json();

      if (data.success) {
        // Clear stored state and redirectUri
        sessionStorage.removeItem('oura_oauth_state');
        sessionStorage.removeItem('oura_redirect_uri');
        sessionStorage.removeItem('oura_oauth_processing');

        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);

        // Success!
        setCurrentStep(4);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 2000);
      } else {
        sessionStorage.removeItem('oura_oauth_processing');
        setError(data.error || 'Failed to complete OAuth');
      }
    } catch (err) {
      sessionStorage.removeItem('oura_oauth_processing');
      setError('Network error during OAuth callback');
    } finally {
      setLoading(false);
    }
  };

  const handleStartOAuth = async () => {
    if (!clientId || !clientSecret) {
      setError('Please enter both Client ID and Client Secret');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/wellness/oauth/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret, redirectUri })
      });

      const data = await response.json();

      if (data.success) {
        // Save state and redirectUri for CSRF protection in sessionStorage
        sessionStorage.setItem('oura_oauth_state', data.state);
        sessionStorage.setItem('oura_redirect_uri', redirectUri);
        setAuthState(data.state);

        console.log('Stored OAuth state:', data.state.substring(0, 10) + '...');
        console.log('Redirect URI:', redirectUri);

        // Redirect to Oura authorization page
        window.location.href = data.authUrl;
      } else {
        setError(data.error || 'Failed to initialize OAuth');
      }
    } catch (err) {
      setError('Network error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      number: 1,
      title: 'Create Oura OAuth Application',
      content: (
        <div className="space-y-4">
          <p className="text-vintage-text">
            To connect your Oura Ring data, you'll need to create an OAuth application.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-vintage-text ml-4">
            <li>Visit <a href="https://cloud.ouraring.com/oauth/applications" target="_blank" rel="noopener noreferrer" className="text-terracotta hover:text-terracotta-dark underline">cloud.ouraring.com/oauth/applications</a></li>
            <li>Click "Create New OAuth Application"</li>
            <li>Fill in the required fields:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li><strong>Name:</strong> Chief of Staff</li>
                <li><strong>Website:</strong> http://localhost:5173</li>
                <li><strong>Redirect URI:</strong> {redirectUri}</li>
                <li><strong>Privacy Policy:</strong> http://localhost:5173/privacy</li>
                <li><strong>Terms of Service:</strong> http://localhost:5173/terms</li>
              </ul>
            </li>
            <li>Save the application</li>
            <li>Copy your <strong>Client ID</strong> and <strong>Client Secret</strong></li>
          </ol>
        </div>
      )
    },
    {
      number: 2,
      title: 'Enter OAuth Credentials',
      content: (
        <div className="space-y-4">
          <p className="text-vintage-text mb-4">
            Enter the Client ID and Client Secret from your Oura OAuth application.
          </p>

          {error && (
            <div className="bg-terracotta-light border-2 border-terracotta p-3 rounded">
              <p className="text-terracotta-dark text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-ui text-vintage-text mb-2">
                Client ID *
              </label>
              <Input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Enter your Client ID"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-ui text-vintage-text mb-2">
                Client Secret *
              </label>
              <Input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Enter your Client Secret"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-ui text-vintage-text mb-2">
                Redirect URI
              </label>
              <Input
                type="text"
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
                placeholder="http://localhost:5173/medic"
                className="w-full"
              />
              <p className="text-xs text-vintage-text opacity-70 mt-1">
                This must match the Redirect URI in your Oura application
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      number: 3,
      title: 'Authorize Access',
      content: (
        <div className="space-y-4">
          <p className="text-vintage-text">
            Click the button below to authorize Chief of Staff to access your Oura Ring data.
          </p>
          <p className="text-vintage-text text-sm opacity-80">
            You'll be redirected to Oura's authorization page. After granting access, you'll be redirected back here.
          </p>
          <div className="bg-jungle-light p-4 rounded border-2 border-jungle">
            <p className="text-vintage-text font-ui text-sm">
              <strong>Permissions requested:</strong>
            </p>
            <ul className="list-disc list-inside text-vintage-text text-sm mt-2 ml-2">
              <li>Daily sleep data</li>
              <li>Heart rate and HRV data</li>
              <li>Activity and workout data</li>
              <li>Tags and personal information</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      number: 4,
      title: 'All Set!',
      content: (
        <div className="space-y-4">
          <div className="bg-jungle-light p-6 rounded border-2 border-jungle text-center">
            <div className="text-6xl mb-4">✓</div>
            <p className="text-vintage-text font-poster text-xl mb-2">
              Successfully Connected!
            </p>
            <p className="text-vintage-text font-ui">
              Your Oura Ring is now connected to Chief of Staff.
            </p>
          </div>
          <p className="text-vintage-text text-sm">
            The system will automatically:
          </p>
          <ul className="list-disc list-inside space-y-2 text-vintage-text ml-4 text-sm">
            <li>Sync your wellness data daily</li>
            <li>Send morning standup notifications at 8:30 AM</li>
            <li>Send evening retro notifications at 6:00 PM</li>
            <li>Monitor stress levels during work hours (9 AM - 6 PM)</li>
            <li>Alert you when high stress is detected</li>
          </ul>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep === 2) {
      // Validate and move to authorization step
      if (!clientId || !clientSecret) {
        setError('Please enter both Client ID and Client Secret');
        return;
      }
      setError(null);
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Start OAuth flow
      handleStartOAuth();
    } else if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1 && currentStep !== 4) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const currentStepData = steps[currentStep - 1];

  return (
    <Card>
      <div className="mb-6">
        <h3 className="text-2xl font-poster text-vintage-text mb-2">
          Oura Ring OAuth Setup
        </h3>
        <div className="flex gap-2">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`flex-1 h-2 rounded-full border-2 border-vintage-text ${
                step.number <= currentStep ? 'bg-terracotta' : 'bg-sand'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-terracotta text-cream flex items-center justify-center font-poster text-xl border-3 border-terracotta-dark">
            {currentStepData.number}
          </div>
          <h4 className="text-xl font-poster text-vintage-text">
            {currentStepData.title}
          </h4>
        </div>
        <div className="pl-15">
          {currentStepData.content}
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t-2 border-vintage-text">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1 || currentStep === 4 || loading}
        >
          Previous
        </Button>
        <div className="text-sm font-ui text-vintage-text">
          Step {currentStep} of {steps.length}
        </div>
        <Button
          variant="primary"
          onClick={handleNext}
          disabled={loading || currentStep === 4}
        >
          {loading ? 'Loading...' :
           currentStep === 3 ? 'Authorize with Oura' :
           currentStep === steps.length ? 'Complete' : 'Next'}
        </Button>
      </div>
    </Card>
  );
};

export default OuraSetup;
