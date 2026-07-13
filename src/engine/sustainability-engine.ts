/**
 * Sustainability Engine — Carbon Footprint & Environmental Metrics
 *
 * Tracks energy, waste, water, and carbon metrics for stadium operations.
 * Provides AI-powered recommendations for reducing environmental impact.
 */

export interface SustainabilityMetrics {
  timestamp: number;
  carbon: {
    totalKgCO2: number;
    transitKgCO2: number;
    energyKgCO2: number;
    wasteKgCO2: number;
    offsetKgCO2: number;
    netKgCO2: number;
  };
  waste: {
    totalKg: number;
    recycledKg: number;
    compostedKg: number;
    landfillKg: number;
    diversionRate: number; // 0-100%
  };
  energy: {
    totalKWh: number;
    renewableKWh: number;
    renewablePercent: number;
    lightingKWh: number;
    hvacKWh: number;
    displaysKWh: number;
  };
  water: {
    totalLiters: number;
    recycledLiters: number;
    perCapitaLiters: number;
  };
  recommendations: string[];
  overallScore: number; // 0-100 sustainability score
}

// Simulated baseline values for MetLife Stadium match day
const BASELINE = {
  carbonPerFan: 2.8,        // kg CO2 per fan (transit-heavy)
  wastePerFan: 0.45,        // kg waste per fan
  recyclingRate: 0.42,      // 42% baseline diversion rate
  energyPerMatch: 45000,    // kWh total energy for a match
  renewableShare: 0.35,     // 35% renewable baseline
  waterPerFan: 3.2,         // liters per fan
};

let currentMetrics: SustainabilityMetrics | null = null;

export function calculateSustainability(
  attendance: number,
  matchMinute: number,
): SustainabilityMetrics {
  const progress = Math.min(matchMinute / 90, 1); // 0-1 match progress

  // Carbon calculation
  const transitCO2 = attendance * BASELINE.carbonPerFan * 0.65 * progress;
  const energyCO2 = (BASELINE.energyPerMatch * 0.42 * progress); // ~0.42 kg CO2 per kWh
  const wasteCO2 = attendance * BASELINE.wastePerFan * 0.1 * progress;
  const totalCO2 = transitCO2 + energyCO2 + wasteCO2;
  const offsetCO2 = totalCO2 * 0.25; // 25% offset via carbon credits
  const netCO2 = totalCO2 - offsetCO2;

  // Waste tracking
  const totalWaste = attendance * BASELINE.wastePerFan * progress;
  const diversionRate = BASELINE.recyclingRate + (Math.sin(matchMinute / 10) * 0.05);
  const recycledWaste = totalWaste * diversionRate * 0.6;
  const compostedWaste = totalWaste * diversionRate * 0.4;
  const landfillWaste = totalWaste * (1 - diversionRate);

  // Energy tracking
  const totalEnergy = BASELINE.energyPerMatch * progress;
  const renewableEnergy = totalEnergy * (BASELINE.renewableShare + Math.sin(matchMinute / 20) * 0.05);
  const lightingEnergy = totalEnergy * 0.35;
  const hvacEnergy = totalEnergy * 0.40;
  const displayEnergy = totalEnergy * 0.15;

  // Water tracking
  const totalWater = attendance * BASELINE.waterPerFan * progress;
  const recycledWater = totalWater * 0.30;

  // Generate recommendations
  const recommendations = generateSustainabilityRecommendations(
    diversionRate, BASELINE.renewableShare, netCO2, attendance
  );

  // Overall sustainability score (0-100, higher = better)
  const overallScore = Math.round(
    (diversionRate * 25) +                          // 25 pts for waste diversion
    (BASELINE.renewableShare * 25) +                // 25 pts for renewable energy
    (Math.max(0, 1 - netCO2 / (attendance * 3)) * 25) + // 25 pts for low carbon
    (recycledWater / totalWater * 25)               // 25 pts for water recycling
  );

  currentMetrics = {
    timestamp: Date.now(),
    carbon: {
      totalKgCO2: Math.round(totalCO2),
      transitKgCO2: Math.round(transitCO2),
      energyKgCO2: Math.round(energyCO2),
      wasteKgCO2: Math.round(wasteCO2),
      offsetKgCO2: Math.round(offsetCO2),
      netKgCO2: Math.round(netCO2),
    },
    waste: {
      totalKg: Math.round(totalWaste),
      recycledKg: Math.round(recycledWaste),
      compostedKg: Math.round(compostedWaste),
      landfillKg: Math.round(landfillWaste),
      diversionRate: Math.round(diversionRate * 100),
    },
    energy: {
      totalKWh: Math.round(totalEnergy),
      renewableKWh: Math.round(renewableEnergy),
      renewablePercent: Math.round((renewableEnergy / Math.max(totalEnergy, 1)) * 100),
      lightingKWh: Math.round(lightingEnergy),
      hvacKWh: Math.round(hvacEnergy),
      displaysKWh: Math.round(displayEnergy),
    },
    water: {
      totalLiters: Math.round(totalWater),
      recycledLiters: Math.round(recycledWater),
      perCapitaLiters: Math.round((totalWater / Math.max(attendance, 1)) * 10) / 10,
    },
    recommendations,
    overallScore: Math.min(100, Math.max(0, overallScore)),
  };

  return currentMetrics;
}

function generateSustainabilityRecommendations(
  diversionRate: number,
  renewableShare: number,
  netCO2: number,
  attendance: number,
): string[] {
  const recs: string[] = [];

  if (diversionRate < 0.5) {
    recs.push('Waste diversion below 50% — deploy additional recycling signage and volunteer sorters at concourse bins');
  }

  if (renewableShare < 0.4) {
    recs.push('Renewable energy below 40% — consider activating battery reserves from solar array');
  }

  const perCapitaCO2 = netCO2 / Math.max(attendance, 1);
  if (perCapitaCO2 > 2.0) {
    recs.push('Per-fan carbon footprint high — promote shuttle buses and NJ Transit over single-occupancy vehicles');
  }

  recs.push('Encourage fans to use refillable water bottles at hydration stations to reduce single-use plastic');

  if (diversionRate >= 0.5 && renewableShare >= 0.4) {
    recs.push('✅ Stadium meeting sustainability targets — maintain current operational protocols');
  }

  return recs;
}

export function getCurrentSustainability(): SustainabilityMetrics | null {
  return currentMetrics;
}
