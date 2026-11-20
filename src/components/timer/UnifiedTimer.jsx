import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  CheckCircle2,
  Flame,
  Footprints,
  Clock,
  Target,
  Repeat,
  Check,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatDuration } from '@/lib/format';

export function UnifiedTimer({ onFinish, onStatusChange }) {
  // --- 1. PENGATURAN SESI (Konfigurasi sebelum lari) ---
  const [targetType, setTargetType] = useState('none'); // 'none' | '20' | '30' | 'custom'
  const [customTargetMin, setCustomTargetMin] = useState(25);

  const [useInterval, setUseInterval] = useState(true);
  const [runMinutes, setRunMinutes] = useState(1);
  const [walkMinutes, setWalkMinutes] = useState(2);

  // Putaran: Auto vs Kustom (Poin 2)
  const [isAutoRounds, setIsAutoRounds] = useState(true);
  const [customRounds, setCustomRounds] = useState(8);

  // Perhitungan target durasi dalam detik (jika ada)
  const targetTotalSec =
    targetType === '20'
      ? 20 * 60
      : targetType === '30'
        ? 30 * 60
        : targetType === 'custom'
          ? Math.max(1, customTargetMin) * 60
          : null;

  // Perhitungan putaran otomatis (Poin 2)
  const roundCycleSec = (runMinutes + walkMinutes) * 60;
  const effectiveRounds = isAutoRounds
    ? targetTotalSec
      ? Math.max(1, Math.ceil(targetTotalSec / roundCycleSec))
      : 8 // default 8 putaran jika sesi bebas
    : Math.max(1, customRounds);

  // --- 2. RUNTIME STATE (Saat lari berjalan) ---
  const [status, setStatus] = useState('idle'); // 'idle' | 'running' | 'paused' | 'finished'
  const [totalElapsedSec, setTotalElapsedSec] = useState(0);

  // State interval
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPhase, setCurrentPhase] = useState('run'); // 'run' | 'walk'
  const [phaseRemainingSec, setPhaseRemainingSec] = useState(60);

  // Notifikasi status (Poin 3 & 4: Tetap jalan, hanya beri tahu saat tercapai)
  const [targetReached, setTargetReached] = useState(false);
  const [roundsCompleted, setRoundsCompleted] = useState(false);

  // --- REFS UNTUK PREVENT RESET & TIMER PRESISI (Poin 1) ---
  const startTimeRef = useRef(0);
  const totalElapsedSecRef = useRef(0);
  const pausedElapsedSecRef = useRef(0);

  const phaseStartTimeRef = useRef(0);
  const phaseDurationSecRef = useRef(60);
  const pausedPhaseElapsedSecRef = useRef(0);

  const currentPhaseRef = useRef('run');
  const currentRoundRef = useRef(1);

  const targetReachedRef = useRef(false);
  const roundsCompletedRef = useRef(false);

  const timerLoopRef = useRef(null);
  const wakeLockRef = useRef(null);

  // Web Audio API Synthesizer
  const playCue = (type) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'run') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'walk') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'targetReached' || type === 'roundsDone') {
        // Melodi perayaan: do-mi-sol
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
        osc.start();
        osc.stop(ctx.currentTime + 0.7);
      }
    } catch {
      // Audio fallback
    }

    if ('vibrate' in navigator) {
      try {
        if (type === 'run') navigator.vibrate([200, 100, 200]);
        else if (type === 'walk') navigator.vibrate([350]);
        else if (type === 'targetReached' || type === 'roundsDone') {
          navigator.vibrate([300, 150, 300, 150, 600]);
        }
      } catch {
        // ignore
      }
    }
  };

  // Screen Wake Lock API
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch {
        // ignore
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
      } catch {
        // ignore
      }
      wakeLockRef.current = null;
    }
  };

  // --- 3. MAIN TIMER ENGINE (Hanya re-run saat status berubah) ---
  useEffect(() => {
    if (status === 'running') {
      requestWakeLock();

      timerLoopRef.current = setInterval(() => {
        const now = Date.now();

        // 1. Total Elapsed Time (Dihitung dari startTimeRef murni, TIDAK PERNAH KE-RESET saat fase ganti)
        const elapsed = Math.floor((now - startTimeRef.current) / 1000);
        totalElapsedSecRef.current = elapsed;
        setTotalElapsedSec(elapsed);

        // 2. Cek Notifikasi Target Waktu (Poin 3: Beri tahu tapi JANGAN STOP!)
        if (targetTotalSec && elapsed >= targetTotalSec && !targetReachedRef.current) {
          targetReachedRef.current = true;
          setTargetReached(true);
          playCue('targetReached');
          onStatusChange?.({
            status: 'running',
            label: 'Target Tercapai! 🎯',
            phase: currentPhaseRef.current,
          });
        }

        // 3. Interval Run-Walk Engine
        if (useInterval) {
          const phaseElapsed = Math.floor((now - phaseStartTimeRef.current) / 1000);
          const remaining = Math.max(0, phaseDurationSecRef.current - phaseElapsed);
          setPhaseRemainingSec(remaining);

          // Transisi fase saat remaining mencapai 0
          if (remaining <= 0) {
            if (currentPhaseRef.current === 'run') {
              // Ganti dari Lari ke Jalan
              currentPhaseRef.current = 'walk';
              setCurrentPhase('walk');
              playCue('walk');

              const walkSec = Math.round(walkMinutes * 60);
              phaseStartTimeRef.current = now;
              phaseDurationSecRef.current = walkSec;
              setPhaseRemainingSec(walkSec);

              onStatusChange?.({
                status: 'running',
                label: 'Jalan Santai',
                phase: 'walk',
              });
            } else {
              // Ganti dari Jalan ke Lari (Masuk putaran baru)
              const nextRound = currentRoundRef.current + 1;
              currentRoundRef.current = nextRound;
              setCurrentRound(nextRound);

              // Cek Notifikasi Putaran Selesai (Poin 4: Beri tahu tapi JANGAN STOP!)
              if (nextRound > effectiveRounds && !roundsCompletedRef.current) {
                roundsCompletedRef.current = true;
                setRoundsCompleted(true);
                playCue('roundsDone');
              }

              currentPhaseRef.current = 'run';
              setCurrentPhase('run');
              playCue('run');

              const runSec = Math.round(runMinutes * 60);
              phaseStartTimeRef.current = now;
              phaseDurationSecRef.current = runSec;
              setPhaseRemainingSec(runSec);

              onStatusChange?.({
                status: 'running',
                label: `Lari (P${nextRound})`,
                phase: 'run',
              });
            }
          }
        }
      }, 250);

      return () => {
        clearInterval(timerLoopRef.current);
        releaseWakeLock();
      };
    }
  }, [
    status,
    useInterval,
    runMinutes,
    walkMinutes,
    targetTotalSec,
    effectiveRounds,
    onStatusChange,
  ]);

  // --- 4. ACTION HANDLERS ---
  const handleStart = () => {
    const now = Date.now();
    const runSec = Math.round(runMinutes * 60);

    // Inisialisasi waktu mulai sesi
    startTimeRef.current = now - totalElapsedSecRef.current * 1000;
    phaseStartTimeRef.current = now;
    phaseDurationSecRef.current = runSec;
    currentPhaseRef.current = 'run';
    currentRoundRef.current = 1;

    targetReachedRef.current = false;
    roundsCompletedRef.current = false;
    setTargetReached(false);
    setRoundsCompleted(false);

    setCurrentPhase('run');
    setCurrentRound(1);
    setPhaseRemainingSec(runSec);

    setStatus('running');
    playCue('run');
    onStatusChange?.({
      status: 'running',
      label: useInterval ? 'Lari (P1)' : 'Berlari',
      phase: 'run',
    });
  };

  const handlePause = () => {
    clearInterval(timerLoopRef.current);
    releaseWakeLock();

    const now = Date.now();
    pausedElapsedSecRef.current = totalElapsedSecRef.current;
    pausedPhaseElapsedSecRef.current = Math.floor((now - phaseStartTimeRef.current) / 1000);

    setStatus('paused');
    onStatusChange?.({ status: 'paused', label: 'Dijeda' });
  };

  const handleResume = () => {
    const now = Date.now();

    // Pulihkan waktu mulai dari akumulasi jeda
    startTimeRef.current = now - pausedElapsedSecRef.current * 1000;
    phaseStartTimeRef.current = now - pausedPhaseElapsedSecRef.current * 1000;

    setStatus('running');
    onStatusChange?.({
      status: 'running',
      label: useInterval
        ? currentPhaseRef.current === 'walk'
          ? 'Jalan Santai'
          : `Lari (P${currentRoundRef.current})`
        : 'Berlari',
      phase: currentPhaseRef.current,
    });
  };

  const handleStop = () => {
    clearInterval(timerLoopRef.current);
    releaseWakeLock();
    setStatus('finished');
    onStatusChange?.({ status: 'finished', label: 'Selesai' });
  };

  const handleReset = () => {
    clearInterval(timerLoopRef.current);
    releaseWakeLock();

    totalElapsedSecRef.current = 0;
    pausedElapsedSecRef.current = 0;
    pausedPhaseElapsedSecRef.current = 0;
    currentRoundRef.current = 1;
    currentPhaseRef.current = 'run';
    targetReachedRef.current = false;
    roundsCompletedRef.current = false;

    setTotalElapsedSec(0);
    setCurrentRound(1);
    setCurrentPhase('run');
    setTargetReached(false);
    setRoundsCompleted(false);
    setStatus('idle');

    onStatusChange?.({ status: 'idle', label: 'Siap Lari', phase: '' });
  };

  const handleSaveToLog = () => {
    onFinish?.(totalElapsedSec);
  };

  const isRunningPhase = currentPhase === 'run';
  const progressPercent = targetTotalSec
    ? Math.min(100, Math.round((totalElapsedSec / targetTotalSec) * 100))
    : 0;

  return (
    <div className="space-y-5">
      {/* ============================================================== */}
      {/* 1. STATE IDLE: FORM PENGATURAN SEBELUM START                   */}
      {/* ============================================================== */}
      {status === 'idle' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Card Target Waktu */}
          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>Target Waktu Sesi</span>
                </div>
                {targetTotalSec && (
                  <Badge variant="outline" className="text-[11px] font-mono">
                    Target: {formatDuration(targetTotalSec)}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                <Button
                  type="button"
                  variant={targetType === 'none' ? 'default' : 'outline'}
                  onClick={() => setTargetType('none')}
                  className="h-10 text-xs font-semibold px-2"
                >
                  Bebas
                </Button>
                <Button
                  type="button"
                  variant={targetType === '20' ? 'default' : 'outline'}
                  onClick={() => setTargetType('20')}
                  className="h-10 text-xs font-semibold px-2"
                >
                  20 Min
                </Button>
                <Button
                  type="button"
                  variant={targetType === '30' ? 'default' : 'outline'}
                  onClick={() => setTargetType('30')}
                  className="h-10 text-xs font-semibold px-2"
                >
                  30 Min
                </Button>
                <Button
                  type="button"
                  variant={targetType === 'custom' ? 'default' : 'outline'}
                  onClick={() => setTargetType('custom')}
                  className="h-10 text-xs font-semibold px-2"
                >
                  Kustom
                </Button>
              </div>

              {targetType === 'custom' && (
                <div className="pt-1 flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="180"
                    placeholder="Menit target..."
                    value={customTargetMin}
                    onChange={(e) =>
                      setCustomTargetMin(Math.max(1, parseInt(e.target.value, 10) || 1))
                    }
                    className="h-9 text-sm font-semibold"
                  />
                  <span className="text-xs text-muted-foreground shrink-0">menit target</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card Panduan Run-Walk (Interval) */}
          <Card className="border-border/80 shadow-xs">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Repeat className="h-4 w-4" />
                  <span>Panduan Run-Walk</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUseInterval(!useInterval)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    useInterval ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                      useInterval ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {useInterval ? (
                <div className="space-y-3 pt-1">
                  {/* Durasi Lari & Jalan */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Lari (Menit)</Label>
                      <Input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={runMinutes}
                        onChange={(e) =>
                          setRunMinutes(Math.max(0.5, parseFloat(e.target.value) || 1))
                        }
                        className="mt-1 h-9 text-center font-bold text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Jalan (Menit)</Label>
                      <Input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={walkMinutes}
                        onChange={(e) =>
                          setWalkMinutes(Math.max(0.5, parseFloat(e.target.value) || 1))
                        }
                        className="mt-1 h-9 text-center font-bold text-sm"
                      />
                    </div>
                  </div>

                  {/* Pengaturan Putaran: Auto vs Kustom (Poin 2) */}
                  <div className="rounded-lg bg-muted/40 p-2.5 border border-border/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-semibold text-foreground">
                        Jumlah Putaran
                      </Label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setIsAutoRounds(true)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                            isAutoRounds
                              ? 'bg-primary text-primary-foreground shadow-2xs'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Auto ({effectiveRounds})
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAutoRounds(false)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                            !isAutoRounds
                              ? 'bg-primary text-primary-foreground shadow-2xs'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Kustom
                        </button>
                      </div>
                    </div>

                    {isAutoRounds ? (
                      <p className="text-[11px] text-muted-foreground">
                        {targetTotalSec
                          ? `Dihitung otomatis: ${effectiveRounds} putaran untuk memenuhi target ${formatDuration(targetTotalSec)}.`
                          : `Sesi bebas default ${effectiveRounds} putaran (timer tetap berlanjut jika selesai).`}
                      </p>
                    ) : (
                      <div className="flex items-center gap-2 pt-0.5">
                        <Input
                          type="number"
                          min="1"
                          max="50"
                          value={customRounds}
                          onChange={(e) =>
                            setCustomRounds(Math.max(1, parseInt(e.target.value, 10) || 1))
                          }
                          className="h-8 text-center font-bold text-xs"
                        />
                        <span className="text-xs text-muted-foreground shrink-0">
                          putaran target
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    💡 Nada bip & getar otomatis berbunyi setiap kali berganti antara Lari dan
                    Jalan.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic py-1">
                  Interval nonaktif. Timer akan berjalan murni sebagai stopwatch.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tombol Utama Mulai Lari */}
          <Button
            size="lg"
            onClick={handleStart}
            className="h-16 w-full text-lg font-bold shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl active:scale-[0.98] transition-all"
          >
            <Play className="mr-2.5 h-6 w-6 fill-current" />
            MULAI LARI SEKARANG
          </Button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. STATE RUNNING / PAUSED: TAMPILAN SAAT SEDANG BERLARI        */}
      {/* ============================================================== */}
      {(status === 'running' || status === 'paused') && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Banner Notifikasi Target Waktu Tercapai (Poin 3: Timer TETAP JALAN) */}
          {targetReached && (
            <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 p-3 text-center text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2 shadow-xs animate-in zoom-in-95">
              <Check className="h-4 w-4 shrink-0 text-emerald-500 stroke-[3]" />
              <span>Target waktu tercapai! Timer tetap berjalan sampai Anda stop.</span>
            </div>
          )}

          {/* Banner Notifikasi Target Putaran Tercapai (Poin 4: Timer TETAP JALAN) */}
          {roundsCompleted && (
            <div className="rounded-xl bg-amber-500/15 border border-amber-500/40 p-3 text-center text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-center gap-2 shadow-xs animate-in zoom-in-95">
              <Award className="h-4 w-4 shrink-0 text-amber-500" />
              <span>Target {effectiveRounds} putaran selesai! Melanjutkan putaran ekstra.</span>
            </div>
          )}

          {/* Card Utama: Fase Interval (Jika Aktif) */}
          {useInterval && (
            <Card
              className={`border-2 transition-all duration-300 shadow-md ${
                isRunningPhase
                  ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-950/20'
                  : 'border-sky-500 bg-sky-500/10 dark:bg-sky-950/20'
              }`}
            >
              <CardContent className="p-6 text-center flex flex-col items-center">
                <div className="flex items-center justify-between w-full mb-1">
                  <Badge variant="outline" className="text-xs font-semibold bg-background/80">
                    Putaran {currentRound}{' '}
                    {currentRound > effectiveRounds ? '(Ekstra)' : `dari ${effectiveRounds}`}
                  </Badge>
                  <span className="text-xs font-medium text-muted-foreground">
                    {isRunningPhase ? 'Fase Lari' : 'Fase Jalan'}
                  </span>
                </div>

                <div className="my-2 flex items-center justify-center gap-2.5">
                  {isRunningPhase ? (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <Flame className="h-8 w-8 animate-bounce" />
                      <span className="text-3xl font-black tracking-wider uppercase">LARI</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                      <Footprints className="h-8 w-8" />
                      <span className="text-3xl font-black tracking-wider uppercase">JALAN</span>
                    </div>
                  )}
                </div>

                {/* Sisa waktu fase saat ini */}
                <div className="font-mono text-6xl font-black tracking-tight tabular-nums text-foreground select-none my-1">
                  {formatDuration(phaseRemainingSec)}
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  {status === 'paused'
                    ? 'Sesi dijeda'
                    : isRunningPhase
                      ? 'Pertahankan langkah santai & stabil'
                      : 'Atur nafas dan turunkan detak jantung'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Card Total Durasi & Target (Stopwatch murni yang TIDAK PERNAH KE-RESET saat fase ganti) */}
          <Card className="border-border/80 shadow-xs bg-card">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Clock className="h-4 w-4" />
                  <span>Total Durasi Lari</span>
                </div>
                <span className="font-mono text-2xl font-black text-foreground tabular-nums">
                  {formatDuration(totalElapsedSec)}
                </span>
              </div>

              {targetTotalSec && (
                <div className="space-y-1.5 pt-1 border-t border-border/60">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {totalElapsedSec >= targetTotalSec ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Target {formatDuration(targetTotalSec)} tercapai! (+
                          {formatDuration(totalElapsedSec - targetTotalSec)})
                        </span>
                      ) : (
                        <span>
                          Target: {formatDuration(targetTotalSec)} (Sisa{' '}
                          {formatDuration(targetTotalSec - totalElapsedSec)})
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-foreground">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        totalElapsedSec >= targetTotalSec ? 'bg-emerald-500' : 'bg-primary'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tombol Kontrol */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {status === 'running' ? (
              <Button
                size="lg"
                variant="outline"
                onClick={handlePause}
                className="h-14 text-base font-semibold border-border hover:bg-muted active:scale-95 transition-all"
              >
                <Pause className="mr-2 h-5 w-5 fill-current" />
                Jeda
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleResume}
                className="h-14 text-base font-semibold bg-primary text-primary-foreground active:scale-95 transition-all"
              >
                <Play className="mr-2 h-5 w-5 fill-current" />
                Lanjut
              </Button>
            )}

            <Button
              size="lg"
              variant="destructive"
              onClick={handleStop}
              className="h-14 text-base font-semibold active:scale-95 transition-all"
            >
              <Square className="mr-2 h-5 w-5 fill-current" />
              Selesai & Stop
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. STATE FINISHED: RINGKASAN SETELAH SELESAI LARI              */}
      {/* ============================================================== */}
      {status === 'finished' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <Card className="border-emerald-500/40 bg-emerald-500/10 p-6 text-center">
            <p className="text-emerald-700 dark:text-emerald-400 font-bold text-lg">
              🎉 Sesi Lari Selesai!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Hebat! Anda telah menyelesaikan sesi lari dengan total durasi:
            </p>
            <div className="font-mono text-5xl font-black text-foreground my-3">
              {formatDuration(totalElapsedSec)}
            </div>
            {targetTotalSec && totalElapsedSec >= targetTotalSec && (
              <Badge variant="success" className="text-xs">
                Target {formatDuration(targetTotalSec)} Berhasil Dicapai
              </Badge>
            )}
          </Card>

          <Button
            size="lg"
            onClick={handleSaveToLog}
            className="h-14 w-full text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all"
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Catat ke Riwayat Lari ({formatDuration(totalElapsedSec)})
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={handleReset}
            className="h-12 w-full text-sm font-medium"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Atur Sesi Lari Baru
          </Button>
        </div>
      )}
    </div>
  );
}
