import { create } from 'zustand';

const apiUrl = import.meta.env.VITE_API_URL || '';

const useTrainingStore = create((set, get) => ({
  // State
  config: null,
  sessions: [],
  stats: null,
  todayCompleted: false,
  loading: false,
  error: null,

  // Current session state
  drills: [],
  currentDrillIndex: 0,
  currentQuestionIndex: 0,
  answers: [],       // answers[drillIndex][questionIndex] = { value, responseTime }
  sessionPhase: 'idle', // idle | drilling | between | scoring | results
  sessionResults: null,
  sessionStartTime: null,
  isTrainingMode: false,

  // Actions
  fetchConfig: async () => {
    try {
      const res = await fetch(`${apiUrl}/api/training/config`);
      const data = await res.json();
      if (data.success) set({ config: data.config });
    } catch (err) {
      set({ error: err.message });
    }
  },

  fetchSessions: async () => {
    try {
      const res = await fetch(`${apiUrl}/api/training/sessions`);
      const data = await res.json();
      if (data.success) {
        set({ sessions: data.sessions, stats: data.stats, todayCompleted: data.todayCompleted });
      }
    } catch (err) {
      set({ error: err.message });
    }
  },

  startSession: async (mode = 'quick', domain = null) => {
    set({ loading: true, error: null });
    try {
      const body = { mode };
      if (domain) body.domain = domain;
      const res = await fetch(`${apiUrl}/api/training/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success && data.drills.length > 0) {
        const answers = data.drills.map(d => d.questions.map(() => null));
        set({
          drills: data.drills,
          answers,
          currentDrillIndex: 0,
          currentQuestionIndex: 0,
          sessionPhase: 'drilling',
          sessionResults: null,
          sessionStartTime: Date.now(),
          loading: false
        });
      } else {
        set({ loading: false, error: 'No drills generated. Check your config.' });
      }
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },

  submitAnswer: (value, responseTime) => {
    const { currentDrillIndex, currentQuestionIndex, answers, drills } = get();
    const newAnswers = answers.map(a => [...a]);
    newAnswers[currentDrillIndex][currentQuestionIndex] = { value, responseTime };

    const drill = drills[currentDrillIndex];
    const isLastQuestion = currentQuestionIndex >= drill.questions.length - 1;

    if (isLastQuestion) {
      const isLastDrill = currentDrillIndex >= drills.length - 1;
      if (isLastDrill) {
        set({ answers: newAnswers, sessionPhase: 'between' });
      } else {
        set({
          answers: newAnswers,
          sessionPhase: 'between'
        });
      }
    } else {
      set({
        answers: newAnswers,
        currentQuestionIndex: currentQuestionIndex + 1
      });
    }
  },

  skipQuestion: () => {
    const { currentDrillIndex, currentQuestionIndex, answers, drills } = get();
    const newAnswers = answers.map(a => [...a]);
    newAnswers[currentDrillIndex][currentQuestionIndex] = { value: '', responseTime: 0 };

    const drill = drills[currentDrillIndex];
    const isLastQuestion = currentQuestionIndex >= drill.questions.length - 1;

    if (isLastQuestion) {
      set({ answers: newAnswers, sessionPhase: 'between' });
    } else {
      set({ answers: newAnswers, currentQuestionIndex: currentQuestionIndex + 1 });
    }
  },

  nextDrill: () => {
    const { currentDrillIndex, drills } = get();
    const isLastDrill = currentDrillIndex >= drills.length - 1;

    if (isLastDrill) {
      get().finishSession();
    } else {
      set({
        currentDrillIndex: currentDrillIndex + 1,
        currentQuestionIndex: 0,
        sessionPhase: 'drilling'
      });
    }
  },

  finishSession: async () => {
    const { drills, answers, sessionStartTime } = get();
    set({ sessionPhase: 'scoring' });

    try {
      const duration = Math.round((Date.now() - sessionStartTime) / 1000);
      const res = await fetch(`${apiUrl}/api/training/session/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drills, answers, duration })
      });
      const data = await res.json();
      if (data.success) {
        set({ sessionResults: data.session, sessionPhase: 'results', todayCompleted: true });
      } else {
        set({ error: data.error || 'Scoring failed', sessionPhase: 'results' });
      }
    } catch (err) {
      set({ error: err.message, sessionPhase: 'results' });
    }
  },

  resetSession: () => {
    set({
      drills: [],
      currentDrillIndex: 0,
      currentQuestionIndex: 0,
      answers: [],
      sessionPhase: 'idle',
      sessionResults: null,
      sessionStartTime: null,
      error: null
    });
  }
}));

export default useTrainingStore;
