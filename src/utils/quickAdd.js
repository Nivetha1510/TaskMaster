// Turns a sentence like "Call client tomorrow 10 AM high" into task fields.
// Recognised (case-insensitive): priority, due date, due time, repeat and #category.

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const startOfDay = (date) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const pad = (number) => String(number).padStart(2, '0');

// Removes the first match of `regex` from `state.text` and returns that match.
function take(state, regex) {
  const match = state.text.match(regex);
  if (!match) return null;
  state.text = `${state.text.slice(0, match.index)} ${state.text.slice(match.index + match[0].length)}`;
  return match;
}

function parsePriority(state) {
  const match = take(state, /\b(high|urgent|important|medium|low)(?:\s+priority)?\b/i);
  if (!match) return null;
  const word = match[1].toLowerCase();
  if (word === 'urgent' || word === 'important') return 'high';
  return word;
}

// "30 min", "for 2 hours", "an hour", "half an hour" -> minutes, or null.
function parseDuration(state) {
  if (take(state, /\b(?:for\s+)?half an hour\b/i)) return 30;
  if (take(state, /\b(?:for\s+)?an hour\b/i)) return 60;
  const match = take(state, /\b(?:for\s+)?(\d{1,3}(?:\.\d)?)\s*(min|mins|minutes?|hr|hrs|hours?)\b/i);
  if (!match) return null;
  const amount = Number(match[1]);
  const minutes = /^h/i.test(match[2]) ? amount * 60 : amount;
  return minutes >= 1 && minutes <= 480 ? Math.round(minutes) : null;
}

function parseRepeat(state) {
  if (take(state, /\b(?:every\s*day|daily)\b/i)) return 'daily';
  if (take(state, /\b(?:every\s*week|weekly)\b/i)) return 'weekly';
  if (take(state, /\b(?:every\s*month|monthly)\b/i)) return 'monthly';
  return null;
}

