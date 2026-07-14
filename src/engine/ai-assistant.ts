/**
 * AI Assistant Engine — Rule-based GenAI Simulator
 * 
 * Handles natural language queries for navigation, amenities, 
 * match info, and safety. Supports multilingual responses.
 */

import { findPath } from './pathfinding';
import { getNodeById, findNearestByType, getNodesByType, type GraphNode } from '../data/stadium-graph';
import { getCurrentMatch, matchSchedule } from '../data/match-schedule';
import { getCurrentWeather } from '../data/weather-data';
import { formatDuration } from '../utils/formatters';
import { getTransitOptions, getParkingLots, getStaggeredDepartureSuggestion } from './transit-engine';
import { getCurrentSustainability } from './sustainability-engine';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  suggestions?: string[];
  routeData?: {
    from: string;
    to: string;
    distance: number;
    minutes: number;
    directions: { instruction: string; icon: string }[];
    pathNodes?: { id: string; label: string; x: number; y: number; type: string }[];
  };
  language?: string;
}

interface PatternHandler {
  patterns: RegExp[];
  handler: (match: RegExpMatchArray, context: AssistantContext) => ChatMessage;
}

export interface AssistantContext {
  currentZone: string; // e.g., 'gate-a' or 'sec-105'
  seatSection: number; // e.g., 217
  seatRow: number;
  seatNumber: number;
  language: string;
  crowdDensity: Record<string, number>;
}

function msg(content: string, suggestions?: string[], routeData?: ChatMessage['routeData']): ChatMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role: 'assistant',
    content,
    timestamp: Date.now(),
    suggestions,
    routeData,
  };
}

// Resolve section references like "Section 217", "sec 103", "my seat"
function resolveSection(text: string, ctx: AssistantContext): string | null {
  const sectionMatch = text.match(/(?:section|sec|sect)\s*(\d{3})/i);
  if (sectionMatch) return `sec-${sectionMatch[1]}`;
  
  if (text.match(/my seat|my section/i)) return `sec-${ctx.seatSection}`;
  
  const gateMatch = text.match(/gate\s*([a-d])/i);
  if (gateMatch) return `gate-${gateMatch[1].toLowerCase()}`;
  
  return null;
}

