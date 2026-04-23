import logger from '../config/logger.js';

// ── Math drill generators ──

function generateDoublingChain(config = {}) {
  const steps = config.steps || 6;
  const start = randomInt(3, 12);
  const questions = [];
  let current = start;

  for (let i = 0; i < steps; i++) {
    questions.push({
      prompt: i === 0 ? `Start: ${current} (double it)` : `${current} x 2 = ?`,
      expected: current * 2,
      hint: `${current} x 2`
    });
    current = current * 2;
  }

  return { type: 'doubling-chain', domain: 'math', questions };
}

function generateSerialSubtraction(config = {}) {
  const steps = config.steps || 8;
  const subtrahend = config.subtrahend || 7;
  const start = randomInt(200, 500);
  const questions = [];
  let current = start;

  for (let i = 0; i < steps; i++) {
    questions.push({
      prompt: i === 0 ? `Start: ${current} - ${subtrahend} = ?` : `${current} - ${subtrahend} = ?`,
      expected: current - subtrahend,
      hint: `${current} - ${subtrahend}`
    });
    current = current - subtrahend;
  }

  return { type: 'serial-subtraction', domain: 'math', questions };
}

function generateMultiplication(config = {}) {
  const count = config.questions || 5;
  const questions = [];

  for (let i = 0; i < count; i++) {
    const a = randomInt(6, 15);
    const b = randomInt(6, 15);
    questions.push({
      prompt: `${a} x ${b} = ?`,
      expected: a * b,
      hint: `${a} x ${b}`
    });
  }

  return { type: 'multiplication', domain: 'math', questions };
}

function generateEstimation(config = {}) {
  const count = config.questions || 4;
  const tolerance = config.tolerance || 0.15;
  const questions = [];

  const templates = [
    () => { const a = randomInt(10, 99); const b = randomInt(10, 99); return { prompt: `Estimate: ${a} x ${b}`, expected: a * b }; },
    () => { const a = randomInt(100, 999); const b = randomInt(2, 9); return { prompt: `Estimate: ${a} / ${b}`, expected: Math.round(a / b) }; },
    () => { const a = randomInt(50, 200); const b = randomInt(50, 200); return { prompt: `Estimate: ${a} + ${b} + ${randomInt(50, 200)}`, expected: a + b + randomInt(50, 200) }; },
    () => { const n = randomInt(2, 20); return { prompt: `Estimate: ${n}^2`, expected: n * n }; }
  ];

  for (let i = 0; i < count; i++) {
    const template = templates[i % templates.length];
    const { prompt, expected } = template();
    questions.push({ prompt, expected, tolerance, hint: `Within ${Math.round(tolerance * 100)}% of ${expected}` });
  }

  return { type: 'estimation', domain: 'math', questions };
}

// ── Memory drill generators ──

function generateSequenceRecall(config = {}) {
  const length = config.length || 7;
  const pools = [
    ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet', 'Kilo', 'Lima'],
    ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'],
    ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet', 'Crimson', 'Teal', 'Gold'],
    ['Oak', 'Pine', 'Maple', 'Cedar', 'Birch', 'Elm', 'Ash', 'Willow', 'Spruce', 'Redwood']
  ];
  const pool = pools[randomInt(0, pools.length - 1)];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const sequence = shuffled.slice(0, Math.min(length, pool.length));

  return {
    type: 'sequence-recall',
    domain: 'memory',
    sequence,
    questions: [{ prompt: `Memorize this sequence, then recall it in order:\n\n${sequence.join('  →  ')}`, expected: sequence }]
  };
}

// ── LLM-scored drill generators (prompts only, scored by AI) ──

const WORD_ASSOCIATION_PROMPTS = [
  'Ocean', 'Gravity', 'Midnight', 'Crystal', 'Thunder', 'Silk', 'Ember',
  'Labyrinth', 'Harmony', 'Fossil', 'Paradox', 'Eclipse', 'Wanderlust'
];