// Returns 'HH:MM' (24-hour) or null.
function parseTime(state) {
  let match = take(state, /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (match) {
    let hours = Number(match[1]);
    const minutes = Number(match[2] ?? 0);
    if (hours < 1 || hours > 12 || minutes > 59) return null;
    const isPm = match[3].toLowerCase() === 'pm';
    if (hours === 12) hours = isPm ? 12 : 0;
    else if (isPm) hours += 12;
    return `${pad(hours)}:${pad(minutes)}`;
  }

  match = take(state, /\b(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (match) return `${pad(Number(match[1]))}:${match[2]}`;

  if (take(state, /\b(?:at\s+)?noon\b/i)) return '12:00';

  // "at 6" with no am/pm: 7-11 are mornings, 12 and 1-6 are afternoon.
  match = take(state, /\bat\s+(\d{1,2})\b/i);
  if (match) {
    const hours = Number(match[1]);
    if (hours < 1 || hours > 12) return null;
    const hour24 = hours >= 7 && hours <= 11 ? hours : (hours % 12) + 12;
    return `${pad(hour24)}:00`;
  }
  return null;
}

// Spoken phrasing: "this evening", "in the morning", "tonight". Returns { time, prefixed } or null.
const DAY_PARTS = { morning: '09:00', afternoon: '15:00', evening: '18:00', night: '20:00', tonight: '20:00' };
function parseDayPart(state) {
  const match = take(state, /\b(in the |this |at )?(morning|afternoon|evening|night|tonight)\b/i);
  if (!match) return null;
  const word = match[2].toLowerCase();
  return { time: DAY_PARTS[word], prefixed: Boolean(match[1]) || word === 'tonight', match, word };
}

// Returns a Date (local midnight) or null.
function parseDate(state, today) {
  if (take(state, /\bday after tomorrow\b/i)) return addDays(today, 2);
  if (take(state, /\b(?:tomorrow|tmrw|tmr)\b/i)) return addDays(today, 1);
  if (take(state, /\btoday\b/i)) return today;
  if (take(state, /\bnext week\b/i)) return addDays(today, 7);
  if (take(state, /\bnext month\b/i)) {
    return new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  }

  let match = take(state, /\bin\s+(\d{1,3})\s*(day|days|week|weeks)\b/i);
  if (match) {
    const amount = Number(match[1]) * (match[2].toLowerCase().startsWith('week') ? 7 : 1);
    return addDays(today, amount);
  }

  match = take(state, new RegExp(`\\b(?:on\\s+)?(?:next\\s+)?(${WEEKDAYS.join('|')})\\b`, 'i'));
  if (match) {
    const target = WEEKDAYS.indexOf(match[1].toLowerCase());
    const ahead = (target - today.getDay() + 7) % 7 || 7; // same weekday means next week
    return addDays(today, ahead);
  }

  // DD/MM or DD/MM/YYYY, matching the date format used elsewhere in the app.
  match = take(state, /\b(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?\b/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
      let year = match[3] ? Number(match[3]) : today.getFullYear();
      if (year < 100) year += 2000;
      let date = new Date(year, month, day);
      if (!match[3] && date < today) date = new Date(year + 1, month, day);
      return date;
    }
  }

  // "12 Oct", "Oct 12", "12th October"
  const monthPattern = MONTHS.map((name) => `${name}|${name.slice(0, 3)}`).join('|');
  const monthIndex = (word) => MONTHS.findIndex((name) => name.startsWith(word.slice(0, 3).toLowerCase()));
  match = take(state, new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthPattern})\\b`, 'i'));
  let day;
  let month;
  if (match) {
    day = Number(match[1]);
    month = monthIndex(match[2]);
  } else {
    match = take(state, new RegExp(`\\b(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i'));
    if (match) {
      day = Number(match[2]);
      month = monthIndex(match[1]);
    }
  }
  if (match && day >= 1 && day <= 31) {
    let date = new Date(today.getFullYear(), month, day);
    if (date < today) date = new Date(today.getFullYear() + 1, month, day);
    return date;
  }
  return null;
}

function parseCategory(state, categories) {
  const match = take(state, /#([\w-]+)/);
  if (!match) return null;
  const tag = match[1].toLowerCase();
  return categories.find((category) => category.name.toLowerCase().replace(/\s+/g, '-') === tag) ?? null;
}

// Words that suggest a category, keyed by the lowercase category name.
const CATEGORY_KEYWORDS = {
  work: ['meeting', 'client', 'report', 'email', 'project', 'deadline', 'office', 'presentation', 'invoice', 'boss', 'manager', 'proposal', 'standup', 'review'],
  personal: ['dentist', 'doctor', 'visit', 'appointment', 'birthday', 'family', 'mom', 'dad', 'friend', 'rent', 'bill', 'bills', 'haircut', 'anniversary', 'party', 'call'],
  study: ['study', 'exam', 'homework', 'assignment', 'class', 'lecture', 'course', 'revise', 'revision', 'quiz', 'thesis', 'read'],
  shopping: ['buy', 'shop', 'shopping', 'grocery', 'groceries', 'order', 'purchase', 'milk', 'mall'],
  health: ['gym', 'workout', 'yoga', 'medicine', 'pills', 'exercise', 'jog', 'run', 'walk', 'meditate', 'checkup'],
  errands: ['pickup', 'pick', 'post', 'bank', 'laundry', 'drop', 'courier', 'renew', 'parcel', 'fuel', 'petrol'],
};

// Picks the category whose keywords appear most in the text. With no clear match it
// falls back to "Personal" (when it exists) rather than whichever category is listed first.
function inferCategory(text, categories) {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  let best = null;
  let bestScore = 0;
  categories.forEach((category) => {
    const keywords = CATEGORY_KEYWORDS[category.name.trim().toLowerCase()];
    if (!keywords) return;
    const score = words.filter((word) => keywords.includes(word)).length;
    if (score > bestScore) {
      best = category;
      bestScore = score;
    }
  });
  if (best) return best;
  return (
    categories.find((category) => category.name.trim().toLowerCase() === 'personal') ??
    categories[0] ??
    null
  );
}

// Drops connector words left dangling once the date/time phrases are gone.
const tidyTitle = (text) =>
  text
    .replace(/\s+/g, ' ')
    .replace(/^(?:[\s,.;:-]|on|at|by|for|due)\b\s*/i, '')
    .replace(/\s*\b(?:on|at|by|for|due|in)\b[\s,.;:-]*$/i, '')
    .replace(/[\s,.;:-]+$/, '')
    .trim();

export function parseQuickAdd(input, categories = [], now = new Date()) {
  // Speech transcripts: "10 a.m." -> "10 am", and a leading "remind me to" is not part of the task.
  const original = input
    .trim()
    .replace(/\b([ap])\.m\.?/gi, '$1m')
    .replace(/^(?:please\s+)?(?:remind me(?:\s+to)?|add (?:a )?task(?: to)?|create (?:a )?task(?: to)?|i (?:need|have|want) to|don'?t forget to)\s+/i, '')
    .replace(/[.!?]+$/, '');
  const state = { text: original };
  const today = startOfDay(now);

  const taggedCategory = parseCategory(state, categories);
  const repeat = parseRepeat(state);
  const priority = parsePriority(state);
  const estimate = parseDuration(state);
  const parsedTime = parseTime(state);
  let dueDate = parseDate(state, today);
  // "evening" and friends only count next to a day, or when phrased like speech ("this evening").
  const dayPartText = state.text;
  const dayPart = parseDayPart(state);
  let time = parsedTime;
  if (dayPart && (dueDate || dayPart.prefixed || parsedTime)) {
    if (!time) time = dayPart.time;
  } else {
    state.text = dayPartText; // a bare "Morning walk" keeps its word
  }

  // A time with no day means the next time that clock reading happens.
  if (time && !dueDate) {
    const [hours, minutes] = time.split(':').map(Number);
    const passed = now.getHours() * 60 + now.getMinutes() >= hours * 60 + minutes;
    dueDate = passed ? addDays(today, 1) : today;
  }
  // A repeat with no day starts today.
  if (repeat && !dueDate) dueDate = today;

  const title = tidyTitle(state.text) || original;
  const category = taggedCategory ?? inferCategory(title, categories);
  return { title, dueDate, dueTime: time, priority, repeat, estimate, category };
}
