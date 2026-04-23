import providerFactory from '../providers/ProviderFactory.js';
import configStore from '../config/ConfigStore.js';
import logger from '../config/logger.js';

const LLM_SCORED_TYPES = ['word-association', 'pun-creation', 'wit-comeback', 'verbal-fluency', 'what-if', 'alternative-uses'];

const EXACT_MATCH_TYPES = [
  'interval-id', 'pattern-sequence', 'coordinate-tracking',
  'stroop', 'rapid-compare', 'syllogism', 'ordering',
  'flanker', 'odd-one-out'
];

const SCORING_CRITERIA = {
  'word-association': 'creativity and lateral thinking (40%), breadth of connections (30%), relevance to prompt (30%)',
  'pun-creation': 'wordplay cleverness (40%), humor (30%), topic fit (30%)',
  'wit-comeback': 'humor (40%), cleverness (30%), relevance to setup (30%)',
  'verbal-fluency': 'unique valid items (60%), creativity of selections (20%), speed (20%)',
  'what-if': 'originality (35%), reasoning depth (35%), creativity (30%)',
  'alternative-uses': 'originality (40%), feasibility (30%), creativity (30%)'
};

function scoreMathDrill(drill, answers) {
  const results = [];
  let correct = 0;
  let totalTime = 0;

  for (let i = 0; i < drill.questions.length; i++) {
    const question = drill.questions[i];
    const answer = answers[i];
    const userVal = parseFloat(answer?.value);
    const expected = question.expected;
    const responseTime = answer?.responseTime || 0;
    totalTime += responseTime;

    let isCorrect = false;
    if (!isNaN(userVal)) {
      if (question.tolerance) {
        const lower = expected * (1 - question.tolerance);
        const upper = expected * (1 + question.tolerance);
        isCorrect = userVal >= lower && userVal <= upper;
      } else {
        isCorrect = userVal === expected;
      }
    }

    if (isCorrect) correct++;
    results.push({
      prompt: question.prompt,
      expected,
      userAnswer: answer?.value ?? null,
      correct: isCorrect,
      responseTime
    });
  }

  const accuracy = drill.questions.length > 0 ? correct / drill.questions.length : 0;
  const avgTime = drill.questions.length > 0 ? totalTime / drill.questions.length : 0;
  const speedBonus = drill.timeBudget > 0
    ? Math.max(0, 1 - (avgTime / (drill.timeBudget / drill.questions.length)))
    : 0;

  const score = Math.round(Math.min(100, Math.max(0, accuracy * 80 + speedBonus * 20)));

  return { type: drill.type, domain: drill.domain, score, accuracy: Math.round(accuracy * 100), results };
}

function scoreMemoryDrill(drill, answers) {
  const expected = drill.sequence;
  const userSequence = (answers[0]?.value || '').split(/[,\s]+/).map(s => s.trim()).filter(Boolean);

  let correct = 0;
  for (let i = 0; i < expected.length; i++) {
    if (userSequence[i] && userSequence[i].toLowerCase() === expected[i].toLowerCase()) {
      correct++;
    }
  }

  const accuracy = expected.length > 0 ? correct / expected.length : 0;
  const score = Math.round(accuracy * 100);

  return {
    type: drill.type, domain: drill.domain, score, accuracy: Math.round(accuracy * 100),
    results: [{ expected, userSequence, correct, total: expected.length }]
  };
}

function scoreExactDrill(drill, answers) {
  const results = [];
  let correct = 0;
  let totalTime = 0;

  for (let i = 0; i < drill.questions.length; i++) {
    const question = drill.questions[i];
    const answer = answers[i];
    const userStr = (answer?.value || '').trim();
    const expectedStr = String(question.expected);
    const responseTime = answer?.responseTime || 0;
    totalTime += responseTime;

    let isCorrect = false;
    const userNum = parseFloat(userStr);
    const expectedNum = parseFloat(expectedStr);

    if (!isNaN(userNum) && !isNaN(expectedNum) && !expectedStr.includes(',')) {
      isCorrect = userNum === expectedNum;
    } else {
      isCorrect = userStr.toLowerCase().replace(/\s+/g, '') === expectedStr.toLowerCase().replace(/\s+/g, '');
    }

    if (isCorrect) correct++;
    results.push({
      prompt: question.instruction || question.prompt,
      expected: question.expected,
      userAnswer: userStr || '(skipped)',
      correct: isCorrect,
      responseTime
    });
  }

  const accuracy = drill.questions.length > 0 ? correct / drill.questions.length : 0;
  const avgTime = drill.questions.length > 0 ? totalTime / drill.questions.length : 0;
  const speedBonus = drill.timeBudget > 0
    ? Math.max(0, 1 - (avgTime / (drill.timeBudget / drill.questions.length)))
    : 0;

  const score = Math.round(Math.min(100, Math.max(0, accuracy * 80 + speedBonus * 20)));
  return { type: drill.type, domain: drill.domain, score, accuracy: Math.round(accuracy * 100), results };
}

