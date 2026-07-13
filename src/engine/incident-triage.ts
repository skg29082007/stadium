/**
 * Incident Triage Engine
 * Classifies incidents and assigns priority + response routing
 */

import type { IncidentCategory, IncidentPriority, IncidentStatus } from '../utils/constants';
import { generateId } from '../utils/formatters';

export interface Incident {
  id: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  status: IncidentStatus;
  title: string;
  description: string;
  zone: string;
  section?: string;
  reportedBy: string;
  assignedTo?: string;
  reportedAt: number;
  updatedAt: number;
  resolvedAt?: number;
  aiSummary: string;
  suggestedAction: string;
  estimatedResponseMinutes: number;
}

// Keyword-based classification
const categoryKeywords: Record<IncidentCategory, string[]> = {
  MEDICAL: ['medical', 'injury', 'hurt', 'collapsed', 'breathing', 'unconscious', 'ambulance', 'heart', 'bleeding', 'fainted', 'seizure', 'allergic'],
  SECURITY: ['fight', 'altercation', 'weapon', 'suspicious', 'threat', 'unauthorized', 'trespasser', 'violence', 'harassment', 'intoxicated', 'unruly'],
  MAINTENANCE: ['broken', 'spill', 'leak', 'malfunction', 'power', 'light', 'door', 'seat', 'plumbing', 'elevator', 'escalator', 'damaged'],
  CROWD: ['overcrowded', 'bottleneck', 'stampede', 'crush', 'congestion', 'blocked', 'capacity', 'overflow', 'stuck', 'trapped'],
  WEATHER: ['rain', 'storm', 'lightning', 'wind', 'heat', 'flood', 'slippery', 'thunder', 'tornado', 'hail'],
  TRANSIT: ['bus', 'train', 'parking', 'traffic', 'shuttle', 'delay', 'road', 'accident', 'transit', 'stranded'],
};

const priorityKeywords: Record<string, IncidentPriority> = {
  'collapsed': 'CRITICAL', 'unconscious': 'CRITICAL', 'heart': 'CRITICAL', 'breathing': 'CRITICAL',
  'stampede': 'CRITICAL', 'crush': 'CRITICAL', 'weapon': 'CRITICAL', 'fire': 'CRITICAL',
  'fight': 'HIGH', 'bleeding': 'HIGH', 'seizure': 'HIGH', 'overcrowded': 'HIGH',
  'injury': 'HIGH', 'violence': 'HIGH', 'trapped': 'HIGH',
  'spill': 'MEDIUM', 'broken': 'MEDIUM', 'leak': 'MEDIUM', 'suspicious': 'MEDIUM',
  'delay': 'LOW', 'malfunction': 'LOW', 'parking': 'LOW',
};

export function classifyIncident(description: string): { category: IncidentCategory; priority: IncidentPriority } {
  const lower = description.toLowerCase();

  // Classify category
  let bestCategory: IncidentCategory = 'MAINTENANCE';
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    const score = keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat as IncidentCategory;
    }
  }

  // Classify priority
  let priority: IncidentPriority = 'MEDIUM';
  for (const [kw, p] of Object.entries(priorityKeywords)) {
    if (lower.includes(kw)) {
      const levels: IncidentPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      if (levels.indexOf(p) > levels.indexOf(priority)) {
        priority = p;
      }
    }
  }

  return { category: bestCategory, priority };
}

export function createIncident(
  description: string,
  zone: string,
  reportedBy: string,
  section?: string,
  overrideCategory?: IncidentCategory,
  overridePriority?: IncidentPriority,
): Incident {
  const { category, priority } = classifyIncident(description);
  const finalCat = overrideCategory ?? category;
  const finalPri = overridePriority ?? priority;

  const titles: Record<IncidentCategory, string[]> = {
    MEDICAL: ['Medical Emergency', 'Medical Assistance Needed', 'Health Incident'],
    SECURITY: ['Security Alert', 'Security Incident', 'Safety Concern'],
    MAINTENANCE: ['Maintenance Required', 'Facility Issue', 'Equipment Malfunction'],
    CROWD: ['Crowd Control Alert', 'Overcrowding Detected', 'Crowd Management Issue'],
    WEATHER: ['Weather Alert', 'Weather-Related Hazard', 'Environmental Concern'],
    TRANSIT: ['Transit Disruption', 'Transportation Issue', 'Access Problem'],
  };

  const title = titles[finalCat][Math.floor(Math.random() * titles[finalCat].length)];

  const responseTimeMap: Record<IncidentPriority, number> = {
    CRITICAL: 2,
    HIGH: 5,
    MEDIUM: 10,
    LOW: 20,
  };

  const aiSummary = generateAISummary(finalCat, finalPri, description, zone);
  const suggestedAction = generateSuggestedAction(finalCat, finalPri, zone);

  return {
    id: generateId(),
    category: finalCat,
    priority: finalPri,
    status: 'NEW',
    title,
    description,
    zone,
    section,
    reportedBy,
    reportedAt: Date.now(),
    updatedAt: Date.now(),
    aiSummary,
    suggestedAction,
    estimatedResponseMinutes: responseTimeMap[finalPri],
  };
}

