/**
 * Crowd Density Predictor — 15-min horizon
 * Uses moving average + trend extrapolation + phase awareness
 */

import type { ZoneDensity } from '../data/crowd-simulator';
import type { MatchPhase } from '../utils/constants';
import { clamp } from '../utils/formatters';

export interface ZonePrediction {
  zoneId: string;
  currentDensity: number;
  predictedDensity: number;
  confidence: number; // 0-1
  trend: 'rising' | 'falling' | 'stable';
  alertLevel: 'normal' | 'warning' | 'critical';
  bottleneckRisk: boolean;
}

// Rolling history per zone (last 60 readings = ~2 minutes at 2s intervals)
const history: Record<string, number[]> = {};
const MAX_HISTORY = 60;

export function updateHistory(zones: ZoneDensity[]): void {
  for (const zone of zones) {
    if (!history[zone.zoneId]) history[zone.zoneId] = [];
    history[zone.zoneId].push(zone.density);
    if (history[zone.zoneId].length > MAX_HISTORY) {
      history[zone.zoneId].shift();
    }
  }
}

export function predictDensity(
  zones: ZoneDensity[],
  matchPhase: MatchPhase,
): ZonePrediction[] {
  updateHistory(zones);

  return zones.map(zone => {
    const hist = history[zone.zoneId] || [zone.density];
    
    // Simple moving average of last 15 readings
    const recentWindow = hist.slice(-15);
    const olderWindow = hist.slice(-30, -15);
    
    const recentAvg = recentWindow.reduce((s, v) => s + v, 0) / recentWindow.length;
    const olderAvg = olderWindow.length > 0
      ? olderWindow.reduce((s, v) => s + v, 0) / olderWindow.length
      : recentAvg;

    // Trend slope (density change per reading)
    const slope = (recentAvg - olderAvg) / Math.max(recentWindow.length, 1);
    
    // Extrapolate 15 minutes ahead (~450 readings at 2s intervals)
    // But we dampen the extrapolation significantly to avoid wild predictions
    const extrapolationFactor = 30; // equivalent to ~1 minute of readings
    let predictedDensity = zone.density + slope * extrapolationFactor;

    // Phase-based adjustments
    const phaseBoosts: Record<MatchPhase, number> = {
      'pre-match': 8,     // density will rise
      'first-half': 2,    // stable/slight rise
      'halftime': -5,     // drop as people move to concourses
      'second-half': 3,   // rise again
      'post-match': -15,  // significant drop
    };
    predictedDensity += phaseBoosts[matchPhase];

    // Clamp to valid range
    predictedDensity = clamp(predictedDensity, 5, 99);

    // Confidence: higher with more history data
    const confidence = clamp(hist.length / MAX_HISTORY, 0.3, 0.95);

    // Determine trend
    const trendThreshold = 2;
    const trend: ZonePrediction['trend'] = 
      slope > trendThreshold ? 'rising' : 
      slope < -trendThreshold ? 'falling' : 'stable';

    // Alert level
    const alertLevel: ZonePrediction['alertLevel'] = 
      predictedDensity > 90 ? 'critical' :
      predictedDensity > 75 ? 'warning' : 'normal';

    // Bottleneck risk
    const bottleneckRisk = predictedDensity > 85 && trend === 'rising';

    return {
      zoneId: zone.zoneId,
      currentDensity: Math.round(zone.density * 10) / 10,
      predictedDensity: Math.round(predictedDensity * 10) / 10,
      confidence: Math.round(confidence * 100) / 100,
      trend,
      alertLevel,
      bottleneckRisk,
    };
  });
}

export function getBottleneckAlerts(predictions: ZonePrediction[]): ZonePrediction[] {
  return predictions.filter(p => p.bottleneckRisk);
}

export function getHighRiskZones(predictions: ZonePrediction[]): ZonePrediction[] {
  return predictions.filter(p => p.alertLevel === 'critical' || p.alertLevel === 'warning');
}

export function resetPredictorHistory(): void {
  Object.keys(history).forEach(k => delete history[k]);
}