const WIT_COMEBACK_SETUPS = [
  "Your friend says: 'AI will replace all programmers by next year.'",
  "A coworker says: 'Sleep is for the weak.'",
  "Someone at a party says: 'Books are obsolete now that we have TikTok.'",
  "Your neighbor says: 'Why cook when delivery exists?'",
  "A stranger says: 'Only boring people get bored.'",
  "Your friend claims: 'Email is dead.'",
  "Someone argues: 'Handwriting is a useless skill now.'"
];

const VERBAL_FLUENCY_CATEGORIES = [
  'animals that are nocturnal',
  'things you find in a kitchen',
  'words that rhyme with "light"',
  'famous rivers',
  'things that are circular',
  'musical instruments',
  'types of weather',
  'things associated with the color green'
];

const WHAT_IF_PROMPTS = [
  'What if humans could photosynthesize like plants?',
  'What if gravity worked in reverse one day per week?',
  'What if all music suddenly disappeared from the world?',
  'What if you could only speak in questions for a day?',
  'What if sleep was no longer necessary?',
  'What if animals could vote?',
  'What if the internet went down permanently?'
];

const ALTERNATIVE_USES_OBJECTS = [
  'a brick', 'a paperclip', 'a tennis ball', 'an empty bottle',
  'a wooden spoon', 'a newspaper', 'a rubber band', 'a shoelace'
];

const PUN_TOPICS = [
  'coffee', 'space', 'gardening', 'music', 'cooking', 'technology',
  'the ocean', 'time travel', 'libraries', 'weather'
];

// ── Ear Training constants ──

const INTERVALS = [
  { name: 'Minor 2nd', semitones: 1 },
  { name: 'Major 2nd', semitones: 2 },
  { name: 'Minor 3rd', semitones: 3 },
  { name: 'Major 3rd', semitones: 4 },
  { name: 'Perfect 4th', semitones: 5 },
  { name: 'Tritone', semitones: 6 },
  { name: 'Perfect 5th', semitones: 7 },
  { name: 'Minor 6th', semitones: 8 },
  { name: 'Major 6th', semitones: 9 },
  { name: 'Minor 7th', semitones: 10 },
  { name: 'Major 7th', semitones: 11 },
  { name: 'Octave', semitones: 12 }
];

const BASE_NOTES = [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88];

// ── Processing constants ──

const STROOP_COLORS = [
  { name: 'red', hex: '#DC2626' },
  { name: 'blue', hex: '#2563EB' },
  { name: 'green', hex: '#16A34A' },
  { name: 'yellow', hex: '#CA8A04' },
  { name: 'purple', hex: '#9333EA' },
  { name: 'orange', hex: '#EA580C' }
];

// ── Logic constants ──

const SYLLOGISM_TEMPLATES = [
  { premises: ['All {A} are {B}', 'All {B} are {C}'], conclusion: 'All {A} are {C}', valid: true },
  { premises: ['No {A} are {B}', 'All {C} are {A}'], conclusion: 'No {C} are {B}', valid: true },
  { premises: ['All {A} are {B}', 'Some {C} are {A}'], conclusion: 'Some {C} are {B}', valid: true },
  { premises: ['All {A} are {B}', 'All {C} are {B}'], conclusion: 'All {A} are {C}', valid: false },
  { premises: ['Some {A} are {B}', 'Some {B} are {C}'], conclusion: 'Some {A} are {C}', valid: false },
  { premises: ['All {A} are {B}', 'No {C} are {A}'], conclusion: 'No {C} are {B}', valid: false },
];

const SYLLOGISM_TERMS = [
  ['dogs', 'mammals', 'living things'],
  ['roses', 'flowers', 'plants'],
  ['squares', 'rectangles', 'shapes'],
  ['students', 'learners', 'people'],
  ['sparrows', 'birds', 'animals'],
  ['novels', 'books', 'publications'],
  ['violins', 'instruments', 'objects'],
];

const ORDERING_DIMENSIONS = [
  { comp: 'taller than', superlative: 'tallest', inverse: 'shortest' },
  { comp: 'faster than', superlative: 'fastest', inverse: 'slowest' },
  { comp: 'older than', superlative: 'oldest', inverse: 'youngest' },
  { comp: 'heavier than', superlative: 'heaviest', inverse: 'lightest' }
];

