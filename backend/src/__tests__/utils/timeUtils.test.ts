import { parseTimeSlot, timeSlotsOverlap, isEligibleForRefund, getNextClassDate } from '../../utils/timeUtils';

describe('parseTimeSlot', () => {
  it('parses a valid time slot string', () => {
    expect(parseTimeSlot('08:00-09:30')).toEqual({ start: 480, end: 570 });
  });

  it('parses slots starting at midnight', () => {
    expect(parseTimeSlot('00:00-01:00')).toEqual({ start: 0, end: 60 });
  });

  it('parses late-night slots', () => {
    expect(parseTimeSlot('22:30-23:59')).toEqual({ start: 1350, end: 1439 });
  });
});

describe('timeSlotsOverlap', () => {
  it('returns true for fully overlapping slots', () => {
    expect(timeSlotsOverlap('08:00-10:00', '08:00-10:00')).toBe(true);
  });

  it('returns true for partially overlapping slots', () => {
    expect(timeSlotsOverlap('08:00-10:00', '09:00-11:00')).toBe(true);
  });

  it('returns true when one slot is contained within another', () => {
    expect(timeSlotsOverlap('08:00-12:00', '09:00-10:00')).toBe(true);
  });

  it('returns false for non-overlapping slots', () => {
    expect(timeSlotsOverlap('08:00-10:00', '10:30-12:00')).toBe(false);
  });

  it('returns false for adjacent (touching) slots', () => {
    // 08:00-10:00 and 10:00-12:00: t1.start(480) < t2.end(720) && t2.start(600) < t1.end(600) => false
    expect(timeSlotsOverlap('08:00-10:00', '10:00-12:00')).toBe(false);
  });

  it('returns false when second slot is entirely before first', () => {
    expect(timeSlotsOverlap('14:00-16:00', '08:00-10:00')).toBe(false);
  });
});

describe('getNextClassDate', () => {
  beforeEach(() => {
    // Fix current time: Wednesday 2026-04-01 10:00:00 UTC
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-01T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns upcoming date when class is later today', () => {
    // Local day depends on timezone; use a far-future time to avoid edge cases
    const result = getNextClassDate('Wednesday', '15:00-16:00');
    expect(result).toBeInstanceOf(Date);
    // The class time (15:00) is after 10:00 UTC for most timezones
    expect(result.getTime()).toBeGreaterThan(Date.now());
  });

  it('returns a date object', () => {
    const result = getNextClassDate('Friday', '09:00-10:00');
    expect(result).toBeInstanceOf(Date);
  });
});

describe('isEligibleForRefund', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns true when class is more than 24 hours away (early in the week)', () => {
    // Now: Monday 2026-03-30 08:00 UTC; class on Wednesday 14:00 => ~54 hours away
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-30T08:00:00.000Z'));
    expect(isEligibleForRefund('Wednesday', '14:00-15:00')).toBe(true);
  });

  it('returns false when class is less than 24 hours away', () => {
    // Now: Monday 2026-03-30 20:00 UTC; class on Tuesday 14:00 => ~18 hours away
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-30T20:00:00.000Z'));
    expect(isEligibleForRefund('Tuesday', '14:00-15:00')).toBe(false);
  });

  it('returns true when class is exactly next week (7 days away)', () => {
    // Now: Monday 2026-03-30 15:30 UTC; class on Monday 14:00 => already passed today => next Monday (~6.9 days)
    // Actually 6.9 days > 24h => true
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-30T15:30:00.000Z'));
    expect(isEligibleForRefund('Monday', '14:00-15:00')).toBe(true);
  });
});
