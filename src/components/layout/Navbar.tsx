'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  RefreshCw, 
  CheckCircle2, 
  Sparkles,
  Laptop,
  Headphones,
  Store,
  LogOut
} from 'lucide-react';
import { CamelloIcon } from '@/components/brand/CamelloIcon';
import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/context/AuthContext';

export function Navbar() {
  const pathname = usePathname();
  const [isSyncing, setIsSyncing] = useState(false);
  const { jobs, refreshJobsFromSupabase, isLoadingSupabase } = useAppStore();
  const { user, openAuthModal, signOut } = useAuth();

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    await refreshJobsFromSupabase();
    setTimeout(() => setIsSyncing(false), 800);
  };

  const isTechActive = pathname === '/' || pathname.startsWith('/jobs');
  const isGeneralRemoteActive = pathname === '/remoto-colombia';
  const isSalesActive = pathname === '/ventas-comercial';

  const generalRemoteCount = useMemo(() => {
    const NON_TECH_REMOTE = new Set(['customer_service', 'sales_commercial', 'marketing_digital', 'virtual_assistant_ops', 'hr_recruiting', 'finance_accounting', 'writing_content', 'general_remote']);
    return jobs.filter(j => {
      const isRem = j.isRemote || j.workModality === 'remote_country' || j.workModality === 'remote_worldwide';
      const cat = j.category || '';
      return isRem && (NON_TECH_REMOTE.has(cat) || !['software_dev', 'data_ai', 'qa_testing', 'it_support'].includes(cat));
    }).length || 120;
  }, [jobs]);

  const salesJobsCount = useMemo(() => {
    const SALES_CATS = new Set(['sales_commercial', 'finance_accounting']);
    return jobs.filter(j => {
      const cat = j.category || '';
      return SALES_CATS.has(cat) || /ventas|comercial|tat|punto de venta|asesor|vendedor|contad|costos|cajero|ejecutivo/i.test(`${j.title} ${j.categoryLabel || ''}`);
    }).length || 140;
  }, [jobs]);

  const techJobsCount = useMemo(() => {
    const TECH_CATEGORIES = new Set(['data_ai', 'software_dev', 'qa_testing', 'it_support', 'ui_ux_product']);
    return jobs.filter(j => j.category && TECH_CATEGORIES.has(j.category)).length || 500;
  }, [jobs]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Desktop & Mobile Top Row */}
        <div className="h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform text-white p-1">
              <CamelloIcon className="w-6 h-6 text-white drop-shadow-xs" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                  CAMELLO<span className="text-amber-600">ONLINE</span>
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  🇨🇴
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium leading-none hidden sm:block">
                +{jobs.length > 0 ? jobs.length : '1.280'} vacantes activas en Colombia
              </p>
            </div>
          </Link>

          {/* Desktop Section Switcher Tabs (Hidden on Mobile) */}
          <nav className="hidden lg:flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            <Link
              href="/"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isTechActive
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Laptop className="w-3.5 h-3.5 text-indigo-600" />
              <span>💻 Tecnología & Software</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                isTechActive ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {techJobsCount}
              </span>
            </Link>

            <Link
              href="/remoto-colombia"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isGeneralRemoteActive
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Headphones className="w-3.5 h-3.5 text-emerald-600" />
              <span>🏠 Remoto (No Tech)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                isGeneralRemoteActive ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {generalRemoteCount}
              </span>
            </Link>

            <Link
              href="/ventas-comercial"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isSalesActive
                  ? 'bg-white text-amber-700 shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <span>💼 Ventas & Comercial</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                isSalesActive ? 'bg-amber-100 text-amber-800' : 'bg-amber-100 text-amber-700'
              }`}>
                {salesJobsCount}
              </span>
            </Link>
          </nav>

          {/* User Auth Section & Refresh */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing || isLoadingSupabase}
              className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Actualizar vacantes en vivo"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing || isLoadingSupabase ? 'animate-spin text-amber-600' : 'text-slate-500'}`} />
            </button>

            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/candidate/profile"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold transition-all border border-slate-200/70"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="Avatar" 
                      className="w-5 h-5 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[90px] sm:max-w-[120px] truncate text-[11px] sm:text-xs">
                    {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-semibold hidden sm:inline">
                    Mi Perfil
                  </span>
                </Link>

                <button
                  onClick={() => signOut()}
                  className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-xs"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Ingresar
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] sm:text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Registro</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Mobile & Tablet Sub-Navigation Tabs Row */}
        <div className="lg:hidden pb-2.5 pt-0.5">
          <nav className="grid grid-cols-3 gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            <Link
              href="/"
              className={`flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all text-center ${
                isTechActive
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Laptop className="w-3 h-3 text-indigo-600 shrink-0" />
              <span className="truncate">Tech ({techJobsCount})</span>
            </Link>

            <Link
              href="/remoto-colombia"
              className={`flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all text-center ${
                isGeneralRemoteActive
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Headphones className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">No-Tech</span>
            </Link>

            <Link
              href="/ventas-comercial"
              className={`flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all text-center ${
                isSalesActive
                  ? 'bg-white text-amber-700 shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3 h-3 text-amber-600 shrink-0" />
              <span className="truncate">Ventas</span>
            </Link>
          </nav>
        </div>

      </div>
    </header>
  );
}
