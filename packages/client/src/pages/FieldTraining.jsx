import React, { useEffect, useState, useRef, useCallback } from 'react';
import useTrainingStore from '../stores/trainingStore';
import useToastStore from '../stores/toastStore';
import { Card, Button } from '../components/ui';

// ── Domain images ──

const DOMAIN_IMAGES = {
  attention: '/images/training/attention.png',
  'ear-training': '/images/training/ear-training.png',
  imagination: '/images/training/imagination.png',
  logic: '/images/training/logic.png',
  math: '/images/training/math.png',
  memory: '/images/training/memory.png',
  processing: '/images/training/processing.png',
  spatial: '/images/training/spatial.png',
  temporal: '/images/training/temporal.png',
  verbal: '/images/training/verbal.png',
  wordplay: '/images/training/wordplay.png'
};

// ── Domain config for display ──

const DOMAIN_META = {
  attention: { label: 'Attention', icon: '👁', color: 'text-terracotta', bg: 'bg-terracotta/10', border: 'border-terracotta' },
  'ear-training': { label: 'Ear Training', icon: '🎵', color: 'text-teal', bg: 'bg-teal/10', border: 'border-teal' },
  imagination: { label: 'Imagination', icon: '✨', color: 'text-terracotta', bg: 'bg-terracotta/10', border: 'border-terracotta' },
  logic: { label: 'Logic', icon: '🧩', color: 'text-mustard', bg: 'bg-mustard/10', border: 'border-mustard' },
  math: { label: 'Mental Math', icon: '🧮', color: 'text-teal', bg: 'bg-teal/10', border: 'border-teal' },
  memory: { label: 'Memory', icon: '🧠', color: 'text-jungle', bg: 'bg-jungle/10', border: 'border-jungle' },
  processing: { label: 'Speed', icon: '⚡', color: 'text-sunset', bg: 'bg-sunset/10', border: 'border-sunset' },
  spatial: { label: 'Spatial', icon: '🔲', color: 'text-jungle', bg: 'bg-jungle/10', border: 'border-jungle' },
  temporal: { label: 'Time Sense', icon: '⏱', color: 'text-teal', bg: 'bg-teal/10', border: 'border-teal' },
  verbal: { label: 'Verbal Agility', icon: '🎙', color: 'text-mustard', bg: 'bg-mustard/10', border: 'border-mustard' },
  wordplay: { label: 'Wordplay', icon: '💬', color: 'text-sunset', bg: 'bg-sunset/10', border: 'border-sunset' }
};

const DRILL_LABELS = {
  'doubling-chain': 'Doubling Chain', 'serial-subtraction': 'Serial Subtraction',
  'multiplication': 'Multiplication', 'estimation': 'Estimation',
  'sequence-recall': 'Sequence Recall', 'word-association': 'Word Association',
  'pun-creation': 'Pun Creation', 'wit-comeback': 'Wit Comeback',
  'verbal-fluency': 'Verbal Fluency', 'what-if': 'What If?',
  'alternative-uses': 'Alternative Uses', 'interval-id': 'Interval ID',
  'pattern-sequence': 'Pattern Sequence', 'coordinate-tracking': 'Coordinate Tracking',
  'stroop': 'Stroop Test', 'rapid-compare': 'Rapid Compare',
  'syllogism': 'Syllogism', 'ordering': 'Ordering',
  'flanker': 'Flanker', 'odd-one-out': 'Odd One Out',
  'time-estimation': 'Time Estimation'
};

// ── Domain groupings by expedition discipline ──

const DOMAIN_GROUPS = [
  {
    name: 'Observation Corps',
    insignia: '🔭',
    description: 'Sharpen what you see and how fast you see it',
    domains: ['attention', 'spatial', 'processing']
  },
  {
    name: 'Signal Division',
    insignia: '⚡',
    description: 'Master language, sound, and expression',
    domains: ['wordplay', 'verbal', 'ear-training']
  },
  {
    name: 'Strategy Bureau',
    insignia: '🧭',
    description: 'Calculation, deduction, and creative thinking',
    domains: ['math', 'logic', 'imagination']
  },
  {
    name: 'Archives & Chronometry',
    insignia: '🕰',
    description: 'Memory recall and temporal awareness',
    domains: ['memory', 'temporal']
  }
];

