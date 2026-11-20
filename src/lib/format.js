/**
 * Format total detik menjadi format string MM:SS atau HH:MM:SS
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatDuration(totalSeconds) {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds < 0) {
    return '00:00';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (n) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Format tanggal YYYY-MM-DD ke format lokal yang mudah dibaca
 * @param {string} dateString
 * @returns {string}
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format pace (detik per km) menjadi format M'SS"/km
 * @param {number} paceSecondsPerKm
 * @returns {string}
 */
export function formatPace(paceSecondsPerKm) {
  if (!paceSecondsPerKm || !isFinite(paceSecondsPerKm) || paceSecondsPerKm <= 0) {
    return '-';
  }

  const minutes = Math.floor(paceSecondsPerKm / 60);
  const seconds = Math.round(paceSecondsPerKm % 60);

  const pad = (n) => String(n).padStart(2, '0');
  return `${minutes}'${pad(seconds)}"/km`;
}
