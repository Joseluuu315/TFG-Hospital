import type { User } from '@/lib/api';

type DateInput = string | number | Date | null | undefined;

const LOCALE = 'es-ES';

const dateFormatter = new Intl.DateTimeFormat(LOCALE);
const monthYearFormatter = new Intl.DateTimeFormat(LOCALE, {
  month: 'long',
  year: 'numeric',
});
const weekdayFormatter = new Intl.DateTimeFormat(LOCALE, { weekday: 'short' });
const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'EUR',
});

const toDate = (value: DateInput): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatWith = (
  formatter: Intl.DateTimeFormat,
  value: DateInput,
  fallback = '-',
) => {
  const date = toDate(value);
  return date ? formatter.format(date) : fallback;
};

export const formatDate = (value: DateInput, fallback = '-') =>
  formatWith(dateFormatter, value, fallback);

export const formatMonthYear = (value: DateInput, fallback = '-') =>
  formatWith(monthYearFormatter, value, fallback);

export const formatWeekday = (value: DateInput, fallback = '-') =>
  formatWith(weekdayFormatter, value, fallback);

export const formatCurrency = (value?: number | null, fallback = '-') =>
  typeof value === 'number' ? currencyFormatter.format(value) : fallback;

export const getDisplayName = (user?: Partial<User> | null) => {
  if (!user) return '';
  const first = (user.firstName ?? user.nombre ?? '').trim();
  const last = (user.lastName ?? user.apellidos ?? '').trim();
  return [first, last].filter(Boolean).join(' ').trim();
};

export const getInitials = (user?: Partial<User> | null) => {
  const first = (user?.firstName ?? user?.nombre ?? '').trim();
  const last = (user?.lastName ?? user?.apellidos ?? '').trim();
  const initials = `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
  return initials || '?';
};
