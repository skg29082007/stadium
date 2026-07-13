/**
 * Dijkstra's Shortest Path with Crowd-Weighted Edges
 * 
 * Uses a binary-heap priority queue for O(E log V) performance.
 * Edge weights are dynamically modified by zone crowd density.
 */

import { stadiumNodes, stadiumEdges, getNodeById, type GraphNode, type GraphEdge } from '../data/stadium-graph';
import { getZoneForSection } from '../data/stadium-zones';
import { ROUTE_CONGESTION_MULTIPLIER } from '../utils/constants';

export interface PathResult {
  path: GraphNode[];
  totalDistance: number;
  estimatedMinutes: number;
  directions: Direction[];
  congestionLevel: 'low' | 'moderate' | 'high';
}

export interface Direction {
  instruction: string;
  distance: number;
  fromNode: string;
  toNode: string;
  icon: string;
}

// Simple binary heap priority queue
class MinHeap {
  private heap: { node: string; priority: number }[] = [];

  push(node: string, priority: number): void {
    this.heap.push({ node, priority });
    this._bubbleUp(this.heap.length - 1);
  }

  pop(): { node: string; priority: number } | undefined {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return min;
  }

  get size(): number {
    return this.heap.length;
  }

  private _bubbleUp(idx: number): void {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.heap[parent].priority <= this.heap[idx].priority) break;
      [this.heap[parent], this.heap[idx]] = [this.heap[idx], this.heap[parent]];
      idx = parent;
    }
  }

  private _sinkDown(idx: number): void {
    const length = this.heap.length;
    while (true) {
      let smallest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      if (left < length && this.heap[left].priority < this.heap[smallest].priority) smallest = left;
      if (right < length && this.heap[right].priority < this.heap[smallest].priority) smallest = right;
      if (smallest === idx) break;
      [this.heap[smallest], this.heap[idx]] = [this.heap[idx], this.heap[smallest]];
      idx = smallest;
    }
  }
}

// Build adjacency list from edges
function buildAdjacencyList(): Map<string, { to: string; distance: number; accessible: boolean; edge: GraphEdge }[]> {
  const adj = new Map<string, { to: string; distance: number; accessible: boolean; edge: GraphEdge }[]>();
  
  for (const edge of stadiumEdges) {
    if (!adj.has(edge.from)) adj.set(edge.from, []);
    adj.get(edge.from)!.push({ to: edge.to, distance: edge.distance, accessible: edge.accessible, edge });
  }
  
  return adj;
}

const adjacencyList = buildAdjacencyList();

/**
 * Apply crowd density weighting to edge distances.
 * Congested zones (>85%) get multiplied weight to encourage alternative routes.
 */
function getWeightedDistance(
  edge: GraphEdge,
  crowdDensity: Record<string, number>,
): number {
  let weight = edge.distance;
  
  // Check if destination zone is congested
  const destNode = getNodeById(edge.to);
  if (destNode) {
    const zone = getZoneForSection(edge.to);
    if (zone) {
      const density = crowdDensity[zone.id] ?? 50;
      if (density > 85) {
        weight *= ROUTE_CONGESTION_MULTIPLIER;
      } else if (density > 75) {
        weight *= 1.5;
      } else if (density > 60) {
        weight *= 1.2;
      }
    }
  }
  
  return weight;
}

/**
 * Find shortest path using Dijkstra's algorithm
 */