const ORDERING_NAMES = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank'];

function generateLlmDrill(type, config = {}) {
  const promptCount = config.prompts || 3;

  switch (type) {
    case 'word-association': {
      const prompts = pickRandom(WORD_ASSOCIATION_PROMPTS, promptCount);
      return {
        type, domain: 'wordplay',
        questions: prompts.map(word => ({
          prompt: `Write 3 creative word associations for: "${word}"`,
          inputType: 'text'
        }))
      };
    }
    case 'pun-creation': {
      const prompts = pickRandom(PUN_TOPICS, promptCount);
      return {
        type, domain: 'wordplay',
        questions: prompts.map(topic => ({
          prompt: `Create a clever pun about ${topic}`,
          inputType: 'text'
        }))
      };
    }
    case 'wit-comeback': {
      const prompts = pickRandom(WIT_COMEBACK_SETUPS, promptCount);
      return {
        type, domain: 'verbal',
        questions: prompts.map(setup => ({
          prompt: setup + '\n\nWrite a witty comeback:',
          inputType: 'text'
        }))
      };
    }
    case 'verbal-fluency': {
      const category = config.category || pickRandom(VERBAL_FLUENCY_CATEGORIES, 1)[0];
      const target = config.target || 8;
      return {
        type, domain: 'verbal',
        questions: [{
          prompt: `Name as many ${category} as you can (target: ${target}):`,
          inputType: 'text',
          target
        }]
      };
    }
    case 'what-if': {
      const prompts = pickRandom(WHAT_IF_PROMPTS, promptCount);
      return {
        type, domain: 'imagination',
        questions: prompts.map(scenario => ({
          prompt: scenario + '\n\nExplore this scenario in 2-3 sentences:',
          inputType: 'text'
        }))
      };
    }
    case 'alternative-uses': {
      const prompts = pickRandom(ALTERNATIVE_USES_OBJECTS, promptCount);
      return {
        type, domain: 'imagination',
        questions: prompts.map(obj => ({
          prompt: `List 3 creative alternative uses for ${obj}:`,
          inputType: 'text'
        }))
      };
    }
    default:
      return null;
  }
}

// ── Ear Training generators ──

function generateIntervalId(config = {}) {
  const count = config.questions || 5;
  const questions = [];

  for (let i = 0; i < count; i++) {
    const baseFreq = BASE_NOTES[randomInt(0, BASE_NOTES.length - 1)];
    const interval = INTERVALS[randomInt(0, INTERVALS.length - 1)];
    const ascending = Math.random() > 0.3;
    const note2Freq = ascending
      ? baseFreq * Math.pow(2, interval.semitones / 12)
      : baseFreq / Math.pow(2, interval.semitones / 12);

    const wrongIntervals = INTERVALS.filter(iv => iv.name !== interval.name);
    const shuffledWrong = [...wrongIntervals].sort(() => Math.random() - 0.5).slice(0, 3);
    const choices = [...shuffledWrong.map(iv => iv.name), interval.name].sort(() => Math.random() - 0.5);

    questions.push({
      prompt: `Listen and identify the interval (${ascending ? 'ascending' : 'descending'}):`,
      expected: interval.name,
      choices,
      earTraining: {
        note1Freq: Math.round(baseFreq * 100) / 100,
        note2Freq: Math.round(note2Freq * 100) / 100,
        duration: 0.7
      }
    });
  }

  return { type: 'interval-id', domain: 'ear-training', questions };
}

// ── Spatial generators ──

