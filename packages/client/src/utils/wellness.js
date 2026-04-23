/**
 * Shared wellness utilities used across components
 */

/**
 * Get color class based on a contributor/metric score
 */
export function getContributorColor(score) {
  if (score >= 85) return 'bg-green-500';
  if (score >= 70) return 'bg-blue-500';
  if (score >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

/**
 * Session type display configuration
 */
export const SESSION_TYPE_CONFIG = {
  standup: {
    icon: '🌅',
    label: 'Morning Standup',
    bgColor: 'bg-mustard',
    borderColor: 'border-mustard-dark',
    textColor: 'text-cream',
    color: 'text-mustard'
  },
  retro: {
    icon: '🌙',
    label: 'Evening Retro',
    bgColor: 'bg-teal',
    borderColor: 'border-teal-dark',
    textColor: 'text-cream',
    color: 'text-teal'
  }
};

/**
 * Readiness contributor label mapping
 */
export const READINESS_LABELS = {
  activity_balance: 'Activity Balance',
  body_temperature: 'Body Temperature',
  hrv_balance: 'HRV Balance',
  previous_day_activity: 'Previous Day Activity',
  previous_night: 'Previous Night',
  recovery_index: 'Recovery Index',
  resting_heart_rate: 'Resting Heart Rate',
  sleep_balance: 'Sleep Balance',
  sleep_regularity: 'Sleep Regularity'
};

/**
 * Sleep contributor label mapping
 */
export const SLEEP_LABELS = {
  deep_sleep: 'Deep Sleep',
  efficiency: 'Efficiency',
  latency: 'Latency',
  rem_sleep: 'REM Sleep',
  restfulness: 'Restfulness',
  timing: 'Timing',
  total_sleep: 'Total Sleep'
};
