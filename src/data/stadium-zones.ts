/**
 * Stadium Zones — 12 crowd monitoring zones
 * Each zone maps to a quadrant + level combination
 */

export interface StadiumZone {
  id: string;
  name: string;
  quadrant: 'north' | 'east' | 'south' | 'west';
  level: 'lower' | 'mezzanine' | 'upper';
  capacity: number;
  sections: string[]; // section IDs in this zone
  centerX: number; // map position
  centerY: number;
  color: string; // zone accent color
}

export const stadiumZones: StadiumZone[] = [
  // North
  { id: 'zone-n-lower', name: 'North Lower', quadrant: 'north', level: 'lower', capacity: 4000, sections: ['sec-101','sec-102','sec-103','sec-104','sec-105'], centerX: 0.5, centerY: 0.22, color: '#6c5ce7' },
  { id: 'zone-n-mezz', name: 'North Mezzanine', quadrant: 'north', level: 'mezzanine', capacity: 2400, sections: ['sec-201','sec-202','sec-203','sec-204'], centerX: 0.5, centerY: 0.16, color: '#a29bfe' },
  { id: 'zone-n-upper', name: 'North Upper', quadrant: 'north', level: 'upper', capacity: 2000, sections: ['sec-301','sec-302','sec-303','sec-304'], centerX: 0.5, centerY: 0.1, color: '#dfe6e9' },

  // East
  { id: 'zone-e-lower', name: 'East Lower', quadrant: 'east', level: 'lower', capacity: 4000, sections: ['sec-106','sec-107','sec-108','sec-109','sec-110'], centerX: 0.78, centerY: 0.5, color: '#00cec9' },
  { id: 'zone-e-mezz', name: 'East Mezzanine', quadrant: 'east', level: 'mezzanine', capacity: 2400, sections: ['sec-205','sec-206','sec-207','sec-208'], centerX: 0.84, centerY: 0.5, color: '#81ecec' },
  { id: 'zone-e-upper', name: 'East Upper', quadrant: 'east', level: 'upper', capacity: 2000, sections: ['sec-305','sec-306','sec-307','sec-308'], centerX: 0.9, centerY: 0.5, color: '#dfe6e9' },

  // South
  { id: 'zone-s-lower', name: 'South Lower', quadrant: 'south', level: 'lower', capacity: 4000, sections: ['sec-111','sec-112','sec-113','sec-114','sec-115'], centerX: 0.5, centerY: 0.78, color: '#fdcb6e' },
  { id: 'zone-s-mezz', name: 'South Mezzanine', quadrant: 'south', level: 'mezzanine', capacity: 2400, sections: ['sec-209','sec-210','sec-211','sec-212'], centerX: 0.5, centerY: 0.84, color: '#ffeaa7' },
  { id: 'zone-s-upper', name: 'South Upper', quadrant: 'south', level: 'upper', capacity: 2000, sections: ['sec-309','sec-310','sec-311','sec-312'], centerX: 0.5, centerY: 0.9, color: '#dfe6e9' },

  // West
  { id: 'zone-w-lower', name: 'West Lower', quadrant: 'west', level: 'lower', capacity: 4000, sections: ['sec-116','sec-117','sec-118','sec-119','sec-120'], centerX: 0.22, centerY: 0.5, color: '#e17055' },
  { id: 'zone-w-mezz', name: 'West Mezzanine', quadrant: 'west', level: 'mezzanine', capacity: 2400, sections: ['sec-213','sec-214','sec-215','sec-216'], centerX: 0.16, centerY: 0.5, color: '#fab1a0' },
  { id: 'zone-w-upper', name: 'West Upper', quadrant: 'west', level: 'upper', capacity: 2000, sections: ['sec-313','sec-314','sec-315','sec-316'], centerX: 0.1, centerY: 0.5, color: '#dfe6e9' },
];

export function getZoneById(id: string): StadiumZone | undefined {
  return stadiumZones.find(z => z.id === id);
}

export function getZoneForSection(sectionId: string): StadiumZone | undefined {
  return stadiumZones.find(z => z.sections.includes(sectionId));
}

export function getZonesByQuadrant(quadrant: string): StadiumZone[] {
  return stadiumZones.filter(z => z.quadrant === quadrant);
}

export function getTotalCapacity(): number {
  return stadiumZones.reduce((sum, z) => sum + z.capacity, 0);
}