function generatePatternSequence(config = {}) {
  const count = config.questions || 5;
  const questions = [];

  const generators = [
    () => {
      const start = randomInt(1, 20);
      const diff = randomInt(2, 9);
      const seq = Array.from({ length: 5 }, (_, i) => start + diff * i);
      return { sequence: seq.slice(0, 4), answer: seq[4] };
    },
    () => {
      const start = randomInt(2, 5);
      const ratio = randomInt(2, 3);
      const seq = Array.from({ length: 5 }, (_, i) => start * Math.pow(ratio, i));
      if (seq[4] > 10000) return null;
      return { sequence: seq.slice(0, 4), answer: seq[4] };
    },
    () => {
      const offset = randomInt(1, 8);
      const seq = Array.from({ length: 5 }, (_, i) => (offset + i) * (offset + i));
      return { sequence: seq.slice(0, 4), answer: seq[4] };
    },
    () => {
      const a = randomInt(1, 5);
      const b = randomInt(1, 5);
      const seq = [a, b];
      for (let i = 2; i < 6; i++) seq.push(seq[i - 1] + seq[i - 2]);
      return { sequence: seq.slice(0, 5), answer: seq[5] };
    }
  ];

  for (let i = 0; i < count; i++) {
    let result = null;
    let attempts = 0;
    while (!result && attempts < 10) {
      result = generators[randomInt(0, generators.length - 1)]();
      attempts++;
    }
    if (result) {
      questions.push({
        prompt: `What comes next?  ${result.sequence.join(', ')}, ?`,
        expected: result.answer
      });
    }
  }

  return { type: 'pattern-sequence', domain: 'spatial', questions };
}

function generateCoordinateTracking(config = {}) {
  const count = config.questions || 4;
  const questions = [];
  const dirs = [
    { name: 'Right', dx: 1, dy: 0 },
    { name: 'Left', dx: -1, dy: 0 },
    { name: 'Up', dx: 0, dy: 1 },
    { name: 'Down', dx: 0, dy: -1 }
  ];

  for (let i = 0; i < count; i++) {
    const steps = randomInt(3, 5);
    let x = 0, y = 0;
    const moves = [];
    for (let s = 0; s < steps; s++) {
      const dir = dirs[randomInt(0, 3)];
      const dist = randomInt(1, 5);
      x += dir.dx * dist;
      y += dir.dy * dist;
      moves.push(`${dir.name} ${dist}`);
    }
    questions.push({
      prompt: `Start at (0,0). Move: ${moves.join(', ')}`,
      instruction: 'Where are you? (format: x,y)',
      expected: `${x},${y}`
    });
  }

  return { type: 'coordinate-tracking', domain: 'spatial', questions };
}

// ── Processing Speed generators ──

function generateStroop(config = {}) {
  const count = config.questions || 6;
  const questions = [];

  for (let i = 0; i < count; i++) {
    const wordColor = STROOP_COLORS[randomInt(0, STROOP_COLORS.length - 1)];
    let inkColor;
    do {
      inkColor = STROOP_COLORS[randomInt(0, STROOP_COLORS.length - 1)];
    } while (inkColor.name === wordColor.name);

    const otherNames = STROOP_COLORS.map(c => c.name).filter(n => n !== inkColor.name && n !== wordColor.name);
    const extras = pickRandom(otherNames, 2);
    const choices = [inkColor.name, wordColor.name, ...extras].slice(0, 4).sort(() => Math.random() - 0.5);

    questions.push({
      prompt: 'What COLOR is this word printed in?',
      stroopWord: wordColor.name.toUpperCase(),
      stroopColor: inkColor.hex,
      expected: inkColor.name,
      choices
    });
  }

  return { type: 'stroop', domain: 'processing', questions };
}

function generateRapidCompare(config = {}) {
  const count = config.questions || 6;
  const questions = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  for (let i = 0; i < count; i++) {
    const len = randomInt(4, 7);
    const isSame = Math.random() > 0.5;
    let seq1 = '';
    for (let j = 0; j < len; j++) seq1 += chars[randomInt(0, chars.length - 1)];

    let seq2;
    if (isSame) {
      seq2 = seq1;
    } else {
      const pos = randomInt(0, len - 1);
      let newChar;
      do { newChar = chars[randomInt(0, chars.length - 1)]; } while (newChar === seq1[pos]);
      seq2 = seq1.substring(0, pos) + newChar + seq1.substring(pos + 1);
    }

    questions.push({
      prompt: `${seq1}  |  ${seq2}`,
      instruction: 'Same or Different?',
      expected: isSame ? 'same' : 'different',
      choices: ['same', 'different']
    });
  }

  return { type: 'rapid-compare', domain: 'processing', questions };
}

