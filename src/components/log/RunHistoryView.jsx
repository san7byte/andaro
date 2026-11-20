import { Plus, Download, Trash2, Calendar, Gauge, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDuration, formatPace } from '@/lib/format';
import { calculatePace } from '@/lib/pace';

export function RunHistoryView({ runs, onDeleteRun, onOpenAddModal, onExportJson }) {
  // Hitung ringkasan statistik
  const totalKm = runs.reduce((acc, curr) => acc + (curr.distanceKm || 0), 0);
  const totalDuration = runs.reduce((acc, curr) => acc + (curr.durationSec || 0), 0);
  const averagePace = totalKm > 0 ? totalDuration / totalKm : null;

  const getEffortBadgeVariant = (effort) => {
    if (effort <= 3) return 'success';
    if (effort <= 7) return 'warning';
    return 'destructive';
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Action Bar Atas */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Riwayat Lari</h2>
          <p className="text-xs text-muted-foreground">Catatan progres latihan Anda</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={onExportJson}
            title="Ekspor JSON"
            className="h-9 px-2.5 text-xs font-medium"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Backup
          </Button>
          <Button
            size="sm"
            onClick={onOpenAddModal}
            className="h-9 px-3 text-xs font-semibold bg-primary text-primary-foreground"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Catat
          </Button>
        </div>
      </div>

      {/* Ringkasan Statistik Card */}
      {runs.length > 0 && (
        <Card className="border-border/80 bg-muted/30">
          <CardContent className="grid grid-cols-3 divide-x divide-border/60 p-3 text-center">
            <div className="px-2">
              <span className="text-[11px] font-medium text-muted-foreground uppercase">Total Jarak</span>
              <p className="text-lg font-extrabold text-foreground mt-0.5">
                {totalKm.toFixed(1)} <span className="text-xs font-normal">km</span>
              </p>
            </div>
            <div className="px-2">
              <span className="text-[11px] font-medium text-muted-foreground uppercase">Sesi</span>
              <p className="text-lg font-extrabold text-foreground mt-0.5">
                {runs.length} <span className="text-xs font-normal">kali</span>
              </p>
            </div>
            <div className="px-2">
              <span className="text-[11px] font-medium text-muted-foreground uppercase">Avg Pace</span>
              <p className="text-lg font-extrabold text-foreground mt-0.5">
                {formatPace(averagePace).replace('/km', '')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daftar Sesi Lari */}
      {runs.length === 0 ? (
        <Card className="border-dashed border-2 border-border/80 p-8 text-center bg-card/40">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Belum ada riwayat lari</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1 mb-4">
            Gunakan timer di tab sebelah saat berlari, atau klik tombol di bawah untuk mencatat sesi lari secara manual.
          </p>
          <Button size="sm" onClick={onOpenAddModal} className="h-10 text-xs font-semibold">
            <Plus className="mr-1.5 h-4 w-4" />
            Catat Lari Pertama
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => {
            const pace = calculatePace(run.durationSec, run.distanceKm);

            return (
              <Card
                key={run.id}
                className="overflow-hidden border-border/80 transition-all hover:border-foreground/30 shadow-xs"
              >
                <CardContent className="p-4 space-y-3">
                  {/* Baris Atas: Tanggal & Badge Capek & Tombol Hapus */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDate(run.date)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getEffortBadgeVariant(run.effort)}>
                        Capek: {run.effort}/10
                      </Badge>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Hapus catatan sesi lari ini?')) {
                            onDeleteRun(run.id);
                          }
                        }}
                        className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                        title="Hapus sesi"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metrik Inti: Jarak, Durasi, Pace */}
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-2.5 text-center">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">Jarak</span>
                      <p className="text-base font-bold text-foreground mt-0.5">
                        {run.distanceKm} <span className="text-xs font-normal text-muted-foreground">km</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">Durasi</span>
                      <p className="text-base font-bold text-foreground mt-0.5 flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {formatDuration(run.durationSec)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">Pace</span>
                      <p className="text-base font-bold text-foreground mt-0.5 flex items-center justify-center gap-1 font-mono">
                        <Gauge className="h-3 w-3 text-muted-foreground" />
                        {formatPace(pace)}
                      </p>
                    </div>
                  </div>

                  {/* Catatan jika ada */}
                  {run.note && (
                    <p className="text-xs text-muted-foreground italic bg-muted/20 px-2.5 py-1.5 rounded-md border border-border/40">
                      "{run.note}"
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
