import { describe, it, expect } from 'vitest';
import { classifyIncident, createIncident, generateRandomIncident } from '../incident-triage';

describe('incident-triage — classifyIncident', () => {
  it('classifies medical keywords as MEDICAL', () => {
    const { category } = classifyIncident('Fan collapsed near restroom, appears unconscious');
    expect(category).toBe('MEDICAL');
  });

  it('classifies security keywords as SECURITY', () => {
    const { category } = classifyIncident('Fight between two fans in upper deck');
    expect(category).toBe('SECURITY');
  });

  it('classifies crowd keywords as CROWD', () => {
    const { category } = classifyIncident('Overcrowded bottleneck at Gate B');
    expect(category).toBe('CROWD');
  });

  it('classifies weather keywords as WEATHER', () => {
    const { category } = classifyIncident('Lightning spotted near the stadium');
    expect(category).toBe('WEATHER');
  });

  it('classifies transit keywords as TRANSIT', () => {
    const { category } = classifyIncident('Bus delay at parking lot entrance');
    expect(category).toBe('TRANSIT');
  });

  it('classifies maintenance keywords as MAINTENANCE', () => {
    const { category } = classifyIncident('Broken seat in section 207');
    expect(category).toBe('MAINTENANCE');
  });

  it('assigns CRITICAL priority for life-threatening keywords', () => {
    const { priority } = classifyIncident('Fan unconscious and not breathing');
    expect(priority).toBe('CRITICAL');
  });

  it('assigns HIGH priority for urgent keywords', () => {
    const { priority } = classifyIncident('Fan bleeding from head injury');
    expect(priority).toBe('HIGH');
  });

  it('assigns MEDIUM priority by default for moderate keywords', () => {
    const { priority } = classifyIncident('Spill on concourse floor');
    expect(priority).toBe('MEDIUM');
  });

  it('defaults to MAINTENANCE for unrecognised descriptions', () => {
    const { category } = classifyIncident('Something happened');
    expect(category).toBe('MAINTENANCE');
  });
});

describe('incident-triage — createIncident', () => {
  it('creates a valid incident with all required fields', () => {
    const incident = createIncident('Spill on floor', 'zone-n-lower', 'Staff Wilson');
    expect(incident.id).toBeTruthy();
    expect(incident.category).toBeTruthy();
    expect(incident.priority).toBeTruthy();
    expect(incident.status).toBe('NEW');
    expect(incident.title).toBeTruthy();
    expect(incident.description).toBe('Spill on floor');
    expect(incident.zone).toBe('zone-n-lower');
    expect(incident.reportedBy).toBe('Staff Wilson');
    expect(incident.reportedAt).toBeGreaterThan(0);
    expect(incident.aiSummary).toBeTruthy();
    expect(incident.suggestedAction).toBeTruthy();
    expect(incident.estimatedResponseMinutes).toBeGreaterThan(0);
  });

  it('allows category override', () => {
    const incident = createIncident('Something', 'zone-n-lower', 'Staff', undefined, 'SECURITY');
    expect(incident.category).toBe('SECURITY');
  });

  it('allows priority override', () => {
    const incident = createIncident('Minor spill', 'zone-n-lower', 'Staff', undefined, undefined, 'CRITICAL');
    expect(incident.priority).toBe('CRITICAL');
    expect(incident.estimatedResponseMinutes).toBe(2);
  });

  it('includes section when provided', () => {
    const incident = createIncident('Issue', 'zone-n-lower', 'Staff', 'sec-103');
    expect(incident.section).toBe('sec-103');
  });

  it('sets correct response times per priority', () => {
    const critical = createIncident('Unconscious fan', 'zone-n-lower', 'Staff');
    expect(critical.estimatedResponseMinutes).toBeLessThanOrEqual(5);
  });
});

describe('incident-triage — generateRandomIncident', () => {
  it('generates a valid random incident', () => {
    const incident = generateRandomIncident();
    expect(incident.id).toBeTruthy();
    expect(incident.category).toBeTruthy();
    expect(incident.priority).toBeTruthy();
    expect(incident.status).toBe('NEW');
    expect(incident.zone).toBeTruthy();
    expect(incident.reportedBy).toBeTruthy();
    expect(incident.description).toBeTruthy();
  });

  it('generates unique IDs across multiple calls', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateRandomIncident().id));
    expect(ids.size).toBe(20);
  });
});
