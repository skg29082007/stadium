/**
 * MetLife Stadium (New York New Jersey Stadium) Navigation Graph
 * 
 * Nodes: Gates, sections, concourses, amenities
 * Edges: Walking paths with base distance (meters)
 * 
 * Layout:
 *   - 4 Gates (A=North, B=East, C=South, D=West)
 *   - Lower Bowl: Sections 101-120 (ring around pitch)
 *   - Mezzanine: Sections 201-216
 *   - Upper: Sections 301-316
 *   - 4 Concourses (N, E, S, W)
 *   - Amenities scattered throughout
 */

export interface GraphNode {
  id: string;
  label: string;
  type: 'gate' | 'section' | 'concourse' | 'restroom' | 'food' | 'medical' | 'exit' | 'elevator' | 'info' | 'merchandise';
  zone: string;
  level: 'ground' | 'lower' | 'mezzanine' | 'upper';
  x: number; // normalized 0-1 position on stadium map
  y: number;
  accessible: boolean;
  capacity?: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  distance: number; // meters
  accessible: boolean;
  level: 'ground' | 'lower' | 'mezzanine' | 'upper' | 'vertical';
}

// Helper to create section nodes in a circular layout
function sectionNode(id: string, label: string, level: 'lower' | 'mezzanine' | 'upper', index: number, total: number, zone: string): GraphNode {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const radiusMap = { lower: 0.3, mezzanine: 0.37, upper: 0.44 };
  const r = radiusMap[level];
  return {
    id, label, type: 'section', zone, level, accessible: true,
    x: 0.5 + Math.cos(angle) * r,
    y: 0.5 + Math.sin(angle) * r,
    capacity: level === 'lower' ? 800 : level === 'mezzanine' ? 600 : 500,
  };
}

