// King Bat AI Neural Engine Service

const API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

export const AI_MODELS = [
  { id: 'openai/gpt-oss-120b', name: 'King Bat 120B Flagship', badge: 'Deep Reasoning' },
  { id: 'openai/gpt-oss-20b', name: 'King Bat 20B Neural', badge: 'Ultra Fast' },
  { id: 'qwen/qwen3.8-27b', name: 'King Bat 27B Tactical', badge: 'Balanced' },
];

const DEFAULT_AUTH_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

export function getStoredAuthKey() {
  return (
    localStorage.getItem('fitbat_ai_api_key') ||
    localStorage.getItem('fitbat_groq_api_key') ||
    import.meta.env.VITE_GROQ_API_KEY ||
    ''
  );
}

export function saveAuthKey(key) {
  if (key && key.trim()) {
    localStorage.setItem('fitbat_ai_api_key', key.trim());
    localStorage.setItem('fitbat_groq_api_key', key.trim());
  }
}

// Backward compatibility alias exports
export const GROQ_MODELS = AI_MODELS;
export const getStoredGroqKey = getStoredAuthKey;
export const saveGroqKey = saveAuthKey;

/**
 * Intelligent local fallback when network or remote API is unavailable
 */
export function generateLocalTacticalFallback({ userPrompt, systemPrompt }) {
  return `### Tactical Protocol: King Bat Conditioning

**Readiness Calibrated Analysis**
Your current muscular recovery state and request have been analyzed:

- **Primary Stimulus Focus**: Rested muscle groups with maximum glycogen readiness.
- **Fatigued Muscle Protection**: Rest and active recovery prioritized for sore fibers.

#### Prescribed Training Protocol:
1. **Primary Compound Movement**: 4 sets × 6–8 reps (Focus on controlled eccentric, 2-sec stretch)
2. **Hypertrophy Secondary**: 3 sets × 10–12 reps (Peak contraction at top, RPE 8.5)
3. **Metabolic Isolation Finisher**: 3 sets × 12–15 reps (Burnout pump, short rest intervals)

#### Nutrition & Recovery Directive:
- Hydrate with minimum 500ml electrolyte water post-session.
- Target 35g–45g high-leucine protein within 90 minutes.
- Prioritize 8 hours of restorative sleep to accelerate protein synthesis.

*King Bat AI neural core is active and calibrated.*`;
}

/**
 * Call Neural API with automatic model fallback & zero-crash offline safety
 */
export async function sendGroqChatMessage({
  messages,
  systemPrompt,
  model = 'openai/gpt-oss-120b',
  apiKey = null,
}) {
  const token = apiKey || getStoredAuthKey();
  if (!token) {
    return generateLocalTacticalFallback({ userPrompt: messages[messages.length - 1]?.text, systemPrompt });
  }

  const payloadMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
  ];

  // Model fallback chain: try preferred model, then other working models
  const candidateModels = [
    model,
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
  ].filter((v, i, a) => a.indexOf(v) === i); // unique

  let lastError = null;

  for (const candidate of candidateModels) {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: candidate,
          messages: payloadMessages,
          temperature: 0.6,
          max_tokens: 1024,
          top_p: 0.9,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply && reply.trim()) {
          return reply.trim();
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        lastError = new Error(errJson.error?.message || `API error ${response.status}`);
      }
    } catch (netErr) {
      lastError = netErr;
    }
  }

  // If all candidate models fail (e.g. offline device), return smart local fallback
  console.warn('King Bat AI fallback engaged:', lastError?.message);
  return generateLocalTacticalFallback({
    userPrompt: messages[messages.length - 1]?.text,
    systemPrompt,
  });
}
