/**
 * Transit Engine — Public Transport & Parking Integration
 *
 * Manages NJ Transit, PATH, shuttle, rideshare, and parking
 * data for stadium ingress/egress planning.
 */

export interface TransitOption {
  id: string;
  type: 'train' | 'bus' | 'shuttle' | 'rideshare' | 'parking';
  name: string;
  status: 'on-time' | 'delayed' | 'cancelled' | 'full';
  nextDeparture: string;
  frequency: string;
  capacity: number;
  currentLoad: number; // 0-100%
  destination: string;
  estimatedMinutes: number;
  icon: string;
  gate: string; // nearest stadium gate
}

export interface ParkingLot {
  id: string;
  name: string;
  totalSpots: number;
  usedSpots: number;
  occupancy: number; // 0-100%
  evChargers: number;
  evChargersAvailable: number;
  distanceFromStadium: number; // meters
  estimatedExitMinutes: number;
}

// Simulated transit data for MetLife Stadium
export function getTransitOptions(): TransitOption[] {
  return [
    {
      id: 'nj-transit-meadowlands',
      type: 'train',
      name: 'NJ Transit — Meadowlands Line',
      status: 'on-time',
      nextDeparture: '10 min',
      frequency: 'Every 12 min',
      capacity: 1200,
      currentLoad: 72,
      destination: 'Secaucus Junction → Penn Station NY',
      estimatedMinutes: 25,
      icon: '🚆',
      gate: 'Gate A',
    },
    {
      id: 'shuttle-a',
      type: 'shuttle',
      name: 'FIFA Fan Shuttle — Route A',
      status: 'on-time',
      nextDeparture: '5 min',
      frequency: 'Every 8 min',
      capacity: 55,
      currentLoad: 65,
      destination: 'Times Square Transit Hub',
      estimatedMinutes: 35,
      icon: '🚌',
      gate: 'Gate B',
    },
    {
      id: 'shuttle-b',
      type: 'shuttle',
      name: 'FIFA Fan Shuttle — Route B',
      status: 'on-time',
      nextDeparture: '8 min',
      frequency: 'Every 10 min',
      capacity: 55,
      currentLoad: 45,
      destination: 'Newark Penn Station',
      estimatedMinutes: 20,
      icon: '🚌',
      gate: 'Gate D',
    },
    {
      id: 'bus-164',
      type: 'bus',
      name: 'NJ Transit Bus 164',
      status: 'delayed',
      nextDeparture: '18 min',
      frequency: 'Every 15 min',
      capacity: 60,
      currentLoad: 85,
      destination: 'Port Authority Bus Terminal',
      estimatedMinutes: 40,
      icon: '🚍',
      gate: 'Gate C',
    },
    {
      id: 'rideshare-zone',
      type: 'rideshare',
      name: 'Uber / Lyft Pickup Zone',
      status: 'on-time',
      nextDeparture: 'On demand',
      frequency: 'Continuous',
      capacity: 500,
      currentLoad: 60,
      destination: 'Custom destination',
      estimatedMinutes: 5,
      icon: '🚗',
      gate: 'Gate C',
    },
  ];
}

export function getParkingLots(): ParkingLot[] {
  return [
    {
      id: 'lot-a', name: 'Lot A (Main)', totalSpots: 8000, usedSpots: 7200,
      occupancy: 90, evChargers: 40, evChargersAvailable: 8,
      distanceFromStadium: 200, estimatedExitMinutes: 25,
    },
    {
      id: 'lot-b', name: 'Lot B (East)', totalSpots: 5000, usedSpots: 4100,
      occupancy: 82, evChargers: 24, evChargersAvailable: 6,
      distanceFromStadium: 400, estimatedExitMinutes: 15,
    },
    {
      id: 'lot-c', name: 'Lot C (Remote)', totalSpots: 6000, usedSpots: 3000,
      occupancy: 50, evChargers: 16, evChargersAvailable: 12,
      distanceFromStadium: 800, estimatedExitMinutes: 10,
    },
    {
      id: 'lot-d', name: 'Lot D (VIP)', totalSpots: 1200, usedSpots: 1080,
      occupancy: 90, evChargers: 20, evChargersAvailable: 3,
      distanceFromStadium: 150, estimatedExitMinutes: 30,
    },
  ];
}

export function getStaggeredDepartureSuggestion(matchMinute: number): string {
  if (matchMinute < 85) {
    return 'Match in progress — plan your departure route now to avoid post-match congestion.';
  }
  if (matchMinute < 90) {
    return 'Match ending soon. Early departure now can save 20-30 min. NJ Transit trains loading at Gate A.';
  }
  if (matchMinute < 100) {
    return 'Post-match rush — consider waiting 15 min for crowds to thin. Lot C has shortest exit time (10 min).';
  }
  return 'Crowds subsiding. All transit options available. Shuttle Route B has shortest wait (8 min).';
}

export function getTransitRecommendation(currentLoad: Record<string, number>): string {
  const options = getTransitOptions();
  const bestOption = options
    .filter(o => o.status !== 'cancelled' && o.currentLoad < 80)
    .sort((a, b) => a.estimatedMinutes - b.estimatedMinutes)[0];

  if (!bestOption) {
    return 'All transit options are currently at high capacity. Consider waiting 15 min or using rideshare.';
  }

  return `Recommended: ${bestOption.icon} ${bestOption.name} — ${bestOption.nextDeparture}, ${bestOption.estimatedMinutes} min to ${bestOption.destination}. Current load: ${bestOption.currentLoad}%.`;
}