// Generate nodes
function generateNodes(): GraphNode[] {
  const nodes: GraphNode[] = [];

  // Gates
  nodes.push({ id: 'gate-a', label: 'Gate A (North)', type: 'gate', zone: 'north', level: 'ground', x: 0.5, y: 0.05, accessible: true });
  nodes.push({ id: 'gate-b', label: 'Gate B (East)', type: 'gate', zone: 'east', level: 'ground', x: 0.95, y: 0.5, accessible: true });
  nodes.push({ id: 'gate-c', label: 'Gate C (South)', type: 'gate', zone: 'south', level: 'ground', x: 0.5, y: 0.95, accessible: true });
  nodes.push({ id: 'gate-d', label: 'Gate D (West)', type: 'gate', zone: 'west', level: 'ground', x: 0.05, y: 0.5, accessible: true });

  // Concourses
  nodes.push({ id: 'conc-n', label: 'North Concourse', type: 'concourse', zone: 'north', level: 'lower', x: 0.5, y: 0.15, accessible: true });
  nodes.push({ id: 'conc-e', label: 'East Concourse', type: 'concourse', zone: 'east', level: 'lower', x: 0.85, y: 0.5, accessible: true });
  nodes.push({ id: 'conc-s', label: 'South Concourse', type: 'concourse', zone: 'south', level: 'lower', x: 0.5, y: 0.85, accessible: true });
  nodes.push({ id: 'conc-w', label: 'West Concourse', type: 'concourse', zone: 'west', level: 'lower', x: 0.15, y: 0.5, accessible: true });

  // Lower Bowl: Sections 101-120 (circular)
  for (let i = 0; i < 20; i++) {
    const num = 101 + i;
    const zone = i < 5 ? 'north' : i < 10 ? 'east' : i < 15 ? 'south' : 'west';
    nodes.push(sectionNode(`sec-${num}`, `Section ${num}`, 'lower', i, 20, zone));
  }

  // Mezzanine: Sections 201-216 (circular)
  for (let i = 0; i < 16; i++) {
    const num = 201 + i;
    const zone = i < 4 ? 'north' : i < 8 ? 'east' : i < 12 ? 'south' : 'west';
    nodes.push(sectionNode(`sec-${num}`, `Section ${num}`, 'mezzanine', i, 16, zone));
  }

  // Upper: Sections 301-316 (circular)
  for (let i = 0; i < 16; i++) {
    const num = 301 + i;
    const zone = i < 4 ? 'north' : i < 8 ? 'east' : i < 12 ? 'south' : 'west';
    nodes.push(sectionNode(`sec-${num}`, `Section ${num}`, 'upper', i, 16, zone));
  }

  // Amenities - Restrooms
  const restroomPositions = [
    { id: 'rest-n1', zone: 'north', x: 0.38, y: 0.13 },
    { id: 'rest-n2', zone: 'north', x: 0.62, y: 0.13 },
    { id: 'rest-e1', zone: 'east', x: 0.87, y: 0.38 },
    { id: 'rest-e2', zone: 'east', x: 0.87, y: 0.62 },
    { id: 'rest-s1', zone: 'south', x: 0.38, y: 0.87 },
    { id: 'rest-s2', zone: 'south', x: 0.62, y: 0.87 },
    { id: 'rest-w1', zone: 'west', x: 0.13, y: 0.38 },
    { id: 'rest-w2', zone: 'west', x: 0.13, y: 0.62 },
  ];
  restroomPositions.forEach(p => {
    nodes.push({ ...p, label: 'Restroom', type: 'restroom', level: 'lower', accessible: true });
  });

  // Food Courts
  const foodPositions = [
    { id: 'food-n', zone: 'north', x: 0.5, y: 0.18, label: 'FIFA Fan Food Court North' },
    { id: 'food-e', zone: 'east', x: 0.82, y: 0.5, label: 'Grills & Bites East' },
    { id: 'food-s', zone: 'south', x: 0.5, y: 0.82, label: 'Stadium Eats South' },
    { id: 'food-w', zone: 'west', x: 0.18, y: 0.5, label: 'International Flavors West' },
    { id: 'food-ne', zone: 'north', x: 0.72, y: 0.22, label: 'Quick Bites NE' },
    { id: 'food-sw', zone: 'south', x: 0.28, y: 0.78, label: 'Quick Bites SW' },
  ];
  foodPositions.forEach(p => {
    nodes.push({ ...p, type: 'food', level: 'lower', accessible: true });
  });

  // Medical Stations
  nodes.push({ id: 'med-n', label: 'Medical Station North', type: 'medical', zone: 'north', level: 'lower', x: 0.45, y: 0.12, accessible: true });
  nodes.push({ id: 'med-e', label: 'Medical Station East', type: 'medical', zone: 'east', level: 'lower', x: 0.88, y: 0.45, accessible: true });
  nodes.push({ id: 'med-s', label: 'Medical Station South', type: 'medical', zone: 'south', level: 'lower', x: 0.55, y: 0.88, accessible: true });
  nodes.push({ id: 'med-w', label: 'Medical Station West', type: 'medical', zone: 'west', level: 'lower', x: 0.12, y: 0.55, accessible: true });

  // Elevators
  nodes.push({ id: 'elev-n', label: 'Elevator North', type: 'elevator', zone: 'north', level: 'lower', x: 0.42, y: 0.16, accessible: true });
  nodes.push({ id: 'elev-e', label: 'Elevator East', type: 'elevator', zone: 'east', level: 'lower', x: 0.84, y: 0.42, accessible: true });
  nodes.push({ id: 'elev-s', label: 'Elevator South', type: 'elevator', zone: 'south', level: 'lower', x: 0.58, y: 0.84, accessible: true });
  nodes.push({ id: 'elev-w', label: 'Elevator West', type: 'elevator', zone: 'west', level: 'lower', x: 0.16, y: 0.58, accessible: true });

  // Info Points
  nodes.push({ id: 'info-n', label: 'Info Desk North', type: 'info', zone: 'north', level: 'ground', x: 0.5, y: 0.1, accessible: true });
  nodes.push({ id: 'info-s', label: 'Info Desk South', type: 'info', zone: 'south', level: 'ground', x: 0.5, y: 0.9, accessible: true });

  // Merchandise
  nodes.push({ id: 'merch-n', label: 'FIFA Store North', type: 'merchandise', zone: 'north', level: 'lower', x: 0.55, y: 0.18, accessible: true });
  nodes.push({ id: 'merch-s', label: 'FIFA Store South', type: 'merchandise', zone: 'south', level: 'lower', x: 0.45, y: 0.82, accessible: true });

  return nodes;
}

