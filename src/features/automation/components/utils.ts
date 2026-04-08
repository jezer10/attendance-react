import type { DayKey } from "./types";

export const isValidTime = (value: string) =>
  /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());

export const extractOffsetMinutes = (timezone?: string) => {
  if (!timezone) return 0;

  const match = timezone.match(/UTC([+-]\d{2}):(\d{2})/);
  if (!match) return 0;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const sign = match[1].startsWith("-") ? -1 : 1;

  return hours * 60 + sign * minutes;
};

export const toUtcTime = (time: string, offsetMinutes: number) => {
  if (!isValidTime(time)) return null;

  const [hour, minute] = time.split(":").map(Number);
  const localTotal = hour * 60 + minute;
  const utcTotal = localTotal - offsetMinutes;
  const normalized = ((utcTotal % 1440) + 1440) % 1440;
  const utcHour = Math.floor(normalized / 60);
  const utcMinute = normalized % 60;

  return `${utcHour.toString().padStart(2, "0")}:${utcMinute
    .toString()
    .padStart(2, "0")}`;
};

export const formatDays = (days: DayKey[]) => {
  if (!days.length) return "—";
  if (days.length === 7) return "Lun–Dom";

  const weekdays: DayKey[] = ["Lun", "Mar", "Mie", "Jue", "Vie"];
  const weekend: DayKey[] = ["Sab", "Dom"];

  if (days.length === 5 && weekdays.every((day) => days.includes(day))) {
    return "Lun–Vie";
  }

  if (
    days.length === 2 &&
    weekend.every((day) => days.includes(day)) &&
    days.every((day) => weekend.includes(day))
  ) {
    return "Fin de semana";
  }

  return days.join(", ");
};
