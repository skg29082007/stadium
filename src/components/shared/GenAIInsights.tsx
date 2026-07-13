import { Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props {
  context: string;
  metrics: Record<string, string | number>;
}

/**
 * GenAI Insights Panel
 * Simulates a Generative AI agent providing real-time operational intelligence
 * based on current dashboard context and metrics.
 */
export default function GenAIInsights({ context, metrics }: Props) {
  const [insight, setInsight] = useState('Analyzing real-time operational data...');
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    setIsGenerating(true);
    setInsight('Analyzing real-time operational data...');
    
    // Simulate GenAI processing delay
    const timer = setTimeout(() => {
      // Very basic simulated generation based on context
      const timestamp = new Date().toLocaleTimeString();
      let generatedInsight = '';

      if (context === 'crowd') {
        const avg = metrics.avgDensity as number;
        if (avg > 70) {
          generatedInsight = `GenAI Analysis (${timestamp}): High density detected across ${metrics.activeZones} active zones. Recommend opening overflow gates at North Entrance and deploying 3 additional staff members to Sector C to alleviate bottlenecks. Predicted stabilization in 14 minutes.`;
        } else {
          generatedInsight = `GenAI Analysis (${timestamp}): Crowd flow is optimal. Current average density (${avg}%) is well within safe thresholds. Predictive models indicate smooth egress post-match if current transit schedules hold.`;
        }
      } else if (context === 'risk') {
        const incidents = metrics.activeIncidents as number;
        if (incidents > 3) {
          generatedInsight = `GenAI Analysis (${timestamp}): Elevated risk profile. ${incidents} concurrent incidents require immediate triage. AI suggests prioritizing MEDICAL response at Gate B. Automated alerts have been pre-drafted for field teams.`;
        } else {
          generatedInsight = `GenAI Analysis (${timestamp}): Risk levels nominal. AI monitoring 42 camera feeds and social sentiment. No immediate threats detected. Maintenance teams can proceed with scheduled halftime checks.`;
        }
      } else if (context === 'command') {
        generatedInsight = `GenAI Analysis (${timestamp}): Stadium operations running at 94% efficiency. Automated systems have optimized HVAC cooling based on a ${metrics.temperature} attendance heat-map. Transit delays cleared.`;
      } else {
        generatedInsight = `GenAI Analysis (${timestamp}): All systems optimal. AI continuously monitoring for anomalies.`;
      }

      setInsight(generatedInsight);
      setIsGenerating(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [context, metrics]);

  return (
    <div className="card" style={{ padding: 20, border: '1px solid var(--primary-color)', background: 'rgba(108, 92, 231, 0.05)' }}>
      <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary-color)' }}>
        <Sparkles size={16} className={isGenerating ? 'spin' : ''} aria-hidden="true" /> 
        Generative AI Insights
      </h3>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5, minHeight: 42 }}>
        {insight}
      </p>
    </div>
  );
}
