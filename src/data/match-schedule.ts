/**
 * FIFA World Cup 2026 — Match Schedule (MetLife Stadium matches)
 */

export interface Match {
  id: string;
  matchday: number;
  date: string;
  kickoff: string;
  teamA: string;
  teamB: string;
  flagA: string;
  flagB: string;
  group: string;
  stage: string;
  score?: { a: number; b: number };
  status: 'upcoming' | 'live' | 'halftime' | 'finished';
  attendance?: number;
  rivalryIntensity: number; // 1-10
}

export const matchSchedule: Match[] = [
  {
    id: 'match-1', matchday: 1, date: '2026-06-11', kickoff: '17:00',
    teamA: 'Mexico', teamB: 'Canada', flagA: '🇲🇽', flagB: '🇨🇦',
    group: 'Group A', stage: 'Group Stage',
    score: { a: 2, b: 1 }, status: 'finished', attendance: 78500, rivalryIntensity: 7,
  },
  {
    id: 'match-2', matchday: 2, date: '2026-06-15', kickoff: '20:00',
    teamA: 'Brazil', teamB: 'Serbia', flagA: '🇧🇷', flagB: '🇷🇸',
    group: 'Group G', stage: 'Group Stage',
    score: { a: 3, b: 0 }, status: 'finished', attendance: 80200, rivalryIntensity: 5,
  },
  {
    id: 'match-3', matchday: 3, date: '2026-06-20', kickoff: '14:00',
    teamA: 'France', teamB: 'Argentina', flagA: '🇫🇷', flagB: '🇦🇷',
    group: 'Group F', stage: 'Group Stage',
    score: { a: 1, b: 2 }, status: 'finished', attendance: 80663, rivalryIntensity: 9,
  },
  {
    id: 'match-4', matchday: 4, date: '2026-06-28', kickoff: '18:00',
    teamA: 'USA', teamB: 'Germany', flagA: '🇺🇸', flagB: '🇩🇪',
    group: 'Round of 32', stage: 'Knockout',
    status: 'live', score: { a: 1, b: 1 }, attendance: 80663, rivalryIntensity: 8,
  },
  {
    id: 'match-5', matchday: 5, date: '2026-07-04', kickoff: '20:00',
    teamA: 'TBD', teamB: 'TBD', flagA: '🏳️', flagB: '🏳️',
    group: 'Quarter-Final', stage: 'Knockout',
    status: 'upcoming', rivalryIntensity: 7,
  },
  {
    id: 'match-6', matchday: 6, date: '2026-07-11', kickoff: '20:00',
    teamA: 'TBD', teamB: 'TBD', flagA: '🏳️', flagB: '🏳️',
    group: 'Semi-Final', stage: 'Knockout',
    status: 'upcoming', rivalryIntensity: 9,
  },
  {
    id: 'match-7', matchday: 7, date: '2026-07-19', kickoff: '16:00',
    teamA: 'TBD', teamB: 'TBD', flagA: '🏳️', flagB: '🏳️',
    group: 'FINAL', stage: 'Final',
    status: 'upcoming', rivalryIntensity: 10,
  },
];

export function getCurrentMatch(): Match {
  const live = matchSchedule.find(m => m.status === 'live');
  if (live) return live;
  return matchSchedule.find(m => m.status === 'upcoming') || matchSchedule[matchSchedule.length - 1];
}

export function getLiveMatch(): Match | undefined {
  return matchSchedule.find(m => m.status === 'live');
}

export function getUpcomingMatches(): Match[] {
  return matchSchedule.filter(m => m.status === 'upcoming');
}
