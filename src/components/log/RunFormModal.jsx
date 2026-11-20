import { useState } from 'react';
import { X, Check, Gauge, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculatePace } from '@/lib/pace';
import { formatPace } from '@/lib/format';

export function RunFormModal({ isOpen, onClose, initialDurationSec = 0, onSave }) {
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [date, setDate] = useState(getTodayString());
  const [distanceKm, setDistanceKm] = useState('3.4'); // Default rute rumah di PRD
  const [durationMin, setDurationMin] = useState(() =>
    initialDurationSec ? Math.floor(initialDurationSec / 60) : ''
  );
  const [durationSec, setDurationSec] = useState(() =>
    initialDurationSec ? initialDurationSec % 60 : ''
  );
  const [effort, setEffort] = useState(6);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const totalSeconds = (parseInt(durationMin, 10) || 0) * 60 + (parseInt(durationSec, 10) || 0);
  const distNum = parseFloat(distanceKm) || 0;
  const currentPace = calculatePace(totalSeconds, distNum);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (distNum <= 0) {
      setError('Jarak harus lebih dari 0 km.');
      return;
    }
    if (totalSeconds <= 0) {
      setError('Durasi lari harus lebih dari 0 detik.');
      return;
    }

    const newRun = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      date,
      distanceKm: distNum,
      durationSec: totalSeconds,
      effort: Number(effort),
      note: note.trim(),
    };

    onSave(newRun);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <Card className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border-border bg-background shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
          <CardTitle className="text-base font-bold">Catat Sesi Lari</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 p-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive font-medium">
                {error}
              </div>
            )}

            {/* Tanggal */}
            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-xs">
                Tanggal Lari
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="h-10 text-sm"
              />
            </div>

            {/* Jarak */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="distance" className="text-xs">
                  Jarak (KM)
                </Label>
                <button
                  type="button"
                  onClick={() => setDistanceKm('3.4')}
                  className="text-[11px] text-primary font-medium hover:underline flex items-center gap-1"
                >
                  <MapPin className="h-3 w-3" />
                  Rute Rumah (3.4 km)
                </button>
              </div>
              <Input
                id="distance"
                type="number"
                step="0.01"
                min="0.1"
                placeholder="misal 3.4"
                value={distanceKm}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setDistanceKm(e.target.value)}
                required
                className="h-10 text-sm font-semibold"
              />
            </div>

            {/* Durasi (Menit & Detik) */}
            <div className="space-y-1.5">
              <Label className="text-xs">Durasi (Menit & Detik)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min="0"
                  placeholder="Menit"
                  value={durationMin}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setDurationMin(e.target.value)}
                  className="h-10 text-sm font-semibold"
                />
                <Input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="Detik"
                  value={durationSec}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setDurationSec(e.target.value)}
                  className="h-10 text-sm font-semibold"
                />
              </div>
            </div>

            {/* Hasil Perhitungan Pace Otomatis */}
            <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3 border border-border/60">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Pace Rata-rata</span>
              </div>
              <span className="font-mono text-sm font-bold text-foreground">
                {currentPace ? formatPace(currentPace) : '-'}
              </span>
            </div>

            {/* Skala Capek (1 - 10) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Tingkat Capek (1 - 10)</Label>
                <span className="text-xs font-bold text-primary">Skala {effort} / 10</span>
              </div>
              <div className="flex justify-between gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setEffort(num)}
                    className={`flex-1 h-9 rounded-md text-xs font-bold transition-all ${
                      effort === num
                        ? 'bg-primary text-primary-foreground shadow-xs scale-105'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                1: Sangat ringan, 5: Sedang/terengah, 10: Maksimal lelah.
              </p>
            </div>

            {/* Catatan Singkat */}
            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-xs">
                Catatan Singkat (Opsional)
              </Label>
              <Input
                id="note"
                placeholder="misal: Lutut agak pegal, nafas stabil..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            {/* Tombol Simpan */}
            <div className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-12 flex-1 text-sm font-medium"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="h-12 flex-1 text-sm font-semibold bg-primary text-primary-foreground"
              >
                <Check className="mr-2 h-4 w-4" />
                Simpan Log
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
