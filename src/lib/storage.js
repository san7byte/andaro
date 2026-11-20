const STORAGE_KEY = 'andaro_runs_v1';

/**
 * Mengambil daftar sesi lari dari localStorage
 * @returns {Array}
 */
export function loadRunsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Data awalan demo jika belum ada data agar user langsung melihat preview UI
      return [
        {
          id: 'demo-1',
          date: '2026-11-18',
          distanceKm: 3.4,
          durationSec: 1320, // 22:00
          effort: 6,
          note: 'Rute rumah pertama kali, nafas terkontrol dengan run-walk',
        },
      ];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Gagal membaca data runs dari localStorage:', err);
    return [];
  }
}

/**
 * Menyimpan daftar sesi lari ke localStorage
 * @param {Array} runs
 */
export function saveRunsToStorage(runs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
  } catch (err) {
    console.error('Gagal menyimpan runs ke localStorage:', err);
  }
}

/**
 * Ekspor data riwayat lari ke file JSON
 * @param {Array} runs
 */
export function exportRunsToJsonFile(runs) {
  try {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(runs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `andaro-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    console.error('Gagal mengekspor data JSON:', err);
    alert('Gagal mengekspor data JSON.');
  }
}
