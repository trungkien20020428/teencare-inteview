/**
 * Parse a time slot string "HH:MM-HH:MM" into start/end minutes from midnight.
 */
export function parseTimeSlot(timeSlot: string): { start: number; end: number } {
  const [startStr, endStr] = timeSlot.split('-');
  const [startH, startM] = startStr.trim().split(':').map(Number);
  const [endH, endM] = endStr.trim().split(':').map(Number);
  return {
    start: startH * 60 + startM,
    end: endH * 60 + endM,
  };
}

/**
 * Returns true if two time slot strings overlap.
 */
export function timeSlotsOverlap(slot1: string, slot2: string): boolean {
  const t1 = parseTimeSlot(slot1);
  const t2 = parseTimeSlot(slot2);
  // Two intervals overlap if one starts before the other ends
  return t1.start < t2.end && t2.start < t1.end;
}

const DAY_ORDER: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

/**
 * Get the next Date/Time when a class (defined by dayOfWeek + timeSlot) will occur.
 */
export function getNextClassDate(dayOfWeek: string, timeSlot: string): Date {
  const [startStr] = timeSlot.split('-');
  const [hours, minutes] = startStr.trim().split(':').map(Number);

  const now = new Date();
  const targetDay = DAY_ORDER[dayOfWeek] ?? 0;
  const currentDay = now.getDay();

  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) daysUntil += 7;

  // If today is the target day, check if the class time has already passed
  if (daysUntil === 0) {
    const classToday = new Date(now);
    classToday.setHours(hours, minutes, 0, 0);
    if (classToday <= now) {
      daysUntil = 7; // Next week
    }
  }

  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysUntil);
  nextDate.setHours(hours, minutes, 0, 0);
  nextDate.setMilliseconds(0);

  return nextDate;
}

/**
 * Returns true if the cancellation is more than 24 hours before the next class.
 */
export function isEligibleForRefund(dayOfWeek: string, timeSlot: string): boolean {
  const nextClass = getNextClassDate(dayOfWeek, timeSlot);
  const now = new Date();
  const hoursUntilClass = (nextClass.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilClass > 24;
}