// ── Main Page ──

export default function FieldTraining() {
  const {
    sessionPhase, drills, stats, sessions, todayCompleted, loading, error,
    fetchConfig, fetchSessions, startSession, resetSession
  } = useTrainingStore();

  useEffect(() => {
    fetchConfig();
    fetchSessions();
  }, []);

  return (
    <div className="min-h-screen bg-cream-light paper-texture py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Hero — let the art breathe */}
        <div className="relative rounded-lg overflow-hidden shadow-vintage mb-2">
          <img
            src="/images/pages/field-training-header.png"
            alt="Field Training expedition grounds"
            className="w-full h-52 md:h-72 object-cover"
            onError={(e) => e.target.style.display = 'none'}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream/40" />
          {/* Subtle badge inside banner */}
          <div className="absolute top-4 left-4">
            <span className="inline-block bg-vintage-text/60 text-cream px-3 py-1 rounded font-ui text-xs uppercase tracking-widest">
              Today's Expedition
            </span>
          </div>
        </div>

        {/* Title below banner — collectible poster feel */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-poster text-vintage-text text-letterpress mb-1">
            Field Training
          </h1>
          <p className="font-serif text-vintage-text/50 text-base italic">
            Five-minute field exercises for the explorer's mind
          </p>
        </div>

        {error && (
          <div className="bg-terracotta/10 border-2 border-terracotta rounded-lg p-4 mb-6 font-serif text-terracotta-dark">
            {error}
          </div>
        )}

        {sessionPhase === 'idle' && (
          <SessionLauncher
            stats={stats}
            sessions={sessions}
            todayCompleted={todayCompleted}
            loading={loading}
            onStart={startSession}
          />
        )}

        {sessionPhase === 'drilling' && <DrillRunner />}
        {sessionPhase === 'between' && <BetweenDrills />}
        {sessionPhase === 'scoring' && <ScoringScreen />}
        {sessionPhase === 'results' && <SessionResults onReset={resetSession} />}
      </div>
    </div>
  );
}

// ── Session Launcher ──

function SessionLauncher({ stats, sessions, todayCompleted, loading, onStart }) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="space-y-8">
      {/* Expedition Instruments — stats row */}
      {stats && stats.totalSessions > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon="⏱" label="Expeditions Logged" value={stats.totalSessions} suffix={stats.totalSessions === 1 ? ' session' : ' sessions'} />
          <StatCard icon="🧭" label="Average Bearing" value={stats.averageScore} suffix="%" />
          <StatCard icon="🏅" label="Peak Performance" value={stats.bestScore} suffix="%" />
          <StatCard icon="🪔" label="Current Streak" value={stats.streak} suffix={stats.streak === 1 ? ' day' : ' days'} />
        </div>
      )}

      {/* Daily Dispatch — field briefing card */}
      <div className="relative">
        {/* Pin holes */}
        <div className="absolute -top-2 left-8 w-4 h-4 rounded-full bg-vintage-text/20 border-2 border-vintage-text/30 z-10" />
        <div className="absolute -top-2 right-8 w-4 h-4 rounded-full bg-vintage-text/20 border-2 border-vintage-text/30 z-10" />

        <Card variant="canvas" className="text-center py-8 border-dashed !bg-cream-dark">
          {todayCompleted ? (
            <>
              {/* Brass stamp feel */}
              <div className="inline-block border-3 border-jungle rounded-lg px-5 py-2 mb-4 rotate-[-2deg]">
                <span className="font-poster text-2xl text-jungle uppercase tracking-wider">Mission Complete</span>
              </div>
              <p className="font-serif text-vintage-text/50 mb-6 italic">
                Today's exercises have been logged. Another sortie may be launched for extra practice.
              </p>
            </>
          ) : (
            <>
              <div className="font-ui text-xs uppercase tracking-widest text-vintage-text/40 mb-2">
                — Field Dispatch —
              </div>
              <h2 className="text-2xl font-poster text-vintage-text mb-1">Orders for Today</h2>
              <p className="font-serif text-vintage-text/50 mb-6 italic">
                11 disciplines standing by. Quick drill draws 5 at random.
              </p>
            </>
          )}

          <div className="flex justify-center items-end gap-5 flex-wrap">
            {/* Ticket stub — quick option */}
            <button
              onClick={() => onStart('quick')}
              disabled={loading}
              className="group border-2 border-dashed border-sand-dark/40 rounded bg-cream hover:bg-sand/30 px-5 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
            >
              <div className="font-poster text-lg text-vintage-text uppercase tracking-wide">
                {loading ? 'Assembling...' : 'Quick Drill'}
              </div>
              <div className="font-ui text-[10px] uppercase tracking-widest text-vintage-text/35 mt-0.5">5 random domains</div>
            </button>

            {/* Primary plaque — full expedition */}
            <Button variant="primary" size="lg" onClick={() => onStart('full')} disabled={loading} className="px-10 py-5 text-xl">
              Full Expedition
            </Button>
          </div>

          <div className="mt-4 font-ui text-[10px] uppercase tracking-widest text-vintage-text/30 text-center">
            Choose your sortie
          </div>
        </Card>
      </div>

      {/* Domain Badges — grouped by expedition discipline */}
      <div className="space-y-8">
        {DOMAIN_GROUPS.map((group) => (
          <div key={group.name}>
            {/* Discipline header — expedition insignia motif */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-vintage-text/15" />
              <h3 className="font-ui text-sm uppercase tracking-widest text-vintage-text/50 flex items-center gap-2">
                <span className="text-base opacity-50">{group.insignia}</span>
                {group.name}
                <span className="text-mustard/50">✦</span>
              </h3>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-vintage-text/15" />
            </div>

            {/* Archive drawer cards for 2-domain groups */}
            {group.domains.length === 2 ? (
              <div className="grid grid-cols-2 gap-5 max-w-2xl mx-auto">
                {group.domains.map((key) => {
                  const meta = DOMAIN_META[key];
                  if (!meta) return null;
                  return (
                    <button
                      key={key}
                      onClick={() => onStart('single', key)}
                      disabled={loading}
                      className="bg-cream border-2 border-sand rounded-lg overflow-hidden shadow-sm hover:shadow-vintage transition-all hover:-translate-y-0.5 active:translate-y-0 text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {/* Accent stripe */}
                      <div className={`h-1 ${meta.bg.replace('/10', '')} opacity-50`} />
                      <div className="flex items-center gap-5 px-6 py-5">
                        <DomainIcon domain={key} fallback={meta.icon} size="w-28 h-28" />
                        <div>
                          <div className={`font-ui text-sm uppercase tracking-widest ${meta.color}`}>
                            {meta.label}
                          </div>
                          <div className={`h-1 w-12 mt-2 rounded-full ${meta.bg.replace('/10', '')} opacity-40`} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-5">
                {group.domains.map((key) => {
                  const meta = DOMAIN_META[key];
                  if (!meta) return null;
                  return (
                    <button
                      key={key}
                      onClick={() => onStart('single', key)}
                      disabled={loading}
                      className="bg-cream border-2 border-sand rounded-lg overflow-hidden shadow-sm hover:shadow-vintage transition-all hover:-translate-y-0.5 active:translate-y-0 text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {/* Color accent stripe */}
                      <div className={`h-1.5 ${meta.bg.replace('/10', '')} opacity-60`} />
                      <div className="px-2 pt-4 pb-3 text-center">
                        <DomainIcon domain={key} fallback={meta.icon} size="w-32 h-32" />
                        <div className={`font-ui text-[10px] uppercase tracking-widest mt-1 ${meta.color} opacity-70`}>
                          {meta.label}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Field Log — session history (lighter treatment) */}
      {sessions && sessions.length > 0 && (
        <div className="border-t border-sand/60 pt-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between py-2"
          >
            <h3 className="font-ui text-sm uppercase tracking-widest text-vintage-text/40">Field Log</h3>
            <span className={`text-vintage-text/30 text-xs transition-transform ${showHistory ? 'rotate-180' : ''}`}>&#9660;</span>
          </button>

          {showHistory && (
            <div className="mt-2 space-y-1">
              {sessions.slice(0, 10).map((session) => (
                <div key={session.id} className="flex items-center justify-between py-1.5 border-b border-sand/40 last:border-0">
                  <div className="font-serif text-sm text-vintage-text/50">
                    {new Date(session.timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-vintage-text/35">
                      {Math.floor(session.duration / 60)}m {session.duration % 60}s
                    </span>
                    <ScoreBadge score={session.overallScore} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Drill Runner ──

function DrillRunner() {
  const {
    drills, currentDrillIndex, currentQuestionIndex, answers,
    submitAnswer, skipQuestion
  } = useTrainingStore();

  const drill = drills[currentDrillIndex];
  const question = drill?.questions[currentQuestionIndex];
  const domain = DOMAIN_META[drill?.domain] || DOMAIN_META.math;
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(drill?.timeBudget || 60);
  const [memoryPhase, setMemoryPhase] = useState('memorize');
  const [memoryTimer, setMemoryTimer] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const questionStartRef = useRef(Date.now());
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Play two tones for ear training
  const playNotes = useCallback((note1Freq, note2Freq, duration = 0.7) => {
    if (isPlaying) return;
    setIsPlaying(true);
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;
    const gap = 0.3;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.frequency.value = note1Freq;
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + duration);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.frequency.value = note2Freq;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.3, now + duration + gap);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 2 * duration + gap);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + duration + gap);
    osc2.stop(now + 2 * duration + gap);

    setTimeout(() => setIsPlaying(false), (2 * duration + gap) * 1000 + 100);
  }, [isPlaying]);

  // Reset input when question changes
  useEffect(() => {
    setInput('');
    questionStartRef.current = Date.now();
    inputRef.current?.focus();
  }, [currentDrillIndex, currentQuestionIndex]);

  // Auto-play ear training notes
  useEffect(() => {
    if (question?.earTraining) {
      const t = setTimeout(() => {
        playNotes(question.earTraining.note1Freq, question.earTraining.note2Freq, question.earTraining.duration);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [currentDrillIndex, currentQuestionIndex]);

  // Timer (skip for temporal drills)
  useEffect(() => {
    if (drill?.type === 'time-estimation') return;
    setTimeLeft(drill?.timeBudget || 60);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          skipQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentDrillIndex]);

  // Memory drill: memorize phase
  useEffect(() => {
    if (drill?.type === 'sequence-recall') {
      setMemoryPhase('memorize');
      setMemoryTimer(10);
      const t = setInterval(() => {
        setMemoryTimer(prev => {
          if (prev <= 1) {
            clearInterval(t);
            setMemoryPhase('recall');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(t);
    }
  }, [currentDrillIndex]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const responseTime = (Date.now() - questionStartRef.current) / 1000;
    submitAnswer(input.trim(), responseTime);
    setInput('');
  }, [input, submitAnswer]);

  const handleChoice = useCallback((choice) => {
    const responseTime = (Date.now() - questionStartRef.current) / 1000;
    submitAnswer(choice, responseTime);
  }, [submitAnswer]);

  const handleTemporalPress = useCallback(() => {
    const elapsed = (Date.now() - questionStartRef.current) / 1000;
    submitAnswer(elapsed.toFixed(1), elapsed);
  }, [submitAnswer]);

  if (!drill || !question) return null;

  const isMathDrill = drill.domain === 'math';
  const isMemoryDrill = drill.type === 'sequence-recall';
  const isTemporal = !!question.temporal;
  const isEarTraining = !!question.earTraining;
  const isStroop = !!question.stroopWord;
  const hasChoices = !!question.choices;
  const progress = ((currentQuestionIndex + 1) / drill.questions.length) * 100;
  const timerPercent = (timeLeft / (drill.timeBudget || 60)) * 100;
  const timerColor = timerPercent > 25 ? 'bg-jungle' : timerPercent > 10 ? 'bg-mustard' : 'bg-terracotta';

  return (
    <Card variant="canvas" className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{domain.icon}</span>
          <span className={`font-ui uppercase tracking-wide text-sm ${domain.color}`}>
            {DRILL_LABELS[drill.type] || drill.type}
          </span>
        </div>
        <span className="font-mono text-sm text-vintage-text/50">
          Drill {currentDrillIndex + 1} of {drills.length}
        </span>
      </div>

      {/* Timer Bar (hidden for temporal) */}
      {!isTemporal && (
        <>
          <div className="h-2 bg-sand rounded-full mb-1 overflow-hidden">
            <div className={`h-full ${timerColor} transition-all duration-1000 rounded-full`} style={{ width: `${timerPercent}%` }} />
          </div>
          <div className="text-right font-mono text-xs text-vintage-text/40 mb-4">{timeLeft}s remaining</div>
        </>
      )}

      {/* Question */}
      <div className="bg-cream border-2 border-sand rounded-lg p-6 mb-4 min-h-[120px] flex flex-col items-center justify-center">
        {isMemoryDrill && memoryPhase === 'memorize' ? (
          <div className="text-center">
            <p className="font-serif text-vintage-text/60 mb-3 text-sm">Memorize this sequence ({memoryTimer}s)</p>
            <p className="font-mono text-lg text-vintage-text leading-relaxed">
              {drill.sequence.join('  →  ')}
            </p>
          </div>
        ) : isStroop ? (
          <div className="text-center">
            <p className="font-serif text-sm text-vintage-text/50 mb-3">{question.prompt}</p>
            <p className="text-6xl font-poster leading-tight" style={{ color: question.stroopColor }}>
              {question.stroopWord}
            </p>
          </div>
        ) : isEarTraining ? (
          <div className="text-center">
            <p className="font-mono text-lg text-vintage-text mb-4">{question.prompt}</p>
            <button
              onClick={() => playNotes(question.earTraining.note1Freq, question.earTraining.note2Freq, question.earTraining.duration)}
              disabled={isPlaying}
              className={`px-6 py-3 rounded-lg font-ui text-lg transition-colors ${isPlaying ? 'bg-sand text-vintage-text/40' : 'bg-teal/20 text-teal hover:bg-teal/30'}`}
            >
              {isPlaying ? '♫ Playing...' : '🔊 Play Again'}
            </button>
          </div>
        ) : isTemporal ? (
          <div className="text-center">
            <p className="text-5xl mb-3">⏱</p>
            <p className="font-mono text-lg text-vintage-text">{question.prompt}</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="font-mono text-lg text-vintage-text whitespace-pre-line">
              {isMemoryDrill ? 'Now recall the sequence in order (comma-separated):' : question.prompt}
            </p>
            {question.instruction && (
              <p className="font-serif text-sm text-vintage-text/60 mt-2">{question.instruction}</p>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      {!(isMemoryDrill && memoryPhase === 'memorize') && (
        isTemporal ? (
          <div className="text-center mb-4">
            <Button variant="primary" size="lg" onClick={handleTemporalPress}>
              Now!
            </Button>
          </div>
        ) : hasChoices ? (
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {question.choices.map(choice => (
              <button
                key={choice}
                onClick={() => handleChoice(choice)}
                className="px-5 py-3 border-2 border-sand rounded-lg font-mono text-vintage-text hover:bg-sand/30 active:bg-sand/50 transition-colors capitalize"
              >
                {choice}
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-3 mb-4">
            <input
              ref={inputRef}
              type={isMathDrill ? 'number' : 'text'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isMathDrill ? 'Your answer...' : 'Type your response...'}
              className="flex-1 px-4 py-3 bg-cream border-2 border-sand rounded-lg font-mono text-vintage-text focus:border-teal focus:outline-none"
              autoFocus
            />
            <Button variant="primary" type="submit" disabled={!input.trim()}>
              Enter
            </Button>
          </form>
        )
      )}

      {/* Skip + Progress */}
      <div className="flex items-center justify-between">
        {!(isMemoryDrill && memoryPhase === 'memorize') && !isTemporal && !hasChoices ? (
          <button onClick={skipQuestion} className="font-ui text-sm text-vintage-text/40 hover:text-vintage-text/60 uppercase tracking-wide">
            Skip
          </button>
        ) : <div />}
        <div className="flex items-center gap-2">
          <div className="w-32 h-1.5 bg-sand rounded-full overflow-hidden">
            <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="font-mono text-xs text-vintage-text/40">
            {currentQuestionIndex + 1}/{drill.questions.length}
          </span>
        </div>
      </div>
    </Card>
  );
}

// ── Between Drills ──

function BetweenDrills() {
  const { drills, currentDrillIndex, nextDrill } = useTrainingStore();
  const isLast = currentDrillIndex >= drills.length - 1;
  const nextDrillData = !isLast ? drills[currentDrillIndex + 1] : null;
  const nextDomain = nextDrillData ? DOMAIN_META[nextDrillData.domain] : null;

  return (
    <Card variant="canvas" className="max-w-2xl mx-auto text-center py-8">
      {isLast ? (
        <>
          <div className="text-5xl mb-4">🏁</div>
          <h2 className="text-2xl font-poster text-vintage-text mb-2">All Drills Complete</h2>
          <p className="font-serif text-vintage-text/60 mb-6 italic">The expedition data is ready for scoring.</p>
          <Button variant="primary" size="lg" onClick={nextDrill}>
            File My Report
          </Button>
        </>
      ) : (
        <>
          <div className="text-4xl mb-3">{nextDomain?.icon || '➡️'}</div>
          <div className="font-ui text-xs uppercase tracking-widest text-vintage-text/40 mb-1">Next Station</div>
          <h2 className="text-2xl font-poster text-vintage-text mb-1">
            {DRILL_LABELS[nextDrillData.type]}
          </h2>
          <p className={`font-ui text-sm uppercase tracking-wide ${nextDomain?.color || ''} mb-6`}>
            {nextDomain?.label} — {nextDrillData.timeBudget}s
          </p>
          <Button variant="primary" size="lg" onClick={nextDrill}>
            Begin Drill {currentDrillIndex + 2} of {drills.length}
          </Button>
        </>
      )}
    </Card>
  );
}

// ── Scoring Screen ──

function ScoringScreen() {
  return (
    <Card variant="canvas" className="max-w-2xl mx-auto text-center py-12">
      <div className="animate-pulse">
        <div className="text-5xl mb-4">🔬</div>
        <h2 className="text-2xl font-poster text-vintage-text mb-2">Evaluating Field Data</h2>
        <p className="font-serif text-vintage-text/60 italic">
          The expedition review board is scoring your responses...
        </p>
      </div>
    </Card>
  );
}

// ── Session Results ──

function SessionResults({ onReset }) {
  const { sessionResults, fetchSessions } = useTrainingStore();
  const [expandedDrill, setExpandedDrill] = useState(null);
  const toast = useToastStore;

  if (!sessionResults) {
    return (
      <Card variant="canvas" className="max-w-2xl mx-auto text-center py-8">
        <p className="font-serif text-vintage-text/60">No field report available.</p>
        <Button variant="secondary" className="mt-4" onClick={onReset}>Return to Base</Button>
      </Card>
    );
  }

  const { overallScore, drillResults, duration } = sessionResults;
  const scoreColor = overallScore >= 80 ? 'text-jungle' : overallScore >= 50 ? 'text-mustard' : 'text-terracotta';

  const handleReset = () => {
    fetchSessions();
    onReset();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Overall Score */}
      <Card variant="canvas" className="text-center py-8">
        <div className="font-ui text-xs uppercase tracking-widest text-vintage-text/40 mb-2">— Expedition Report —</div>
        <div className={`text-7xl font-poster ${scoreColor} mb-2`}>{overallScore}%</div>
        <p className="font-serif text-vintage-text/50 text-sm">
          {Math.floor(duration / 60)}m {duration % 60}s in the field
        </p>
      </Card>

      {/* Domain Breakdown */}
      {sessionResults.domainScores && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(sessionResults.domainScores).map(([domain, scores]) => {
            const meta = DOMAIN_META[domain];
            const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
            return (
              <div key={domain} className="bg-cream border-2 border-sand rounded-lg overflow-hidden shadow-sm">
                <div className={`h-1.5 ${meta?.bg?.replace('/10', '') || 'bg-sand'} opacity-60`} />
                <div className="px-2 py-3 text-center">
                  <DomainIcon domain={domain} fallback={meta?.icon || '📊'} size="w-10 h-10" />
                  <div className={`font-poster text-2xl ${meta?.color || ''}`}>{avg}%</div>
                  <div className="font-ui text-[10px] uppercase tracking-widest text-vintage-text/40">{meta?.label || domain}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drill Details */}
      <Card variant="canvas">
        <h3 className="text-xl font-poster text-vintage-text mb-4">Station-by-Station</h3>
        <div className="space-y-3">
          {drillResults.map((result, i) => {
            const meta = DOMAIN_META[result.domain];
            const isExpanded = expandedDrill === i;

            return (
              <div key={i} className="border-2 border-sand rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedDrill(isExpanded ? null : i)}
                  className="w-full flex items-center justify-between p-3 hover:bg-sand/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>{meta?.icon}</span>
                    <span className="font-ui text-sm uppercase tracking-wide text-vintage-text">
                      {DRILL_LABELS[result.type] || result.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {result.accuracy != null && (
                      <span className="font-mono text-xs text-vintage-text/50">{result.accuracy}% accuracy</span>
                    )}
                    <ScoreBadge score={result.score} />
                    <span className={`text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>&#9660;</span>
                  </div>
                </button>

                {isExpanded && result.results && (
                  <div className="border-t-2 border-sand p-3 bg-cream/50 space-y-2">
                    {result.results.map((r, j) => (
                      <div key={j} className="flex items-start gap-3 py-1 text-sm">
                        <span className="font-mono text-vintage-text/40 w-6">{j + 1}.</span>
                        <div className="flex-1">
                          <div className="font-mono text-vintage-text/70 text-xs mb-1">{r.prompt}</div>
                          {r.response && <div className="font-serif text-vintage-text">{r.response}</div>}
                          {r.userAnswer != null && (
                            <div className="font-mono text-sm">
                              Your answer: <span className={r.correct ? 'text-jungle' : 'text-terracotta'}>{r.userAnswer || '(skipped)'}</span>
                              {r.expected != null && !r.correct && (
                                <span className="text-vintage-text/40 ml-2">Expected: {Array.isArray(r.expected) ? r.expected.join(', ') : r.expected}</span>
                              )}
                            </div>
                          )}
                          {r.feedback && <div className="font-serif text-xs text-vintage-text/60 mt-1 italic">{r.feedback}</div>}
                          {r.score != null && <ScoreBadge score={r.score} small />}
                        </div>
                      </div>
                    ))}
                    {result.summary && (
                      <div className="mt-2 pt-2 border-t border-sand font-serif text-sm text-vintage-text/60 italic">
                        {result.summary}
                      </div>
                    )}
                    {result.error && (
                      <div className="mt-2 pt-2 border-t border-sand font-serif text-sm text-terracotta">
                        {result.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Back */}
      <div className="text-center">
        <Button variant="secondary" size="lg" onClick={handleReset}>
          Return to Base
        </Button>
      </div>
    </div>
  );
}

// ── Small Components ──

function DomainIcon({ domain, fallback, size = 'w-10 h-10' }) {
  const [failed, setFailed] = useState(false);
  const src = DOMAIN_IMAGES[domain];

  return (
    <div className={`${size} mx-auto mb-1`}>
      {!failed && src ? (
        <img
          src={src}
          alt={DOMAIN_META[domain]?.label || domain}
          className="w-full h-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="w-full h-full flex items-center justify-center text-2xl">{fallback}</span>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, suffix = '' }) {
  return (
    <div className="bg-gradient-to-b from-sand/40 to-sand/20 border-2 border-sand-dark/30 rounded-lg p-4 text-center shadow-vintage">
      <div className="text-2xl mb-1.5">{icon}</div>
      <div className="font-poster text-3xl text-vintage-text leading-tight">{value}<span className="text-xl text-vintage-text/60">{suffix}</span></div>
      <div className="font-ui text-[10px] uppercase tracking-widest text-vintage-text/50 mt-1">{label}</div>
    </div>
  );
}

function ScoreBadge({ score, small = false }) {
  const color = score >= 80 ? 'bg-jungle/20 text-jungle' : score >= 50 ? 'bg-mustard/20 text-mustard' : 'bg-terracotta/20 text-terracotta';
  return (
    <span className={`${color} font-poster rounded-full inline-block ${small ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}`}>
      {score}%
    </span>
  );
}
