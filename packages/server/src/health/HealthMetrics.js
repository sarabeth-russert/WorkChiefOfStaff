/**
 * HealthMetrics - Apple Health metric name mapping and category grouping.
 * Maps HK identifiers (lowercased) to friendly names used in day-file storage.
 */

// HK identifier (lowercase) -> friendly metric name
export const HK_TO_METRIC = {
  // Core Vitals
  hkquantitytypeidentifierheartrate: 'heart_rate',
  hkquantitytypeidentifierheartratevariancessdnn: 'heart_rate_variability_sdnn',
  hkquantitytypeidentifierrestingheartrate: 'resting_heart_rate',
  hkquantitytypeidentifierwalkingheartrateaverage: 'walking_heart_rate_average',
  hkquantitytypeidentifierheartraterecoveryoneminute: 'heart_rate_recovery',
  hkquantitytypeidentifieroxygensaturation: 'blood_oxygen_saturation',
  hkquantitytypeidentifierrespiratoryrate: 'respiratory_rate',
  hkquantitytypeidentifierbodytemperature: 'body_temperature',
  hkquantitytypeidentifiervo2max: 'vo2_max',

  // Activity
  hkquantitytypeidentifierstepcount: 'step_count',
  hkquantitytypeidentifieractiveenergyburned: 'active_energy',
  hkquantitytypeidentifierbasalenergyburned: 'basal_energy_burned',
  hkquantitytypeidentifierdistancewalkingrunning: 'walking_running_distance',
  hkquantitytypeidentifierflightsclimbed: 'flights_climbed',
  hkquantitytypeidentifierappleexercisetime: 'apple_exercise_time',
  hkquantitytypeidentifierapplestandtime: 'apple_stand_time',

  // Body
  hkquantitytypeidentifierbodymass: 'body_mass',
  hkquantitytypeidentifierbodymassindex: 'body_mass_index',
  hkquantitytypeidentifierbodyfatpercentage: 'body_fat_percentage',
  hkquantitytypeidentifierleanbodymass: 'lean_body_mass',
  hkquantitytypeidentifierheight: 'height',

  // Sleep
  hkcategorytypeidentifiersleepanalysis: 'sleep_analysis',

  // Walking
  hkquantitytypeidentifierwalkingspeed: 'walking_speed',
  hkquantitytypeidentifierwalkingsteplength: 'walking_step_length',
  hkquantitytypeidentifierapplewalkingsteadiness: 'walking_steadiness',

  // Running
  hkquantitytypeidentifierrunningspeed: 'running_speed',
  hkquantitytypeidentifierrunningpower: 'running_power',

  // Cycling
  hkquantitytypeidentifierdistancecycling: 'distance_cycling',

  // Audio
  hkquantitytypeidentifierenvironmentalaudioexposure: 'environmental_audio_exposure',
  hkquantitytypeidentifierheadphoneaudioexposure: 'headphone_audio_exposure',
};

// Health Auto Export uses short names that may differ from the XML HK identifiers
const JSON_ALIASES = {
  heart_rate_variability: 'heart_rate_variability_sdnn',
};

// Metrics that should be summed daily (not averaged)
export const SUM_METRICS = new Set([
  'step_count', 'active_energy', 'basal_energy_burned',
  'walking_running_distance', 'flights_climbed',
  'apple_exercise_time', 'apple_stand_time', 'distance_cycling',
]);

// Sleep stage value mapping from XML categorical values
export const SLEEP_STAGE_MAP = {
  hkcategoryvaluesleepanalysisasleepdeep: 'deep',
  hkcategoryvaluesleepanalysisasleeprem: 'rem',
  hkcategoryvaluesleepanalysisasleepcore: 'core',
  hkcategoryvaluesleepanalysisawake: 'awake',
  hkcategoryvaluesleepanalysisinbed: 'inBed',
  hkcategoryvaluesleepanalysisasleep: 'asleep',
};

/**
 * Metric display configuration for the client dashboard.
 * Organized by category for rendering metric cards.
 */
export const METRIC_CATEGORIES = [
  {
    id: 'vitals',
    label: 'Vitals',
    metrics: [
      { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', color: '#D2691E', aggregation: 'avg' },
      { key: 'heart_rate_variability_sdnn', label: 'HRV (SDNN)', unit: 'ms', color: '#8B7355', aggregation: 'avg' },
      { key: 'resting_heart_rate', label: 'Resting HR', unit: 'bpm', color: '#A0522D', aggregation: 'avg' },
      { key: 'blood_oxygen_saturation', label: 'Blood Oxygen', unit: '%', color: '#4682B4', aggregation: 'avg' },
      { key: 'respiratory_rate', label: 'Respiratory Rate', unit: 'br/min', color: '#5F9EA0', aggregation: 'avg' },
      { key: 'vo2_max', label: 'VO2 Max', unit: 'mL/kg/min', color: '#2E8B57', aggregation: 'latest' },
    ],
  },
  {
    id: 'activity',
    label: 'Activity',
    metrics: [
      { key: 'step_count', label: 'Steps', unit: 'steps', color: '#DAA520', aggregation: 'sum' },
      { key: 'active_energy', label: 'Active Energy', unit: 'kcal', color: '#CD853F', aggregation: 'sum' },
      { key: 'apple_exercise_time', label: 'Exercise', unit: 'min', color: '#BC8F8F', aggregation: 'sum' },
      { key: 'walking_running_distance', label: 'Distance', unit: 'mi', color: '#8B4513', aggregation: 'sum' },
      { key: 'flights_climbed', label: 'Flights Climbed', unit: 'flights', color: '#A0522D', aggregation: 'sum' },
    ],
  },
  {
    id: 'body',
    label: 'Body',
    metrics: [
      { key: 'body_mass', label: 'Weight', unit: 'lb', color: '#6B8E23', aggregation: 'latest' },
      { key: 'body_fat_percentage', label: 'Body Fat', unit: '%', color: '#808000', aggregation: 'latest' },
      { key: 'lean_body_mass', label: 'Lean Mass', unit: 'lb', color: '#556B2F', aggregation: 'latest' },
      { key: 'body_mass_index', label: 'BMI', unit: '', color: '#6B8E23', aggregation: 'latest' },
    ],
  },
  {
    id: 'sleep',
    label: 'Sleep',
    metrics: [
      { key: 'sleep_analysis', label: 'Sleep', unit: 'hrs', color: '#483D8B', aggregation: 'special' },
    ],
  },
];

/**
 * Resolve a metric name from either HK identifier or Health Auto Export name.
 * @param {string} name - HK identifier or short metric name
 * @returns {string} Normalized metric name
 */
export function resolveMetricName(name) {
  if (!name) return name;
  const lower = name.toLowerCase();
  return HK_TO_METRIC[lower] ?? JSON_ALIASES[lower] ?? lower;
}
