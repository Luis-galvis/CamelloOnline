'use client';

import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/context/AuthContext';

const KEY = 'camelloonline_saved_jobs';

function getLocal(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function SaveJobButton({ jobId }: { jobId: string }) {
  const { user, openAuthModal } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      (async () => {
        try {
          const { data } = await supabase
            .from('saved_jobs')
            .select('job_post_id')
            .eq('user_id', user.id)
            .eq('job_post_id', jobId)
            .maybeSingle();
          setSaved(Boolean(data));
        } catch {
          setSaved(false);
        }
      })();
    } else {
      setSaved(getLocal().includes(jobId));
    }
  }, [user, jobId]);

  const toggle = async () => {
    if (!user) {
      // Sin sesión: guardado local + invitar a iniciar sesión para sincronizar
      const list = getLocal();
      const next = list.includes(jobId) ? list.filter(x => x !== jobId) : [...list, jobId];
      localStorage.setItem(KEY, JSON.stringify(next));
      setSaved(next.includes(jobId));
      if (next.includes(jobId)) openAuthModal('login');
      return;
    }

    setBusy(true);
    try {
      if (saved) {
        await supabase.from('saved_jobs').delete().eq('user_id', user.id).eq('job_post_id', jobId);
        setSaved(false);
      } else {
        const { error } = await supabase.from('saved_jobs').insert({ user_id: user.id, job_post_id: jobId });
        if (!error) setSaved(true);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
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
