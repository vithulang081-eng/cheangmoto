/** Cambodian numbers: "+855 12 345 678" or "012-345-678" → "012345678". */
export function normalizePhone(input: string) {
  let digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+855')) digits = '0' + digits.slice(4);
  else if (digits.startsWith('855')) digits = '0' + digits.slice(3);
  return digits.replace(/\+/g, '');
}

export function isValidPhone(input: string) {
  return /^0\d{7,9}$/.test(normalizePhone(input));
}

/** "012345678" → "012 345 678", "0961234567" → "096 123 4567". */
export function formatPhone(input: string) {
  const d = normalizePhone(input);
  if (d.length === 9) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return d;
}

/** "012 345 678" → "+85512345678" (E.164, what SMS providers expect). */
export function toE164(input: string) {
  return `+855${normalizePhone(input).replace(/^0/, '')}`;
}
