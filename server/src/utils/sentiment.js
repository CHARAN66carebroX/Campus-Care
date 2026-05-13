/** Lightweight rule-based sentiment tagging */
const FRUSTRATED = ['frustrated', 'angry', 'ridiculous', 'unacceptable', 'disgusted', 'worst', 'pathetic', 'sue'];
const URGENT = ['urgent', 'immediately', 'asap', 'emergency', 'danger', 'unsafe', 'harassment', 'threat'];
const CONCERNED = ['concern', 'worried', 'disappointed', 'confused', 'issue', 'problem', 'delay'];

export function analyzeSentiment(text) {
  const lower = (text || '').toLowerCase();
  if (FRUSTRATED.some((w) => lower.includes(w))) return 'frustrated';
  if (URGENT.some((w) => lower.includes(w))) return 'urgent';
  if (CONCERNED.some((w) => lower.includes(w))) return 'concerned';
  return 'calm';
}

export function sentimentToPriority(sentiment) {
  if (sentiment === 'frustrated' || sentiment === 'urgent') return 'high';
  if (sentiment === 'concerned') return 'medium';
  return 'low';
}
