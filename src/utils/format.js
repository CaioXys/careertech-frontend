/** Formatação de datas, durações e números usada nas telas do professor. */

const dateFormatter = new Intl.DateTimeFormat('pt-BR');
const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const timeFormatter = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });

function parse(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  const date = parse(value);
  return date ? dateFormatter.format(date) : '—';
}

export function formatDateTime(value) {
  const date = parse(value);
  return date ? dateTimeFormatter.format(date) : '—';
}

export function formatTime(value) {
  const date = parse(value);
  return date ? timeFormatter.format(date) : '—';
}

export function formatDay(value) {
  const date = parse(value);
  return date ? String(date.getDate()).padStart(2, '0') : '—';
}

export function formatMonth(value) {
  const date = parse(value);
  return date ? monthFormatter.format(date).replace('.', '').toLocaleUpperCase('pt-BR') : '—';
}

export function formatRelative(value) {
  const date = parse(value);
  if (!date) return '—';
  const diffMinutes = Math.round((date.getTime() - Date.now()) / 60000);
  const relative = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
  if (Math.abs(diffMinutes) < 60) return relative.format(diffMinutes, 'minute');
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return relative.format(diffHours, 'hour');
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) return relative.format(diffDays, 'day');
  return formatDate(date);
}

export function formatMinutes(value) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes <= 0) return '—';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}min` : `${hours}h`;
}

export function formatNumber(value, digits = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return number.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return `${Math.round(number)}%`;
}
