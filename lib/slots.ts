export function generateTimeSlots(): string[] {
  const slots: string[] = [];

  // Helper to format total minutes to 12-hour format string (e.g., "09:00 AM - 09:30 AM")
  const formatTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedH = displayHours < 10 ? `0${displayHours}` : `${displayHours}`;
    const formattedM = mins < 10 ? `0${mins}` : `${mins}`;
    return `${formattedH}:${formattedM} ${period}`;
  };

  const createSessionSlots = (startMins: number, endMins: number) => {
    let current = startMins;
    const slotDuration = 30; // 30 mins
    const gap = 2; // 2 mins gap

    while (current + slotDuration <= endMins) {
      const startStr = formatTime(current);
      const endStr = formatTime(current + slotDuration);
      slots.push(`${startStr} - ${endStr}`);
      current += slotDuration + gap;
    }
  };

  // Morning Session: 09:00 AM (540 mins) to 01:00 PM (780 mins)
  createSessionSlots(9 * 60, 13 * 60);

  // Lunch Break: 01:00 PM (13:00) to 02:00 PM (14:00) - EXCLUDED

  // Afternoon Session: 02:00 PM (840 mins) to 05:30 PM (1050 mins)
  createSessionSlots(14 * 60, 17.5 * 60);

  return slots;
}