// Core pattern handlers
const handlers: PatternHandler[] = [
  // Navigation: "how do I get to Section 217"
  {
    patterns: [
      /(?:how|where|which way|directions?|navigate|route|path|go|get|find|walk)\s+(?:to|toward|towards|do i get to)?\s*(?:section|sec|sect)\s*(\d{3})/i,
      /(?:take me|guide me|lead me)\s+(?:to)?\s*(?:section|sec)\s*(\d{3})/i,
    ],
    handler: (match, ctx) => {
      const targetSection = `sec-${match[1]}`;
      const target = getNodeById(targetSection);
      if (!target) return msg(`I couldn't find Section ${match[1]}. Sections range from 101-120 (Lower), 201-216 (Mezzanine), and 301-316 (Upper).`);

      const result = findPath(ctx.currentZone, targetSection, ctx.crowdDensity);
      if (!result) return msg(`I'm sorry, I couldn't find a route to Section ${match[1]} from your current location. Please try from a different starting point.`);

      const content = `🗺️ **Route to Section ${match[1]}**\n\n` +
        `📏 Distance: ${result.totalDistance}m\n` +
        `⏱️ Estimated time: ${formatDuration(result.estimatedMinutes)}\n` +
        `🚦 Congestion: ${result.congestionLevel === 'low' ? '🟢 Low' : result.congestionLevel === 'moderate' ? '🟡 Moderate' : '🔴 High'}\n\n` +
        `**Turn-by-turn directions:**\n` +
        result.directions.map((d, i) => `${i + 1}. ${d.icon} ${d.instruction} (${d.distance}m)`).join('\n');

      return msg(content, ['Navigate me step by step', 'Find a less crowded route', 'Where is the nearest restroom?'], {
        from: ctx.currentZone,
        to: targetSection,
        distance: result.totalDistance,
        minutes: result.estimatedMinutes,
        directions: result.directions.map(d => ({ instruction: d.instruction, icon: d.icon })),
        pathNodes: result.path.map(n => ({ id: n.id, label: n.label, x: n.x, y: n.y, type: n.type })),
      });
    },
  },

  // Find my seat
  {
    patterns: [/(?:find|where|how|locate)\s+(?:is)?\s*my\s+seat/i, /(?:take me|go)\s+(?:to)?\s*my\s+seat/i],
    handler: (_match, ctx) => {
      const sectionId = `sec-${ctx.seatSection}`;
      const result = findPath(ctx.currentZone, sectionId, ctx.crowdDensity);
      
      if (!result) return msg(`Your seat is in Section ${ctx.seatSection}, Row ${ctx.seatRow}, Seat ${ctx.seatNumber}. I couldn't calculate a route from your current location.`);

      const content = `🎫 **Your Seat: Section ${ctx.seatSection}, Row ${ctx.seatRow}, Seat ${ctx.seatNumber}**\n\n` +
        `📏 Distance: ${result.totalDistance}m\n` +
        `⏱️ Walk time: ~${formatDuration(result.estimatedMinutes)}\n` +
        `🚦 Route congestion: ${result.congestionLevel === 'low' ? '🟢 Clear' : result.congestionLevel === 'moderate' ? '🟡 Moderate' : '🔴 Congested'}\n\n` +
        result.directions.map((d, i) => `${i + 1}. ${d.icon} ${d.instruction}`).join('\n');

      return msg(content, ['Show on map', 'Find nearest restroom first', 'Get food on the way'], {
        from: ctx.currentZone,
        to: sectionId,
        distance: result.totalDistance,
        minutes: result.estimatedMinutes,
        directions: result.directions.map(d => ({ instruction: d.instruction, icon: d.icon })),
        pathNodes: result.path.map(n => ({ id: n.id, label: n.label, x: n.x, y: n.y, type: n.type })),
      });
    },
  },

  // Nearest restroom
  {
    patterns: [/(?:nearest|closest|where|find)\s+(?:is\s+the\s+)?(?:restroom|bathroom|toilet|washroom|wc|lavatory)/i],
    handler: (_match, ctx) => {
      const nearest = findNearestByType(ctx.currentZone, 'restroom');
      if (!nearest) return msg('Restrooms are located at each concourse corner. Head to the nearest concourse.');

      const result = findPath(ctx.currentZone, nearest.id, ctx.crowdDensity);
      const time = result ? formatDuration(result.estimatedMinutes) : '2-3 min';

      return msg(
        `🚻 **Nearest Restroom**\n\nLocated near ${nearest.label}\n⏱️ ~${time} walk\n\n${result ? result.directions.map((d, i) => `${i + 1}. ${d.icon} ${d.instruction}`).join('\n') : 'Head to the nearest concourse.'}`,
        ['Find nearest food', 'Back to my seat', 'Accessible restroom?'],
        result ? {
          from: ctx.currentZone,
          to: nearest.id,
          distance: result.totalDistance,
          minutes: result.estimatedMinutes,
          directions: result.directions.map(d => ({ instruction: d.instruction, icon: d.icon })),
          pathNodes: result.path.map(n => ({ id: n.id, label: n.label, x: n.x, y: n.y, type: n.type })),
        } : undefined
      );
    },
  },

  // Nearest food
  {
    patterns: [/(?:nearest|closest|where|find)\s+(?:is\s+the\s+)?(?:food|eat|restaurant|concession|snack|drink|water|beer|pizza|hot ?dog|burger)/i, /(?:i'm|im|i am)\s+(?:hungry|thirsty)/i],
    handler: (_match, ctx) => {
      const nearest = findNearestByType(ctx.currentZone, 'food');
      if (!nearest) return msg('Food courts are located at each concourse. Head to the nearest concourse.');

      const result = findPath(ctx.currentZone, nearest.id, ctx.crowdDensity);
      const allFood = getNodesByType('food');

      return msg(
        `🍔 **Nearest Food: ${nearest.label}**\n\n⏱️ ~${result ? formatDuration(result.estimatedMinutes) : '3 min'} walk\n\n` +
        `**All Food Locations:**\n${allFood.map(f => `• ${f.label}`).join('\n')}\n\n` +
        `${result ? result.directions.map((d, i) => `${i + 1}. ${d.icon} ${d.instruction}`).join('\n') : ''}`,
        ['Find nearest restroom', 'What\'s on the menu?', 'Back to my seat'],
        result ? {
          from: ctx.currentZone,
          to: nearest.id,
          distance: result.totalDistance,
          minutes: result.estimatedMinutes,
          directions: result.directions.map(d => ({ instruction: d.instruction, icon: d.icon })),
          pathNodes: result.path.map(n => ({ id: n.id, label: n.label, x: n.x, y: n.y, type: n.type })),
        } : undefined
      );
    },
  },

  // Medical / Emergency
  {
    patterns: [/(?:medical|emergency|help|ambulance|first aid|hurt|injured|doctor|nurse|health)/i],
    handler: (_match, ctx) => {
      const nearest = findNearestByType(ctx.currentZone, 'medical');
      const result = nearest ? findPath(ctx.currentZone, nearest.id, ctx.crowdDensity) : null;

      return msg(
        `🏥 **Medical Assistance**\n\n` +
        `📞 **Emergency: Call stadium security immediately at gate intercom**\n\n` +
        `Nearest medical station: ${nearest?.label || 'Each concourse corner'}\n` +
        `⏱️ ~${result ? formatDuration(result.estimatedMinutes) : '2 min'} away\n\n` +
        `${result ? result.directions.map((d, i) => `${i + 1}. ${d.icon} ${d.instruction}`).join('\n') : ''}\n\n` +
        `💡 You can also flag any volunteer (yellow vest) for immediate assistance.`,
        ['Call for help', 'Find nearest exit', 'I need water'],
        nearest && result ? {
          from: ctx.currentZone,
          to: nearest.id,
          distance: result.totalDistance,
          minutes: result.estimatedMinutes,
          directions: result.directions.map(d => ({ instruction: d.instruction, icon: d.icon })),
          pathNodes: result.path.map(n => ({ id: n.id, label: n.label, x: n.x, y: n.y, type: n.type })),
        } : undefined
      );
    },
  },

  // Match info / Score
  {
    patterns: [/(?:score|match|game|result|who|playing|lineup|kick\s*off|what time)/i],
    handler: () => {
      const match = getCurrentMatch();
      const weather = getCurrentWeather();

      let content = `⚽ **Match Information**\n\n`;
      
      if (match.status === 'live' && match.score) {
        content += `🔴 **LIVE** — ${match.stage}\n\n`;
        content += `${match.flagA} ${match.teamA} **${match.score.a}** - **${match.score.b}** ${match.teamB} ${match.flagB}\n\n`;
      } else if (match.status === 'finished' && match.score) {
        content += `✅ **Full Time** — ${match.stage}\n\n`;
        content += `${match.flagA} ${match.teamA} **${match.score.a}** - **${match.score.b}** ${match.teamB} ${match.flagB}\n\n`;
      } else {
        content += `📅 **${match.stage}** — ${match.date} at ${match.kickoff}\n\n`;
        content += `${match.flagA} ${match.teamA} vs ${match.teamB} ${match.flagB}\n\n`;
      }

      content += `${weather.icon} Weather: ${weather.description} (${weather.temperature}°C)\n`;
      content += `🏟️ Venue: New York New Jersey Stadium`;

      return msg(content, ['Show full schedule', 'How do I get to my seat?', 'Find nearest screen']);
    },
  },

  // Schedule
  {
    patterns: [/(?:full\s+)?schedule|upcoming|next\s+match|all\s+matches/i],
    handler: () => {
      let content = `📅 **MetLife Stadium — FIFA World Cup 2026 Schedule**\n\n`;
      matchSchedule.forEach(m => {
        const statusIcon = m.status === 'live' ? '🔴' : m.status === 'finished' ? '✅' : '📅';
        const scoreText = m.score ? `${m.score.a} - ${m.score.b}` : 'vs';
        content += `${statusIcon} ${m.date} ${m.kickoff} — ${m.flagA} ${m.teamA} ${scoreText} ${m.teamB} ${m.flagB} (${m.stage})\n`;
      });
      return msg(content, ['Current match details', 'Find my seat']);
    },
  },

  // Exit
  {
    patterns: [/(?:exit|leave|gate|way out|how do i leave)/i],
    handler: (_match, ctx) => {
      const gates: GraphNode[] = getNodesByType('gate');
      const nearest = findNearestByType(ctx.currentZone, 'gate');
      
      let content = `🚪 **Stadium Exits**\n\n`;
      content += `Nearest exit: **${nearest?.label || 'Gate A'}**\n\n`;
      content += `All gates:\n`;
      gates.forEach(g => {
        const result = findPath(ctx.currentZone, g.id, ctx.crowdDensity);
        content += `• ${g.label} — ~${result ? formatDuration(result.estimatedMinutes) : '?'}\n`;
      });
      content += `\n💡 Follow green EXIT signs for fastest route.`;

      return msg(content, ['Navigate to nearest exit', 'Transit options', 'Where did I park?']);
    },
  },

  // WiFi / Info
  {
    patterns: [/(?:wifi|wi-fi|internet|connect|password)/i],
    handler: () => {
      return msg(
        `📶 **Stadium WiFi**\n\n` +
        `Network: **FIFA_WC2026_Guest**\n` +
        `Password: No password required (open network)\n\n` +
        `💡 Connect automatically through the FIFA World Cup 2026 app for best experience.`,
        ['Find my seat', 'What\'s the score?', 'Find nearest restroom'],
      );
    },
  },

  // Accessibility
  {
    patterns: [/(?:accessible|wheelchair|disability|disabled|mobility|blind|vision|hearing|ada)/i],
    handler: (_match, ctx) => {
      const elevator = findNearestByType(ctx.currentZone, 'elevator');
      return msg(
        `♿ **Accessibility Services**\n\n` +
        `• **Wheelchair routes**: Available — all concourses are wheelchair accessible\n` +
        `• **Nearest elevator**: ${elevator?.label || 'Available at each corner'}\n` +
        `• **Accessible restrooms**: Located near each elevator\n` +
        `• **Assistive listening**: Available at Info Desks\n` +
        `• **Sign language**: Interpreters available at Gates A & C\n\n` +
        `Need wheelchair-accessible navigation? I can route you via ramps and elevators only.\n\n` +
        `📞 Accessibility hotline: Available at any Info Desk`,
        ['Navigate with wheelchair route', 'Find nearest elevator', 'Where is the info desk?'],
      );
    },
  },

  // Transit / Transportation
  {
    patterns: [/(?:transit|transport|bus|train|shuttle|parking|uber|lyft|ride|how do i get home|how to leave|departure|car|NJ\s*transit|path)/i],
    handler: (_match, _ctx) => {
      const options = getTransitOptions();
      const lots = getParkingLots();
      const suggestion = getStaggeredDepartureSuggestion(45);

      let content = `🚆 **Transit & Transportation**\n\n`;
      content += `**Public Transit:**\n`;
      options.filter(o => o.type !== 'rideshare').forEach(o => {
        content += `${o.icon} **${o.name}**\n`;
        content += `   Status: ${o.status === 'on-time' ? '🟢' : '🟡'} ${o.status} · Next: ${o.nextDeparture} · ${o.estimatedMinutes}min to ${o.destination}\n\n`;
      });

      content += `**Parking:**\n`;
      lots.forEach(l => {
        content += `🅿️ ${l.name}: ${l.occupancy}% full · Exit time: ~${l.estimatedExitMinutes}min · EV chargers: ${l.evChargersAvailable}/${l.evChargers}\n`;
      });

      content += `\n💡 ${suggestion}`;

      return msg(content, ['Best way to Times Square?', 'When should I leave?', 'Find my car']);
    },
  },

  // Sustainability / Recycling / Water
  {
    patterns: [/(?:recycle|recycling|compost|trash|bin|waste|water fountain|refill|sustainability|green|eco|carbon|environment)/i],
    handler: (_match, _ctx) => {
      const sus = getCurrentSustainability();

      let content = `♻️ **Sustainability at MetLife Stadium**\n\n`;

      if (sus) {
        content += `🌍 Sustainability Score: **${sus.overallScore}/100**\n`;
        content += `♻️ Waste Diversion Rate: **${sus.waste.diversionRate}%**\n`;
        content += `⚡ Renewable Energy: **${sus.energy.renewablePercent}%**\n\n`;
      }

      content += `**Recycling Stations** are located at every concourse corner — look for the green bins.\n\n`;
      content += `**Water Refill Stations** are next to every restroom area.\n\n`;
      content += `💧 Bring a reusable bottle! Single-use plastic reduction is a key FIFA 2026 initiative.\n\n`;
      content += `🌱 MetLife Stadium uses 35% renewable energy, recycles rainwater, and offsets 25% of match-day carbon emissions.`;

      return msg(content, ['Find nearest water fountain', 'Where can I recycle?', 'Back to my seat']);
    },
  },
];

// Default fallback
function defaultResponse(): ChatMessage {
  return msg(
    `I'm your FIFA World Cup 2026 Stadium Assistant! 🏟️\n\nI can help you with:\n\n` +
    `🗺️ **Navigation** — "How do I get to Section 217?"\n` +
    `🎫 **Find my seat** — "Take me to my seat"\n` +
    `🚻 **Amenities** — "Nearest restroom" or "Where's food?"\n` +
    `⚽ **Match info** — "What's the score?"\n` +
    `🏥 **Emergency** — "I need medical help"\n` +
    `♿ **Accessibility** — "Wheelchair route"\n` +
    `🚪 **Exits** — "How do I leave?"\n\n` +
    `Just type your question in any language!`,
    ['Find my seat', 'Nearest restroom', 'What\'s the score?', 'Find food'],
  );
}

export function processMessage(userMessage: string, context: AssistantContext): ChatMessage {
  const text = userMessage.trim().slice(0, 1000); // Limit input length
  if (!text) return defaultResponse();

  for (const handler of handlers) {
    for (const pattern of handler.patterns) {
      const match = text.match(pattern);
      if (match) {
        return handler.handler(match, context);
      }
    }
  }

  // Check for section navigation without explicit "how to get" prefix
  const sectionRef = resolveSection(text, context);
  if (sectionRef) {
    const result = findPath(context.currentZone, sectionRef, context.crowdDensity);
    if (result) {
      const target = getNodeById(sectionRef);
      return msg(
        `🗺️ **Route to ${target?.label || sectionRef}**\n\n` +
        `📏 ${result.totalDistance}m · ⏱️ ${formatDuration(result.estimatedMinutes)}\n\n` +
        result.directions.map((d, i) => `${i + 1}. ${d.icon} ${d.instruction}`).join('\n'),
        ['Show on map', 'Less crowded route?', 'Find my seat'],
        {
          from: context.currentZone,
          to: sectionRef,
          distance: result.totalDistance,
          minutes: result.estimatedMinutes,
          directions: result.directions.map(d => ({ instruction: d.instruction, icon: d.icon })),
        },
      );
    }
  }

  // Greeting
  if (text.match(/^(?:hi|hello|hey|hola|bonjour|oi|salut|merhaba)/i)) {
    const match = getCurrentMatch();
    return msg(
      `👋 Welcome to the FIFA World Cup 2026! 🏆\n\n` +
      `Today's match: ${match.flagA} ${match.teamA} vs ${match.teamB} ${match.flagB}\n` +
      `Venue: New York New Jersey Stadium\n\n` +
      `How can I help you today?`,
      ['Find my seat', 'What\'s the score?', 'Nearest food', 'Stadium map'],
    );
  }

  // Thank you
  if (text.match(/(?:thank|thanks|gracias|merci|obrigado)/i)) {
    return msg(
      `You're welcome! 😊 Enjoy the match! ⚽🏆\n\nAnything else I can help with?`,
      ['Find my seat', 'Nearest restroom', 'Match schedule'],
    );
  }

  return defaultResponse();
}

export function getWelcomeMessage(): ChatMessage {
  const match = getCurrentMatch();
  return msg(
    `🏟️ **Welcome to the FIFA World Cup 2026!** 🏆\n\n` +
    `I'm your AI Stadium Assistant for **New York New Jersey Stadium**.\n\n` +
    `Today: ${match.flagA} **${match.teamA}** vs **${match.teamB}** ${match.flagB}\n` +
    `${match.stage} · Capacity: 80,663\n\n` +
    `How can I help you today?`,
    ['Find my seat', 'Nearest restroom', 'What\'s the score?', 'Find food & drinks'],
  );
}
