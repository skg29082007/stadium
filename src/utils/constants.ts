export const APP_NAME = 'FIFA World Cup 2026 — Smart Stadium';
export const STADIUM_NAME = 'New York New Jersey Stadium';
export const STADIUM_CAPACITY = 80663;
export const PITCH_DIMENSIONS = { width: 105, height: 68 };

export const MATCH_PHASES = ['pre-match', 'first-half', 'halftime', 'second-half', 'post-match'] as const;
export type MatchPhase = (typeof MATCH_PHASES)[number];

export const ZONE_CAPACITY_THRESHOLDS = {
  low: 50,
  medium: 75,
  high: 85,
  critical: 95,
} as const;

export const RISK_LEVELS = {
  LOW: { max: 30, color: '#00d2a0', label: 'Low' },
  MODERATE: { max: 55, color: '#ffa726', label: 'Moderate' },
  HIGH: { max: 80, color: '#ff7043', label: 'High' },
  CRITICAL: { max: 100, color: '#ef5350', label: 'Critical' },
} as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
] as const;

export const INCIDENT_CATEGORIES = [
  'MEDICAL',
  'SECURITY',
  'MAINTENANCE',
  'CROWD',
  'WEATHER',
  'TRANSIT',
] as const;

export type IncidentCategory = (typeof INCIDENT_CATEGORIES)[number];

export const INCIDENT_PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
export type IncidentPriority = (typeof INCIDENT_PRIORITIES)[number];

export const INCIDENT_STATUSES = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const INCIDENT_CATEGORY_CONFIG: Record<IncidentCategory, { icon: string; color: string }> = {
  MEDICAL: { icon: 'heart-pulse', color: '#ef5350' },
  SECURITY: { icon: 'shield-alert', color: '#ffa726' },
  MAINTENANCE: { icon: 'wrench', color: '#42a5f5' },
  CROWD: { icon: 'users', color: '#ab47bc' },
  WEATHER: { icon: 'cloud-lightning', color: '#78909c' },
  TRANSIT: { icon: 'bus', color: '#66bb6a' },
};

export const PRIORITY_CONFIG: Record<IncidentPriority, { color: string; bgColor: string }> = {
  CRITICAL: { color: '#ef5350', bgColor: 'rgba(239, 83, 80, 0.12)' },
  HIGH: { color: '#ffa726', bgColor: 'rgba(255, 167, 38, 0.12)' },
  MEDIUM: { color: '#42a5f5', bgColor: 'rgba(66, 165, 245, 0.12)' },
  LOW: { color: '#00d2a0', bgColor: 'rgba(0, 210, 160, 0.12)' },
};

export const CROWD_UPDATE_INTERVAL = 2000; // ms
export const PREDICTION_HORIZON = 15; // minutes
export const ROUTE_CONGESTION_MULTIPLIER = 3;
