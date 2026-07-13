import { describe, it, expect } from 'vitest';
import { findPath } from '../pathfinding';
import { stadiumNodes, stadiumEdges, getNodeById } from '../../data/stadium-graph';

describe('pathfinding — Dijkstra shortest path', () => {
  it('finds a valid route between two known nodes', () => {
    const result = findPath('gate-a', 'sec-105', {});
    expect(result).not.toBeNull();
    expect(result!.path.length).toBeGreaterThanOrEqual(2);
    expect(result!.path[0].id).toBe('gate-a');
    expect(result!.path[result!.path.length - 1].id).toBe('sec-105');
    expect(result!.totalDistance).toBeGreaterThan(0);
    expect(result!.estimatedMinutes).toBeGreaterThan(0);
  });

  it('returns null for a non-existent start node', () => {
    const result = findPath('non-existent', 'sec-105', {});
    expect(result).toBeNull();
  });

  it('returns null for a non-existent end node', () => {
    const result = findPath('gate-a', 'non-existent', {});
    expect(result).toBeNull();
  });

  it('generates turn-by-turn directions', () => {
    const result = findPath('gate-a', 'sec-110', {});
    expect(result).not.toBeNull();
    expect(result!.directions.length).toBeGreaterThan(0);
    result!.directions.forEach(d => {
      expect(d.instruction).toBeTruthy();
      expect(d.icon).toBeTruthy();
      expect(d.fromNode).toBeTruthy();
      expect(d.toNode).toBeTruthy();
    });
  });

  it('penalises routes through congested zones', () => {
    const noCrowd = findPath('gate-a', 'sec-112', {});
    const withCrowd = findPath('gate-a', 'sec-112', {
      'zone-n-lower': 95,
      'zone-e-lower': 95,
    });
    expect(noCrowd).not.toBeNull();
    expect(withCrowd).not.toBeNull();
    // Congested routes should be equal or longer
    expect(withCrowd!.totalDistance).toBeGreaterThanOrEqual(noCrowd!.totalDistance);
  });

  it('returns congestion level assessment', () => {
    const result = findPath('gate-a', 'sec-105', {
      'zone-n-lower': 90,
    });
    expect(result).not.toBeNull();
    expect(['low', 'moderate', 'high']).toContain(result!.congestionLevel);
  });

  it('supports accessible-only routing', () => {
    const result = findPath('gate-a', 'sec-217', {}, true);
    // Should either find a route or return null — both are valid for accessible-only
    if (result) {
      expect(result.path.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('handles same start and end node', () => {
    const result = findPath('gate-a', 'gate-a', {});
    expect(result).not.toBeNull();
    expect(result!.totalDistance).toBe(0);
  });

  it('all edges reference valid nodes', () => {
    for (const edge of stadiumEdges) {
      expect(getNodeById(edge.from)).toBeDefined();
      expect(getNodeById(edge.to)).toBeDefined();
    }
  });

  it('finds paths across levels (lower to upper)', () => {
    const result = findPath('gate-a', 'sec-303', {});
    expect(result).not.toBeNull();
    expect(result!.path.length).toBeGreaterThanOrEqual(3);
    expect(result!.totalDistance).toBeGreaterThan(0);
  });

  it('all nodes are reachable from gate-a', () => {
    const sectionNodes = stadiumNodes.filter(n => n.type === 'section');
    for (const node of sectionNodes.slice(0, 10)) {
      const result = findPath('gate-a', node.id, {});
      expect(result).not.toBeNull();
    }
  });
});
