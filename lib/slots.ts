export type SlotOptions = {
  slotDuration?: number; // minutes
  gap?: number; // minutes
  morningStart?: number; // minutes from midnight
  morningEnd?: number;
  lunchStart?: number;
  lunchEnd?: number;
  afternoonStart?: number;
  afternoonEnd?: number;
};

export function generateTimeSlots(opts?: SlotOptions): string[] {
  const slots: string[] = [];

  const {
    slotDuration = 30,
    gap = 2,
    morningStart = 9 * 60,
    morningEnd = 13 * 60,
    lunchStart = 13 * 60,
    lunchEnd = 14 * 60,
    afternoonStart = 14 * 60,
    afternoonEnd = 17.5 * 60,
  } = opts || {};

  // Helper to format total minutes to 12-hour format string (e.g., "09:00 AM")
  const formatTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.round(totalMinutes % 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedH = displayHours < 10 ? `0${displayHours}` : `${displayHours}`;
    const formattedM = mins < 10 ? `0${mins}` : `${mins}`;
    return `${formattedH}:${formattedM} ${period}`;
  };

  const createSessionSlots = (startMins: number, endMins: number) => {
    let current = startMins;

    while (current + slotDuration <= endMins) {
      const startStr = formatTime(current);
      const endStr = formatTime(current + slotDuration);
      slots.push(`${startStr} - ${endStr}`);
      current += slotDuration + gap;
    }
  };

  // Morning Session
  createSessionSlots(morningStart, morningEnd);

  // Lunch break is intentionally skipped (between lunchStart and lunchEnd)

  // Afternoon Session
  createSessionSlots(afternoonStart, afternoonEnd);

  return slots;
}