// ── Logic generators ──

function generateSyllogism(config = {}) {
  const count = config.questions || 4;
  const questions = [];

  for (let i = 0; i < count; i++) {
    const template = SYLLOGISM_TEMPLATES[randomInt(0, SYLLOGISM_TEMPLATES.length - 1)];
    const terms = SYLLOGISM_TERMS[randomInt(0, SYLLOGISM_TERMS.length - 1)];
    const fill = (s) => s.replace('{A}', terms[0]).replace('{B}', terms[1]).replace('{C}', terms[2]);

    const premiseStr = template.premises.map(fill).join('\n');
    const conclusionStr = fill(template.conclusion);

    questions.push({
      prompt: `${premiseStr}\n\nConclusion: "${conclusionStr}"`,
      instruction: 'Is this conclusion logically valid?',
      expected: template.valid ? 'true' : 'false',
      choices: ['true', 'false']
    });
  }

  return { type: 'syllogism', domain: 'logic', questions };
}

function generateOrdering(config = {}) {
  const count = config.questions || 4;
  const questions = [];

  for (let i = 0; i < count; i++) {
    const dim = ORDERING_DIMENSIONS[randomInt(0, ORDERING_DIMENSIONS.length - 1)];
    const n = randomInt(3, 5);
    const picked = pickRandom(ORDERING_NAMES, n);
    const ordered = [...picked].sort(() => Math.random() - 0.5);

    const statements = [];
    for (let j = 0; j < ordered.length - 1; j++) {
      statements.push(`${ordered[j]} is ${dim.comp} ${ordered[j + 1]}`);
    }
    statements.sort(() => Math.random() - 0.5);

    const askTop = Math.random() > 0.5;
    const answer = askTop ? ordered[0] : ordered[ordered.length - 1];
    const word = askTop ? dim.superlative : dim.inverse;

    questions.push({
      prompt: statements.join('\n'),
      instruction: `Who is the ${word}?`,
      expected: answer,
      choices: [...picked].sort(() => Math.random() - 0.5)
    });
  }

  return { type: 'ordering', domain: 'logic', questions };
}

// ── Attention generators ──

function generateFlanker(config = {}) {
  const count = config.questions || 8;
  const questions = [];
  const arrows = { left: '←', right: '→' };

  for (let i = 0; i < count; i++) {
    const center = Math.random() > 0.5 ? 'left' : 'right';
    const flankers = Math.random() > 0.4 ? (center === 'left' ? 'right' : 'left') : center;
    const pattern = `${arrows[flankers]} ${arrows[flankers]} ${arrows[center]} ${arrows[flankers]} ${arrows[flankers]}`;

    questions.push({
      prompt: pattern,
      instruction: 'What direction is the CENTER arrow?',
      expected: center,
      choices: ['left', 'right']
    });
  }

  return { type: 'flanker', domain: 'attention', questions };
}

function generateOddOneOut(config = {}) {
  const count = config.questions || 6;
  const questions = [];
  const symbolSets = [
    { main: '●', odd: '○' },
    { main: '■', odd: '□' },
    { main: '▲', odd: '△' },
    { main: '◆', odd: '◇' },
    { main: '★', odd: '☆' }
  ];

  for (let i = 0; i < count; i++) {
    const set = symbolSets[randomInt(0, symbolSets.length - 1)];
    const len = randomInt(5, 8);
    const oddPos = randomInt(0, len - 1);
    const symbols = Array.from({ length: len }, (_, j) => j === oddPos ? set.odd : set.main);

    questions.push({
      prompt: symbols.join('  '),
      instruction: `Which position (1-${len}) is different?`,
      expected: String(oddPos + 1)
    });
  }

  return { type: 'odd-one-out', domain: 'attention', questions };
}

