/**
 * Crowd data state store — real-time crowd density + predictions
 */
import { create } from 'zustand';
import { generateCrowdSnapshot, type CrowdSnapshot } from '../data/crowd-simulator';
import { predictDensity, type ZonePrediction } from '../engine/crowd-predictor';
import type { MatchPhase } from '../utils/constants';

interface CrowdState {
  snapshot: CrowdSnapshot | null;
  predictions: ZonePrediction[];
  history: CrowdSnapshot[];
  densityMap: Record<string, number>; // zoneId -> density for quick lookup

  updateCrowd: (phase: MatchPhase, matchMinute: number) => void;
  getDensity: (zoneId: string) => number;
}

export const useCrowdStore = create<CrowdState>((set, get) => ({
  snapshot: null,
  predictions: [],
  history: [],
  densityMap: {},

  updateCrowd: (phase, matchMinute) => {
    const snapshot = generateCrowdSnapshot(phase, matchMinute);
    const predictions = predictDensity(snapshot.zones, phase);
    
    const densityMap: Record<string, number> = {};
    snapshot.zones.forEach(z => { densityMap[z.zoneId] = z.density; });

    set((state) => ({
      snapshot,
      predictions,
      densityMap,
      history: [...state.history.slice(-120), snapshot], // keep last ~4 min
    }));
  },

  getDensity: (zoneId) => get().densityMap[zoneId] ?? 50,
}));