export function findPath(
  startId: string,
  endId: string,
  crowdDensity: Record<string, number> = {},
  accessibleOnly: boolean = false,
): PathResult | null {
  const startNode = getNodeById(startId);
  const endNode = getNodeById(endId);
  if (!startNode || !endNode) return null;

  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const visited = new Set<string>();
  const pq = new MinHeap();

  // Initialize
  for (const node of stadiumNodes) {
    dist[node.id] = Infinity;
    prev[node.id] = null;
  }
  dist[startId] = 0;
  pq.push(startId, 0);

  while (pq.size > 0) {
    const current = pq.pop()!;
    if (visited.has(current.node)) continue;
    visited.add(current.node);

    if (current.node === endId) break;

    const neighbors = adjacencyList.get(current.node) ?? [];
    for (const neighbor of neighbors) {
      if (visited.has(neighbor.to)) continue;
      if (accessibleOnly && !neighbor.accessible) continue;

      const w = getWeightedDistance(neighbor.edge, crowdDensity);
      const alt = dist[current.node] + w;
      
      if (alt < dist[neighbor.to]) {
        dist[neighbor.to] = alt;
        prev[neighbor.to] = current.node;
        pq.push(neighbor.to, alt);
      }
    }
  }

  // Reconstruct path
  if (dist[endId] === Infinity) return null;

  const pathIds: string[] = [];
  let at: string | null = endId;
  while (at !== null) {
    pathIds.push(at);
    at = prev[at];
  }
  pathIds.reverse();

  const path = pathIds.map(id => getNodeById(id)!);
  const totalDistance = dist[endId];
  
  // Average walking speed ~1.3 m/s (4.7 km/h) in a crowded stadium
  const walkingSpeed = 1.3;
  const estimatedMinutes = totalDistance / walkingSpeed / 60;

  // Generate directions
  const directions = generateDirections(path);

  // Assess congestion along route
  const avgDensity = assessRouteCongestion(path, crowdDensity);
  const congestionLevel = avgDensity > 85 ? 'high' : avgDensity > 60 ? 'moderate' : 'low';

  return {
    path,
    totalDistance: Math.round(totalDistance),
    estimatedMinutes: Math.round(estimatedMinutes * 10) / 10,
    directions,
    congestionLevel,
  };
}

function generateDirections(path: GraphNode[]): Direction[] {
  const directions: Direction[] = [];
  
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    const edge = stadiumEdges.find(e => e.from === from.id && e.to === to.id);
    const distance = edge?.distance ?? 0;

    let instruction = '';
    let icon = '➡️';

    if (to.type === 'gate') {
      instruction = `Head to ${to.label}`;
      icon = '🚪';
    } else if (to.type === 'section') {
      if (from.level !== to.level) {
        const going = from.level === 'lower' ? 'up' : from.level === 'upper' ? 'down' : (to.level === 'upper' ? 'up' : 'down');
        instruction = `Take stairs/ramp ${going} to ${to.label}`;
        icon = going === 'up' ? '⬆️' : '⬇️';
      } else {
        instruction = `Continue to ${to.label}`;
        icon = '🏟️';
      }
    } else if (to.type === 'concourse') {
      instruction = `Walk through ${to.label}`;
      icon = '🚶';
    } else if (to.type === 'restroom') {
      instruction = `Restroom on your ${i > 0 ? 'right' : 'left'}`;
      icon = '🚻';
    } else if (to.type === 'food') {
      instruction = `${to.label} ahead`;
      icon = '🍔';
    } else if (to.type === 'medical') {
      instruction = `${to.label} — turn right`;
      icon = '🏥';
    } else if (to.type === 'elevator') {
      instruction = `Take elevator at ${to.label}`;
      icon = '🛗';
    } else if (to.type === 'info') {
      instruction = `${to.label} on your left`;
      icon = 'ℹ️';
    } else if (to.type === 'merchandise') {
      instruction = `${to.label} ahead`;
      icon = '🛍️';
    } else {
      instruction = `Continue to ${to.label}`;
    }

    directions.push({ instruction, distance, fromNode: from.id, toNode: to.id, icon });
  }

  return directions;
}

function assessRouteCongestion(path: GraphNode[], crowdDensity: Record<string, number>): number {
  let totalDensity = 0;
  let count = 0;
  
  for (const node of path) {
    const zone = getZoneForSection(node.id);
    if (zone && crowdDensity[zone.id] !== undefined) {
      totalDensity += crowdDensity[zone.id];
      count++;
    }
  }
  
  return count > 0 ? totalDensity / count : 50;
}
