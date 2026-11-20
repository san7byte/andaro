/**
 * Menghitung pace dalam detik per kilometer
 * @param {number} durationSec - Durasi dalam detik
 * @param {number} distanceKm - Jarak dalam kilometer
 * @returns {number|null} Pace dalam detik per km, atau null jika input tidak valid
 */
export function calculatePace(durationSec, distanceKm) {
  if (!durationSec || !distanceKm || distanceKm <= 0 || durationSec <= 0) {
    return null;
  }
  return durationSec / distanceKm;
}