// ── Temporal generator ──

function generateTimeEstimation(config = {}) {
  const count = config.questions || 4;
  const targets = [3, 5, 7, 10, 12, 15];
  const picked = pickRandom(targets, count);

  const questions = picked.map(t => ({
    prompt: `Press the button when you think ${t} seconds have passed`,
    targetSeconds: t,
    temporal: true,
    expected: t
  }));

  return { type: 'time-estimation', domain: 'temporal', questions };
}

// ── Session generation ──

const MATH_GENERATORS = {
  'doubling-chain': generateDoublingChain,
  'serial-subtraction': generateSerialSubtraction,
  'multiplication': generateMultiplication,
  'estimation': generateEstimation
};

const EXACT_GENERATORS = {
  'interval-id': generateIntervalId,
  'pattern-sequence': generatePatternSequence,
  'coordinate-tracking': generateCoordinateTracking,
  'stroop': generateStroop,
  'rapid-compare': generateRapidCompare,
  'syllogism': generateSyllogism,
  'ordering': generateOrdering,
  'flanker': generateFlanker,
  'odd-one-out': generateOddOneOut,
  'time-estimation': generateTimeEstimation
};

const LLM_DRILL_TYPES = ['word-association', 'pun-creation', 'wit-comeback', 'verbal-fluency', 'what-if', 'alternative-uses'];

function generateSession(config, mode = 'quick', targetDomain = null) {
  const drills = [];
  const domains = config.domains;

  if (mode === 'single' && targetDomain && domains[targetDomain]) {
    // Single domain: one random drill from the specified domain
    const domain = domains[targetDomain];
    const enabledTypes = Object.entries(domain.drillTypes)
      .filter(([, dt]) => dt.enabled)
      .map(([type, dt]) => ({ type, config: dt }));
    if (enabledTypes.length > 0) {
      const pick = enabledTypes[randomInt(0, enabledTypes.length - 1)];
      const drill = generateDrill(pick.type, pick.config);
      if (drill) {
        drill.timeBudget = domain.timeBudget;
        drills.push(drill);
      }
    }
  } else if (mode === 'quick') {
    // Randomly pick 5 domains and do one drill from each
    const enabledDomains = Object.entries(domains).filter(([, d]) => d.enabled);
    const selected = pickRandom(enabledDomains, 5);

    for (const [, domain] of selected) {
      const enabledTypes = Object.entries(domain.drillTypes)
        .filter(([, dt]) => dt.enabled)
        .map(([type, dt]) => ({ type, config: dt }));
      if (enabledTypes.length === 0) continue;

      const pick = enabledTypes[randomInt(0, enabledTypes.length - 1)];
      const drill = generateDrill(pick.type, pick.config);
      if (drill) {
        drill.timeBudget = domain.timeBudget;
        drills.push(drill);
      }
    }
  } else {
    // Full session: all enabled drills from all domains
    for (const [, domain] of Object.entries(domains)) {
      if (!domain.enabled) continue;
      const enabledTypes = Object.entries(domain.drillTypes)
        .filter(([, dt]) => dt.enabled)
        .map(([type, dt]) => ({ type, config: dt }));

      for (const pick of enabledTypes) {
        const drill = generateDrill(pick.type, pick.config);
        if (drill) {
          drill.timeBudget = domain.timeBudget;
          drills.push(drill);
        }
      }
    }
  }

  return drills;
}

function generateDrill(type, config) {
  if (MATH_GENERATORS[type]) return MATH_GENERATORS[type](config);
  if (EXACT_GENERATORS[type]) return EXACT_GENERATORS[type](config);
  if (LLM_DRILL_TYPES.includes(type)) return generateLlmDrill(type, config);
  if (type === 'sequence-recall') return generateSequenceRecall(config);
  return null;
}

// ── Helpers ──

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

export { generateSession, generateDrill, MATH_GENERATORS, EXACT_GENERATORS, LLM_DRILL_TYPES };
export default { generateSession, generateDrill };
