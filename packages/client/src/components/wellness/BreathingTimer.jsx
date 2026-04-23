import React, { useState, useEffect, useRef, useCallback } from 'react';

const BACKDROP_IMAGE = '/images/pages/breathing-backdrop.png';

const BreathingTimer = ({ onClose }) => {
  const [duration, setDuration] = useState(null); // null = selecting, 180 or 300
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [backdropLoaded, setBackdropLoaded] = useState(false);
  const intervalRef = useRef(null);

  const start = useCallback((seconds) => {
    setDuration(seconds);
    setRemaining(seconds);
    setRunning(true);
    setFinished(false);
  }, []);

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const togglePause = () => {
    if (running) {
      clearInterval(intervalRef.current);
      setRunning(false);
    } else if (remaining > 0) {
      setRunning(true);
    }
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setFinished(false);
    setDuration(null);
    setRemaining(0);
  };

  // Play bird chirp sound when timer finishes
  useEffect(() => {
    if (!finished) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playChirp = (time, freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.8, time + 0.07);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.3, time + 0.12);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.25, time + 0.02);
        gain.gain.linearRampToValueAtTime(0.15, time + 0.07);
        gain.gain.linearRampToValueAtTime(0, time + 0.12);
        osc.connect(gain).connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.12);
      };
      const t = ctx.currentTime;
      playChirp(t, 2200);
      playChirp(t + 0.18, 2600);
      playChirp(t + 0.36, 2400);
      playChirp(t + 0.7, 2200);
      playChirp(t + 0.85, 2800);
      playChirp(t + 1.0, 2500);
      setTimeout(() => ctx.close(), 2000);
    } catch {
      // Audio not available
    }
  }, [finished]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = duration ? 1 - remaining / duration : 0;
  const circumference = 2 * Math.PI * 120;
  const strokeOffset = circumference * (1 - progress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop: jungle river image with dark overlay, or solid fallback */}
      {backdropLoaded && (
        <img
          src={BACKDROP_IMAGE}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className={`absolute inset-0 ${backdropLoaded ? 'bg-vintage-text bg-opacity-40' : 'bg-vintage-text bg-opacity-60'} backdrop-blur-[2px]`} />
      {/* Preload the backdrop image */}
      <img
        src={BACKDROP_IMAGE}
        alt=""
        className="hidden"
        onLoad={() => setBackdropLoaded(true)}
      />

      <div className="bg-cream bg-opacity-95 rounded-lg shadow-vintage border-3 border-sand-dark w-full max-w-md mx-4 p-8 relative z-10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-vintage-text opacity-40 hover:opacity-80 text-xl leading-none"
        >
          &times;
        </button>

        <h2 className="text-3xl font-poster text-vintage-text text-letterpress text-center mb-6">
          Breathing Timer
        </h2>

        {/* Duration selection */}
        {!duration && !finished && (
          <div className="text-center space-y-4">
            <p className="font-serif text-vintage-text opacity-70 mb-6">
              Choose your session length
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => start(180)}
                className="w-32 h-32 rounded-full border-3 border-teal bg-teal bg-opacity-10 hover:bg-opacity-20 transition-colors flex flex-col items-center justify-center"
              >
                <span className="text-3xl font-poster text-teal">3</span>
                <span className="text-xs font-ui uppercase text-teal opacity-80">minutes</span>
              </button>
              <button
                onClick={() => start(300)}
                className="w-32 h-32 rounded-full border-3 border-jungle bg-jungle bg-opacity-10 hover:bg-opacity-20 transition-colors flex flex-col items-center justify-center"
              >
                <span className="text-3xl font-poster text-jungle">5</span>
                <span className="text-xs font-ui uppercase text-jungle opacity-80">minutes</span>
              </button>
            </div>
          </div>
        )}

        {/* Active timer */}
        {duration && !finished && (
          <div className="text-center space-y-6">
            {/* Circular progress */}
            <div className="relative inline-block">
              <svg width="260" height="260" className="transform -rotate-90">
                {/* Background ring */}
                <circle
                  cx="130" cy="130" r="120"
                  fill="none"
                  stroke="currentColor"
                  className="text-sand-dark"
                  strokeWidth="6"
                />
                {/* Progress ring */}
                <circle
                  cx="130" cy="130" r="120"
                  fill="none"
                  stroke="currentColor"
                  className="text-teal transition-all duration-1000 ease-linear"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                />
              </svg>
              {/* Time display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-poster text-vintage-text tabular-nums">
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </span>
                <span className="text-xs font-ui uppercase text-vintage-text opacity-50 mt-1">
                  {running ? 'remaining' : 'paused'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              <button
                onClick={togglePause}
                className="px-6 py-3 rounded border-3 border-teal bg-teal bg-opacity-10 font-ui uppercase text-sm text-teal tracking-wide hover:bg-opacity-20 transition-colors"
              >
                {running ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={reset}
                className="px-6 py-3 rounded border-3 border-sand-dark font-ui uppercase text-sm text-vintage-text opacity-60 tracking-wide hover:opacity-100 transition-opacity"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Finished state */}
        {finished && (
          <div className="text-center space-y-6">
            <div className="relative inline-block">
              <svg width="260" height="260" className="transform -rotate-90">
                <circle
                  cx="130" cy="130" r="120"
                  fill="none"
                  stroke="currentColor"
                  className="text-jungle"
                  strokeWidth="6"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-poster text-jungle">Done</span>
                <span className="text-sm font-serif text-vintage-text opacity-60 mt-2">
                  Great work, adventurer
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={reset}
                className="px-6 py-3 rounded border-3 border-teal bg-teal bg-opacity-10 font-ui uppercase text-sm text-teal tracking-wide hover:bg-opacity-20 transition-colors"
              >
                Go Again
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded border-3 border-sand-dark font-ui uppercase text-sm text-vintage-text opacity-60 tracking-wide hover:opacity-100 transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BreathingTimer;