function scoreTemporalDrill(drill, answers) {
  const results = [];
  let totalScore = 0;

  for (let i = 0; i < drill.questions.length; i++) {
    const question = drill.questions[i];
    const answer = answers[i];
    const target = question.targetSeconds || question.expected;
    const actual = parseFloat(answer?.value) || 0;
    const errorPct = target > 0 ? Math.abs(actual - target) / target : 1;
    const questionScore = Math.round(Math.max(0, 100 * Math.max(0, 1 - errorPct)));
    totalScore += questionScore;

    results.push({
      prompt: question.prompt,
      expected: `${target}s`,
      userAnswer: actual > 0 ? `${actual.toFixed(1)}s` : '(skipped)',
      score: questionScore,
      correct: errorPct < 0.1
    });
  }

  const avgScore = drill.questions.length > 0 ? Math.round(totalScore / drill.questions.length) : 0;
  return { type: drill.type, domain: drill.domain, score: avgScore, results };
}

async function scoreLlmDrill(drill, answers) {
  const criteria = SCORING_CRITERIA[drill.type] || 'quality, creativity, and relevance';

  const responsePairs = drill.questions.map((q, i) => ({
    prompt: q.prompt,
    response: answers[i]?.value || '(no response)',
    responseTime: answers[i]?.responseTime || 0
  }));

  const scoringPrompt = `You are a scoring judge for a cognitive training exercise.

Drill type: ${drill.type}
Scoring criteria: ${criteria}

Score each response on a scale of 0-100 based on the criteria above.
Provide brief feedback for each response (1 sentence).

Responses to score:
${responsePairs.map((r, i) => `${i + 1}. Prompt: "${r.prompt}"\n   Response: "${r.response}"`).join('\n\n')}

Respond with ONLY valid JSON in this exact format:
{
  "scores": [
    { "score": <number 0-100>, "feedback": "<brief feedback>" }
  ],
  "summary": "<one sentence overall assessment>"
}`;

  try {
    const provider = providerFactory.getCurrentProvider();
    if (!provider) throw new Error('No AI provider configured');

    const model = configStore.getCurrentModel();
    const response = await provider.messages.create({
      model,
      max_tokens: 1024,
      temperature: 0.3,
      messages: [{ role: 'user', content: scoringPrompt }]
    });

    const text = response.content.find(b => b.type === 'text')?.text || '';
    const parsed = parseJsonFromAI(text);

    if (!parsed || !Array.isArray(parsed.scores)) {
      throw new Error('Invalid scoring response format');
    }

    // Calculate overall score with speed bonus
    const avgQualityScore = parsed.scores.reduce((sum, s) => sum + (s.score || 0), 0) / parsed.scores.length;
    const avgTime = responsePairs.reduce((sum, r) => sum + r.responseTime, 0) / responsePairs.length;
    const speedBonus = drill.timeBudget > 0
      ? Math.max(0, 1 - (avgTime / (drill.timeBudget / drill.questions.length)))
      : 0;
    const finalScore = Math.round(Math.min(100, Math.max(0, avgQualityScore * 0.8 + speedBonus * 20)));

    return {
      type: drill.type, domain: drill.domain, score: finalScore,
      llmScores: parsed.scores,
      summary: parsed.summary,
      results: responsePairs.map((r, i) => ({
        prompt: r.prompt,
        response: r.response,
        score: parsed.scores[i]?.score || 0,
        feedback: parsed.scores[i]?.feedback || ''
      }))
    };
  } catch (err) {
    logger.error('LLM scoring failed', { type: drill.type, error: err.message });
    return {
      type: drill.type, domain: drill.domain, score: 0,
      error: 'Scoring unavailable — AI provider error',
      results: responsePairs.map(r => ({ prompt: r.prompt, response: r.response, score: 0, feedback: 'Could not score' }))
    };
  }
}

function parseJsonFromAI(text) {
  try {
    // Strip markdown code fences
    const cleaned = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch (e) {
    logger.error('Failed to parse AI JSON response', { error: e.message });
  }
  return null;
}

async function scoreSession(drills, allAnswers) {
  const results = [];

  for (let i = 0; i < drills.length; i++) {
    const drill = drills[i];
    const answers = allAnswers[i] || [];

    if (drill.domain === 'math') {
      results.push(scoreMathDrill(drill, answers));
    } else if (drill.type === 'sequence-recall') {
      results.push(scoreMemoryDrill(drill, answers));
    } else if (drill.type === 'time-estimation') {
      results.push(scoreTemporalDrill(drill, answers));
    } else if (EXACT_MATCH_TYPES.includes(drill.type)) {
      results.push(scoreExactDrill(drill, answers));
    } else if (LLM_SCORED_TYPES.includes(drill.type)) {
      results.push(await scoreLlmDrill(drill, answers));
    }
  }

  // Calculate overall score: average across domains
  const domainScores = {};
  for (const r of results) {
    if (!domainScores[r.domain]) domainScores[r.domain] = [];
    domainScores[r.domain].push(r.score);
  }
  const domainAverages = Object.values(domainScores).map(
    scores => scores.reduce((a, b) => a + b, 0) / scores.length
  );
  const overallScore = domainAverages.length > 0
    ? Math.round(domainAverages.reduce((a, b) => a + b, 0) / domainAverages.length)
    : 0;

  return { overallScore, drillResults: results, domainScores };
}

export { scoreSession, scoreMathDrill, scoreMemoryDrill, scoreExactDrill, scoreTemporalDrill, scoreLlmDrill };
export default { scoreSession };