function generateAISummary(cat: IncidentCategory, pri: IncidentPriority, desc: string, zone: string): string {
  const zoneLabel = zone.replace('zone-', '').replace(/-/g, ' ').toUpperCase();
  return `${pri} ${cat} incident reported in ${zoneLabel}. AI Classification: ${cat} (${pri}). "${desc.slice(0, 80)}${desc.length > 80 ? '...' : ''}"`;
}

function generateSuggestedAction(cat: IncidentCategory, _pri: IncidentPriority, zone: string): string {
  const actions: Record<IncidentCategory, string> = {
    MEDICAL: `Deploy nearest medical team to ${zone}. Prepare stretcher if needed. Clear access path via least congested concourse.`,
    SECURITY: `Send security team to ${zone}. If HIGH/CRITICAL, alert command center and local law enforcement liaison.`,
    MAINTENANCE: `Dispatch maintenance crew to ${zone}. Place safety cones if hazard exists. Reroute foot traffic if needed.`,
    CROWD: `Activate crowd diversion protocol for ${zone}. Open auxiliary paths. Alert PA system operator.`,
    WEATHER: `Check weather advisory status. If storm — activate shelter protocols. Brief volunteer staff at ${zone}.`,
    TRANSIT: `Coordinate with transit ops. Deploy shuttle or redirect parking for ${zone}. Update digital signage.`,
  };
  return actions[cat] || `Investigate report at ${zone}. Assign nearest available team.`;
}

// Random incident generator for simulation
const randomDescriptions: { desc: string; zone: string; section?: string }[] = [
  { desc: 'Fan collapsed near restroom, appears dehydrated', zone: 'zone-n-lower', section: 'sec-103' },
  { desc: 'Spill on concourse floor creating slip hazard', zone: 'zone-e-lower' },
  { desc: 'Two fans in altercation near food court', zone: 'zone-s-lower', section: 'sec-112' },
  { desc: 'Overcrowding at Gate B entry checkpoint', zone: 'zone-e-lower' },
  { desc: 'Broken seat in section 207', zone: 'zone-e-mezz', section: 'sec-207' },
  { desc: 'Child separated from family near South concourse', zone: 'zone-s-lower' },
  { desc: 'Suspicious package reported near Gate D', zone: 'zone-w-lower' },
  { desc: 'Elevator malfunction at North tower', zone: 'zone-n-lower' },
  { desc: 'Fan having allergic reaction, needs EpiPen', zone: 'zone-w-mezz', section: 'sec-214' },
  { desc: 'Lightning spotted — weather check requested', zone: 'zone-n-upper' },
  { desc: 'Parking lot B exit blocked by stalled vehicle', zone: 'zone-e-lower' },
  { desc: 'Intoxicated fan being unruly in upper deck', zone: 'zone-s-upper', section: 'sec-310' },
  { desc: 'Power outage in West food court area', zone: 'zone-w-lower' },
  { desc: 'Medical team needed — fan with breathing difficulty', zone: 'zone-n-mezz', section: 'sec-202' },
  { desc: 'Bottleneck forming at North concourse stairs', zone: 'zone-n-lower' },
];

export function generateRandomIncident(): Incident {
  const template = randomDescriptions[Math.floor(Math.random() * randomDescriptions.length)];
  const staffNames = ['Officer Martinez', 'Volunteer Chen', 'Staff Wilson', 'Officer Nakamura', 'Volunteer Okafor', 'Staff Dubois'];
  const reporter = staffNames[Math.floor(Math.random() * staffNames.length)];
  return createIncident(template.desc, template.zone, reporter, template.section);
}
