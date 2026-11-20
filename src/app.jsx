import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { UnifiedTimer } from '@/components/timer/UnifiedTimer';
import { RunHistoryView } from '@/components/log/RunHistoryView';
import { RunFormModal } from '@/components/log/RunFormModal';
import {
  loadRunsFromStorage,
  saveRunsToStorage,
  exportRunsToJsonFile,
} from '@/lib/storage';

export function App() {
  // Tab utama: 'timer' | 'history'
  const [activeTab, setActiveTab] = useState('timer');

  // State aktivitas Live Dynamic Island untuk Header
  const [timerActivity, setTimerActivity] = useState({
    status: 'idle',
    label: 'Siap Lari',
    phase: '',
  });

  // State log sesi lari - inisialisasi lazy dari storage
  const [runs, setRuns] = useState(() => loadRunsFromStorage());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingDuration, setPendingDuration] = useState(0);

  // Simpan setiap perubahan runs ke localStorage
  const handleSaveRun = (newRun) => {
    const updated = [newRun, ...runs];
    setRuns(updated);
    saveRunsToStorage(updated);
    setTimerActivity({ status: 'idle', label: 'Siap Lari', phase: '' });
    setActiveTab('history');
  };

  const handleDeleteRun = (id) => {
    const updated = runs.filter((r) => r.id !== id);
    setRuns(updated);
    saveRunsToStorage(updated);
  };

  const handleExportJson = () => {
    exportRunsToJsonFile(runs);
  };

  // Handler saat timer selesai dan ingin mencatat ke log
  const handleTimerFinished = (durationSec) => {
    setPendingDuration(durationSec);
    setIsModalOpen(true);
  };

  const handleOpenManualAdd = (initialSec = 0) => {
    setPendingDuration(initialSec);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Container Mobile First */}
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        {/* Header Dynamic Island Live State */}
        <Header activity={timerActivity} />

        {/* Konten Utama */}
        <main className="flex-1 p-4 pb-28">
          {/* View Tab Timer (Selalu ter-mount dengan CSS hidden agar timer di latar belakang tidak berhenti) */}
          <div className={activeTab === 'timer' ? 'block' : 'hidden'}>
            <UnifiedTimer
              onFinish={handleTimerFinished}
              onStatusChange={setTimerActivity}
            />
          </div>

          {/* View Tab Riwayat (Tetap ter-mount agar transisi mulus) */}
          <div className={activeTab === 'history' ? 'block' : 'hidden'}>
            <RunHistoryView
              runs={runs}
              onDeleteRun={handleDeleteRun}
              onOpenAddModal={() => handleOpenManualAdd(0)}
              onExportJson={handleExportJson}
            />
          </div>
        </main>

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Modal Form Catat Sesi Lari */}
        {isModalOpen && (
          <RunFormModal
            key={pendingDuration}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            initialDurationSec={pendingDuration}
            onSave={handleSaveRun}
          />
        )}
      </div>
    </div>
  );
}

export default App;
