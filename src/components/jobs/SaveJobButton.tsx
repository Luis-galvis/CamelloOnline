'use client';

import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';

const KEY = 'camelloonline_saved_jobs';

export function getSavedJobIds(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function SaveJobButton({ jobId }: { jobId: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(getSavedJobIds().includes(jobId));
  }, [jobId]);

  const toggle = () => {
    try {
      const list = getSavedJobIds();
      const next = list.includes(jobId) ? list.filter(x => x !== jobId) : [...list, jobId];
      localStorage.setItem(KEY, JSON.stringify(next));
      setSaved(next.includes(jobId));
    } catch {
      // noop
    }
  };

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border transition-colors ${
        saved
          ? 'bg-amber-100 text-amber-800 border-amber-300'
          : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:text-amber-700'
      }`}
    >
      <Bookmark className={`w-4 h-4 ${saved ? 'fill-amber-500 text-amber-500' : ''}`} />
      {saved ? 'Guardada' : 'Guardar'}
    </button>
  );
}
