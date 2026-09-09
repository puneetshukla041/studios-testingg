export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  let currentMinutes = 9 * 60; // 09:00 AM
  const endMinutes = 17 * 60;   // 05:00 PM
  const duration = 5;
  const gap = 2;

  while (currentMinutes + duration <= endMinutes) {
    const startStr = formatMinutesToTime(currentMinutes);
    const endStr = formatMinutesToTime(currentMinutes + duration);
    slots.push(`${startStr} - ${endStr}`);
    currentMinutes += duration + gap;
  }

  return slots;
}

function formatMinutesToTime(totalMinutes: number): string {
  let hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const period = hours >= 12 ? 'pm' : 'am';

  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;

  const paddedHours = hours < 10 ? `0${hours}` : `${hours}`;
  const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;

  return `${paddedHours}:${paddedMins} ${period}`;
}