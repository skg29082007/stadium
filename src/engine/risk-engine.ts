/**
 * Multi-Factor Risk Scoring Engine
 * 
 * Combines:
 *  - Crowd density (40%)
 *  - Weather severity (20%)
 *  - Transit load (15%)
 *  - Incident rate (15%)
 *  - Match rivalry intensity (10%)
 */

import { getCurrentWeather } from '../data/weather-data';
import { getCurrentMatch } from '../data/match-schedule';
import type { CrowdSnapshot } from '../data/crowd-simulator';
import type { Incident } from './incident-triage';
import { clamp } from '../utils/formatters';

export interface RiskAssessment {
  overallScore: number; // 0-100
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  factors: RiskFactor[];
  summary: string;
  recommendations: string[];
  timestamp: number;
}

export interface RiskFactor {
  name: string;
  score: number; // 0-100
  weight: number; // 0-1
  weightedScore: number;
  icon: string;
  trend: 'improving' | 'worsening' | 'stable';
}

let previousScores: number[] = [];

export function calculateRisk(
  crowdData: CrowdSnapshot | null,
  activeIncidents: Incident[],
  transitLoad: number = 50,
): RiskAssessment {
  const weather = getCurrentWeather();
  const match = getCurrentMatch();

  // 1. Crowd density factor
  const avgDensity = crowdData?.avgDensity ?? 50;
  const maxZoneDensity = crowdData
    ? Math.max(...crowdData.zones.map(z => z.density))
    : 50;
  const crowdScore = clamp(avgDensity * 0.6 + maxZoneDensity * 0.4, 0, 100);

  // 2. Weather factor
  const weatherScore = weather.severity;

  // 3. Transit factor
  const transitScore = clamp(transitLoad, 0, 100);

  // 4. Incident factor
  const criticalCount = activeIncidents.filter(i => i.priority === 'CRITICAL').length;
  const highCount = activeIncidents.filter(i => i.priority === 'HIGH').length;
  const incidentScore = clamp(criticalCount * 30 + highCount * 15 + activeIncidents.length * 5, 0, 100);

  // 5. Rivalry factor
  const rivalryScore = (match.rivalryIntensity / 10) * 100;

  // Calculate weighted total
  const factors: RiskFactor[] = [
    {
      name: 'Crowd Density',
      score: Math.round(crowdScore),
      weight: 0.4,
      weightedScore: crowdScore * 0.4,
      icon: '👥',
      trend: 'stable',
    },
    {
      name: 'Weather',
      score: Math.round(weatherScore),
      weight: 0.2,
      weightedScore: weatherScore * 0.2,
      icon: weather.icon,
      trend: 'stable',
    },
    {
      name: 'Transit Load',
      score: Math.round(transitScore),
      weight: 0.15,
      weightedScore: transitScore * 0.15,
      icon: '🚌',
      trend: 'stable',
    },
    {
      name: 'Incidents',
      score: Math.round(incidentScore),
      weight: 0.15,
      weightedScore: incidentScore * 0.15,
      icon: '⚠️',
      trend: 'stable',
    },
    {
      name: 'Match Rivalry',
      score: Math.round(rivalryScore),
      weight: 0.1,
      weightedScore: rivalryScore * 0.1,
      icon: '⚽',
      trend: 'stable',
    },
  ];

  const overallScore = Math.round(
    factors.reduce((sum, f) => sum + f.weightedScore, 0)
  );

  // Determine trend per factor
  if (previousScores.length > 0) {
    const prevOverall = previousScores[previousScores.length - 1];
    const diff = overallScore - prevOverall;
    // Apply trend to primary factor (crowd)
    factors[0].trend = diff > 2 ? 'worsening' : diff < -2 ? 'improving' : 'stable';
  }
  previousScores.push(overallScore);
  if (previousScores.length > 30) previousScores.shift();

  // Risk level
  const level = overallScore <= 30 ? 'LOW' : overallScore <= 55 ? 'MODERATE' : overallScore <= 80 ? 'HIGH' : 'CRITICAL';

  // AI-generated summary
  const summary = generateSummary(level, factors, match, weather);
  const recommendations = generateRecommendations(level, factors, crowdData);

  return {
    overallScore: clamp(overallScore, 0, 100),
    level,
    factors,
    summary,
    recommendations,
    timestamp: Date.now(),
  };
}

function generateSummary(
  level: string,
  factors: RiskFactor[],
  match: { teamA: string; teamB: string; stage: string },
  weather: { description: string },
): string {
  const topFactor = factors.reduce((a, b) => a.weightedScore > b.weightedScore ? a : b);
  
  const summaries: Record<string, string> = {
    LOW: `Stadium operations nominal for ${match.teamA} vs ${match.teamB} (${match.stage}). ${weather.description}. All zones within normal parameters.`,
    MODERATE: `Elevated activity detected — primary driver: ${topFactor.name} (${topFactor.score}%). ${match.stage} match ${match.teamA} vs ${match.teamB}. ${weather.description}. Monitor concourse flow.`,
    HIGH: `⚠️ High risk alert — ${topFactor.name} at ${topFactor.score}%. ${match.teamA} vs ${match.teamB} (${match.stage}). ${weather.description}. Recommend activating contingency protocols.`,
    CRITICAL: `🚨 CRITICAL — ${topFactor.name} exceeding safe thresholds (${topFactor.score}%). Immediate action required. ${match.teamA} vs ${match.teamB}. ${weather.description}. All response teams on standby.`,
  };

  return summaries[level] || summaries['LOW'];
}

function generateRecommendations(
  _level: string,
  factors: RiskFactor[],
  crowdData: CrowdSnapshot | null,
): string[] {
  const recs: string[] = [];

  // Crowd-based recommendations
  if (factors[0].score > 75) {
    const hotZones = crowdData?.zones
      .filter(z => z.density > 85)
      .map(z => z.zoneId.replace('zone-', '').replace('-', ' ').toUpperCase())
      .slice(0, 3);
    
    if (hotZones && hotZones.length > 0) {
      recs.push(`Divert incoming fans away from congested zones: ${hotZones.join(', ')}`);
    }
    recs.push('Consider opening auxiliary gates to distribute crowd flow');
  }

  // Weather-based
  if (factors[1].score > 50) {
    recs.push('Activate weather contingency protocols — brief all volunteer staff');
    if (factors[1].score > 70) {
      recs.push('Prepare indoor shelter areas and distribute water bottles');
    }
  }

  // Transit-based
  if (factors[2].score > 60) {
    recs.push('Coordinate with NJ Transit for additional shuttle capacity');
  }

  // Incident-based
  if (factors[3].score > 40) {
    recs.push('Deploy additional medical and security teams to high-activity zones');
  }

  // Rivalry-based
  if (factors[4].score > 70) {
    recs.push('Increase security presence in mixed-supporter zones');
  }

  if (recs.length === 0) {
    recs.push('All operations normal — continue standard monitoring');
  }

  return recs;
}

export function getRiskHistory(): number[] {
  return [...previousScores];
}
