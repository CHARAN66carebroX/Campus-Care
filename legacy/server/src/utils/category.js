/** Keyword-based category suggestion */
const CATEGORY_KEYWORDS = {
  Transport: ['bus', 'vehicle', 'shuttle', 'route', 'late', 'driver', 'ticket', 'traffic'],
  Hostel: ['hostel', 'room', 'dorm', 'mess', 'laundry', 'warden', 'accommodation'],
  IT: ['wifi', 'internet', 'lab', 'computer', 'printer', 'software', 'login', 'portal'],
  Faculty: ['professor', 'teacher', 'lecture', 'class', 'grade', 'marks', 'attendance', 'exam'],
  Fees: ['fee', 'payment', 'refund', 'scholarship', 'dues', 'invoice'],
  Facilities: ['cleaning', 'water', 'electricity', 'maintenance', 'lift', 'ac', 'fan', 'toilet'],
  Exams: ['exam', 'paper', 'schedule', 'hall ticket', 'result', 'revaluation'],
  Other: [],
};

export function detectCategory(text) {
  const lower = (text || '').toLowerCase();
  let best = 'Other';
  let bestScore = 0;
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (cat === 'Other') continue;
    const score = words.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  }
  return { category: best, confidence: bestScore };
}
