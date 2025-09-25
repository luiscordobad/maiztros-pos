import { formatInTimeZone, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

export const MX_TIMEZONE = 'America/Mexico_City';

const ensureDate = (value: Date | string | number) => {
  if (value instanceof Date) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date value');
  }
  return date;
};

export const toMexicoCityTime = (value: Date | string | number) => {
  const date = ensureDate(value);
  return utcToZonedTime(date, MX_TIMEZONE);
};

export const fromMexicoCityTime = (value: Date | string | number) => {
  const date = ensureDate(value);
  return zonedTimeToUtc(date, MX_TIMEZONE);
};

export const formatMexicoCity = (value: Date | string | number, format: string) => {
  const date = ensureDate(value);
  return formatInTimeZone(date, MX_TIMEZONE, format);
};

export const nowInMexicoCity = () => toMexicoCityTime(new Date());
