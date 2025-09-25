const MEXICO_CITY_TIME_ZONE = 'America/Mexico_City';

function getDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: MEXICO_CITY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  return {
    year: parts.year ?? '0000',
    month: parts.month ?? '01',
    day: parts.day ?? '01',
    hour: parts.hour ?? '00',
    minute: parts.minute ?? '00',
    second: parts.second ?? '00',
  };
}

function normalizeOffset(label: string | undefined): string {
  if (!label) {
    return 'Z';
  }

  const match = label.match(/GMT([+-]\d{1,2})(?::?(\d{2}))?/i);
  if (!match) {
    return 'Z';
  }

  const rawHours = match[1];
  const rawMinutes = match[2] ?? '00';
  const sign = rawHours.startsWith('-') ? '-' : '+';
  const hoursValue = rawHours.replace(/^[+-]/, '');
  const paddedHours = hoursValue.padStart(2, '0');

  return `${sign}${paddedHours}:${rawMinutes}`;
}

export function mexicoCityNowISO(date: Date = new Date()): string {
  const { year, month, day, hour, minute, second } = getDateParts(date);
  const offsetFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: MEXICO_CITY_TIME_ZONE,
    timeZoneName: 'shortOffset',
  });
  const offsetLabel = offsetFormatter
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value;

  const offset = normalizeOffset(offsetLabel);

  return `${year}-${month}-${day}T${hour}:${minute}:${second}${offset}`;
}

export function mexicoCityNow(date: Date = new Date()): Date {
  return new Date(mexicoCityNowISO(date));
}

export { MEXICO_CITY_TIME_ZONE };
