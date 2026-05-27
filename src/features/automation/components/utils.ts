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

