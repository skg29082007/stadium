/**
 * Incident state store
 * 
 * IMPORTANT: Do NOT put derived array methods (getActiveIncidents etc.)
 * inside the store. Calling them as selectors creates new arrays every render
 * which causes "Maximum update depth exceeded" infinite loops.
 * Instead, select `incidents` and filter in the component (or useMemo).
 */
import { create } from 'zustand';
import { type Incident, generateRandomIncident } from '../engine/incident-triage';

interface IncidentState {
  incidents: Incident[];
  addIncident: (incident: Incident) => void;
  addRandomIncident: () => void;
  updateStatus: (id: string, status: Incident['status'], assignedTo?: string) => void;
  resolveIncident: (id: string) => void;
}

export const useIncidentStore = create<IncidentState>((set) => ({
  incidents: [],

  addIncident: (incident) => set((s) => ({
    incidents: [incident, ...s.incidents].slice(0, 100),
  })),

  addRandomIncident: () => {
    const incident = generateRandomIncident();
    set((s) => ({
      incidents: [incident, ...s.incidents].slice(0, 100),
    }));
  },

  updateStatus: (id, status, assignedTo) => set((s) => ({
    incidents: s.incidents.map(i =>
      i.id === id ? { ...i, status, assignedTo: assignedTo ?? i.assignedTo, updatedAt: Date.now() } : i
    ),
  })),

  resolveIncident: (id) => set((s) => ({
    incidents: s.incidents.map(i =>
      i.id === id ? { ...i, status: 'RESOLVED' as const, resolvedAt: Date.now(), updatedAt: Date.now() } : i
    ),
  })),
}));

// --- Helper selectors (use these in components with useMemo) ---
export function selectActiveIncidents(incidents: Incident[]): Incident[] {
  return incidents.filter(i => i.status !== 'RESOLVED');
}

export function selectByPriority(incidents: Incident[], priority: Incident['priority']): Incident[] {
  return incidents.filter(i => i.priority === priority && i.status !== 'RESOLVED');
}