// Generate edges to connect the graph
function generateEdges(_nodes: GraphNode[]): GraphEdge[] {
  const edges: GraphEdge[] = [];

  const addEdge = (from: string, to: string, distance: number, accessible = true, level: GraphEdge['level'] = 'lower') => {
    edges.push({ from, to, distance, accessible, level });
    edges.push({ from: to, to: from, distance, accessible, level }); // bidirectional
  };

  // Gates to concourses
  addEdge('gate-a', 'conc-n', 40, true, 'ground');
  addEdge('gate-b', 'conc-e', 40, true, 'ground');
  addEdge('gate-c', 'conc-s', 40, true, 'ground');
  addEdge('gate-d', 'conc-w', 40, true, 'ground');

  // Gates to info desks
  addEdge('gate-a', 'info-n', 15, true, 'ground');
  addEdge('gate-c', 'info-s', 15, true, 'ground');

  // Concourse ring (lower level)
  addEdge('conc-n', 'conc-e', 120);
  addEdge('conc-e', 'conc-s', 120);
  addEdge('conc-s', 'conc-w', 120);
  addEdge('conc-w', 'conc-n', 120);

  // Concourses to nearby lower sections
  const concSections: Record<string, number[]> = {
    'conc-n': [101, 102, 103, 104, 105],
    'conc-e': [106, 107, 108, 109, 110],
    'conc-s': [111, 112, 113, 114, 115],
    'conc-w': [116, 117, 118, 119, 120],
  };
  Object.entries(concSections).forEach(([conc, secs]) => {
    secs.forEach((s, i) => {
      addEdge(conc, `sec-${s}`, 25 + i * 8);
    });
  });

  // Adjacent lower sections
  for (let i = 101; i <= 119; i++) {
    addEdge(`sec-${i}`, `sec-${i + 1}`, 15);
  }
  addEdge('sec-120', 'sec-101', 15); // close the ring

  // Adjacent mezzanine sections
  for (let i = 201; i <= 215; i++) {
    addEdge(`sec-${i}`, `sec-${i + 1}`, 18);
  }
  addEdge('sec-216', 'sec-201', 18);

  // Adjacent upper sections
  for (let i = 301; i <= 315; i++) {
    addEdge(`sec-${i}`, `sec-${i + 1}`, 18);
  }
  addEdge('sec-316', 'sec-301', 18);

  // Lower to mezzanine (stairs/ramps)
  for (let i = 0; i < 16; i++) {
    const lower = 101 + Math.floor(i * 20 / 16);
    const mezz = 201 + i;
    addEdge(`sec-${lower}`, `sec-${mezz}`, 35, true, 'vertical');
  }

  // Mezzanine to upper (stairs/ramps)
  for (let i = 0; i < 16; i++) {
    const mezz = 201 + i;
    const upper = 301 + i;
    addEdge(`sec-${mezz}`, `sec-${upper}`, 35, true, 'vertical');
  }

  // Elevators connect all levels
  const elevZones = [
    { elev: 'elev-n', lower: 'sec-103', mezz: 'sec-203', upper: 'sec-303' },
    { elev: 'elev-e', lower: 'sec-108', mezz: 'sec-207', upper: 'sec-307' },
    { elev: 'elev-s', lower: 'sec-113', mezz: 'sec-211', upper: 'sec-311' },
    { elev: 'elev-w', lower: 'sec-118', mezz: 'sec-215', upper: 'sec-315' },
  ];
  elevZones.forEach(({ elev, lower, mezz, upper }) => {
    addEdge(elev, lower, 10, true, 'vertical');
    addEdge(elev, mezz, 20, true, 'vertical');
    addEdge(elev, upper, 30, true, 'vertical');
  });

  // Concourses to amenities
  addEdge('conc-n', 'rest-n1', 12);
  addEdge('conc-n', 'rest-n2', 12);
  addEdge('conc-n', 'food-n', 10);
  addEdge('conc-n', 'med-n', 15);
  addEdge('conc-n', 'elev-n', 8);
  addEdge('conc-n', 'merch-n', 10);

  addEdge('conc-e', 'rest-e1', 12);
  addEdge('conc-e', 'rest-e2', 12);
  addEdge('conc-e', 'food-e', 10);
  addEdge('conc-e', 'med-e', 15);
  addEdge('conc-e', 'elev-e', 8);

  addEdge('conc-s', 'rest-s1', 12);
  addEdge('conc-s', 'rest-s2', 12);
  addEdge('conc-s', 'food-s', 10);
  addEdge('conc-s', 'med-s', 15);
  addEdge('conc-s', 'elev-s', 8);
  addEdge('conc-s', 'merch-s', 10);

  addEdge('conc-w', 'rest-w1', 12);
  addEdge('conc-w', 'rest-w2', 12);
  addEdge('conc-w', 'food-w', 10);
  addEdge('conc-w', 'med-w', 15);
  addEdge('conc-w', 'elev-w', 8);

  // Cross-concourse food courts
  addEdge('food-ne', 'conc-n', 35);
  addEdge('food-ne', 'conc-e', 50);
  addEdge('food-sw', 'conc-s', 35);
  addEdge('food-sw', 'conc-w', 50);

  return edges;
}

export const stadiumNodes = generateNodes();
export const stadiumEdges = generateEdges(stadiumNodes);

export function getNodeById(id: string): GraphNode | undefined {
  return stadiumNodes.find(n => n.id === id);
}

export function getNodesByType(type: GraphNode['type']): GraphNode[] {
  return stadiumNodes.filter(n => n.type === type);
}

export function getNodesByZone(zone: string): GraphNode[] {
  return stadiumNodes.filter(n => n.zone === zone);
}

export function getSectionFromSeatInfo(section: number): GraphNode | undefined {
  return stadiumNodes.find(n => n.id === `sec-${section}`);
}

export function findNearestByType(fromId: string, type: GraphNode['type']): GraphNode | undefined {
  const from = getNodeById(fromId);
  if (!from) return undefined;
  
  const candidates = getNodesByType(type);
  let nearest: GraphNode | undefined;
  let minDist = Infinity;
  
  for (const c of candidates) {
    const dx = from.x - c.x;
    const dy = from.y - c.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      nearest = c;
    }
  }
  return nearest;
}
