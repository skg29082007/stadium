import { describe, it, expect } from 'vitest';
import { stadiumNodes, stadiumEdges, getNodeById, getNodesByType, getNodesByZone, findNearestByType } from '../stadium-graph';

describe('stadium-graph — nodes', () => {
  it('has a substantial number of nodes', () => {
    expect(stadiumNodes.length).toBeGreaterThan(50);
  });

  it('includes all 4 gates', () => {
    const gates = getNodesByType('gate');
    expect(gates).toHaveLength(4);
    expect(gates.map(g => g.id).sort()).toEqual(['gate-a', 'gate-b', 'gate-c', 'gate-d']);
  });

  it('includes lower bowl sections 101-120', () => {
    for (let i = 101; i <= 120; i++) {
      expect(getNodeById(`sec-${i}`)).toBeDefined();
    }
  });

  it('includes mezzanine sections 201-216', () => {
    for (let i = 201; i <= 216; i++) {
      expect(getNodeById(`sec-${i}`)).toBeDefined();
    }
  });

  it('includes upper sections 301-316', () => {
    for (let i = 301; i <= 316; i++) {
      expect(getNodeById(`sec-${i}`)).toBeDefined();
    }
  });

  it('includes restrooms', () => {
    const restrooms = getNodesByType('restroom');
    expect(restrooms.length).toBeGreaterThanOrEqual(4);
  });

  it('includes food courts', () => {
    const food = getNodesByType('food');
    expect(food.length).toBeGreaterThanOrEqual(4);
  });

  it('includes medical stations', () => {
    const medical = getNodesByType('medical');
    expect(medical.length).toBeGreaterThanOrEqual(4);
  });

  it('includes elevators', () => {
    const elevators = getNodesByType('elevator');
    expect(elevators.length).toBeGreaterThanOrEqual(4);
  });

  it('every node has valid coordinates between 0 and 1', () => {
    for (const node of stadiumNodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(1);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(1);
    }
  });
});

describe('stadium-graph — edges', () => {
  it('has edges', () => {
    expect(stadiumEdges.length).toBeGreaterThan(100);
  });

  it('all edges reference valid nodes', () => {
    for (const edge of stadiumEdges) {
      expect(getNodeById(edge.from)).toBeDefined();
      expect(getNodeById(edge.to)).toBeDefined();
    }
  });

  it('all edges have positive distance', () => {
    for (const edge of stadiumEdges) {
      expect(edge.distance).toBeGreaterThan(0);
    }
  });

  it('bidirectional edges exist for gate-concourse connections', () => {
    const hasForward = stadiumEdges.some(e => e.from === 'gate-a' && e.to === 'conc-n');
    const hasReverse = stadiumEdges.some(e => e.from === 'conc-n' && e.to === 'gate-a');
    expect(hasForward).toBe(true);
    expect(hasReverse).toBe(true);
  });
});

describe('stadium-graph — getNodesByZone', () => {
  it('returns nodes for a valid zone', () => {
    const northNodes = getNodesByZone('north');
    expect(northNodes.length).toBeGreaterThan(0);
    northNodes.forEach(n => expect(n.zone).toBe('north'));
  });

  it('returns empty array for non-existent zone', () => {
    expect(getNodesByZone('nonexistent')).toHaveLength(0);
  });
});

describe('stadium-graph — findNearestByType', () => {
  it('finds nearest restroom from gate-a', () => {
    const nearest = findNearestByType('gate-a', 'restroom');
    expect(nearest).toBeDefined();
    expect(nearest!.type).toBe('restroom');
  });

  it('finds nearest food from gate-c', () => {
    const nearest = findNearestByType('gate-c', 'food');
    expect(nearest).toBeDefined();
    expect(nearest!.type).toBe('food');
  });

  it('returns undefined for non-existent start node', () => {
    const result = findNearestByType('invalid', 'restroom');
    expect(result).toBeUndefined();
  });
});
