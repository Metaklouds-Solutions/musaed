/**
 * Simulates call flow outcome from transcript and agent skills.
 */

export interface SimulatedOutcome {
  outcome: string;
  confidence: number;
  entities: { type: string; value: string }[];
  suggestedAction: string;
  skillMatch?: boolean;
}

export const SCENARIO_TRANSCRIPTS: Record<string, string> = {
  booking:
    'Patient: I need to book a follow-up. Agent: I can help with that. When works for you? Patient: Next Tuesday afternoon. Agent: We have 2pm and 4pm. Patient: 2pm please. Agent: Done, you\'re booked for Tuesday at 2pm.',
  billing:
    'Patient: I have a billing question. Agent: Sure, what\'s the issue? Patient: I was charged twice. Agent: I\'ll escalate to billing to fix that. Patient: Thanks.',
  general:
    'Patient: What are your hours? Agent: We\'re open Mon–Fri 9am–5pm. Patient: Do you take walk-ins? Agent: Yes, but appointments are recommended. Patient: Got it, thanks.',
  prescription:
    'Patient: I need a refill on my prescription. Agent: I can help with that. Which medication? Patient: Lisinopril. Agent: I\'ll send the request to your doctor. You\'ll get a call within 24 hours.',
};

const SCENARIO_SKILL_MAP: Record<string, string> = {
  booking: 'sk_001',
  billing: 'sk_002',
  prescription: 'sk_003',
  general: 'sk_004',
};

export function simulateCallFlow(
  transcript: string,
  _agentId: string,
  agentSkills: string[]
): SimulatedOutcome {
  const scenario =
    Object.entries(SCENARIO_TRANSCRIPTS).find(([, v]) => v === transcript)?.[0] ?? 'general';
  const requiredSkill = SCENARIO_SKILL_MAP[scenario];
  const hasSkill = !requiredSkill || agentSkills.includes(requiredSkill);

  if (!hasSkill) {
    return {
      outcome: 'Skill not enabled',
      confidence: 1,
      entities: [
        { type: 'intent', value: scenario },
        { type: 'agent_skill_gap', value: `Agent lacks skill for ${scenario}` },
      ],
      suggestedAction: 'Enable the required skill for this agent in Agent settings.',
      skillMatch: false,
    };
  }

  const lower = transcript.toLowerCase();
  if (lower.includes('book') || lower.includes('appointment') || lower.includes('2pm') || lower.includes('4pm')) {
    return {
      outcome: 'Booking created',
      confidence: 0.92,
      entities: [
        { type: 'intent', value: 'book_appointment' },
        { type: 'date', value: 'Next Tuesday' },
        { type: 'time', value: '2pm' },
        { type: 'customer_sentiment', value: 'positive' },
      ],
      suggestedAction: 'Confirm booking in system and send reminder.',
      skillMatch: true,
    };
  }
  if (lower.includes('billing') || lower.includes('charged') || lower.includes('escalat')) {
    return {
      outcome: 'Escalated to billing',
      confidence: 0.88,
      entities: [
        { type: 'intent', value: 'billing_inquiry' },
        { type: 'issue', value: 'duplicate charge' },
        { type: 'customer_sentiment', value: 'neutral' },
      ],
      suggestedAction: 'Create support ticket for billing team.',
      skillMatch: true,
    };
  }
  if (lower.includes('refill') || lower.includes('prescription') || lower.includes('medication')) {
    return {
      outcome: 'Refill request submitted',
      confidence: 0.9,
      entities: [
        { type: 'intent', value: 'prescription_refill' },
        { type: 'medication', value: 'Lisinopril' },
        { type: 'customer_sentiment', value: 'neutral' },
      ],
      suggestedAction: 'Forward to prescribing physician; notify patient within 24h.',
      skillMatch: true,
    };
  }
  return {
    outcome: 'General inquiry resolved',
    confidence: 0.85,
    entities: [
      { type: 'intent', value: 'general_inquiry' },
      { type: 'topic', value: 'hours and walk-ins' },
      { type: 'customer_sentiment', value: 'positive' },
    ],
    suggestedAction: 'No follow-up required.',
    skillMatch: true,
  };
}
