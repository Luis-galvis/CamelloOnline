'use client';

import { useState } from 'react';

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500';
const labelCls = 'block text-xs font-bold text-slate-600 mb-1';

export function PublishJobForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [claimStatus, setClaimStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [claimMsg, setClaimMsg] = useState('');

  const requestClaim = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const form = e.currentTarget.form;
    if (!form) return;
    const fd = new FormData(form);
    const email = String(fd.get('contactEmail') || '').trim();
    const companyName = String(fd.get('companyName') || '').trim();
    if (!email || !companyName) { setClaimStatus('error'); setClaimMsg('Pon tu email y nombre de empresa primero.'); return; }
    setClaimStatus('loading');
    try {
      const res = await fetch('/api/companies/request-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, companyName, _hp: '' }),
      });
      const data = await res.json();
      if (data.success) {
        setClaimStatus('sent');
        setClaimMsg(data.token ? `Código de prueba: ${data.token}` : '✅ Te enviamos un código a tu email.');
      } else {
        setClaimStatus('error');
        setClaimMsg(data.error || 'Error al solicitar.');
      }
    } catch {
      setClaimStatus('error');
      setClaimMsg('Error de red.');
    }
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    const fd = new FormData(e.currentTarget);
    const payload = {
      companyName: fd.get('companyName'),
      website: fd.get('website'),
      contactEmail: fd.get('contactEmail'),
      title: fd.get('title'),
      description: fd.get('description'),
      workModality: fd.get('workModality'),
      locationCity: fd.get('locationCity'),
      salaryMinUsd: fd.get('salaryMinUsd') || null,
      salaryMaxUsd: fd.get('salaryMaxUsd') || null,
      currency: fd.get('currency') || 'COP',
      isZeroExperience: fd.get('isZeroExperience') === 'on',
      englishRequired: fd.get('englishRequired') || 'no_english',
      claimToken: fd.get('claimToken') || '',
      _hp: fd.get('_hp') || '',
    };
    try {
      const res = await fetch('/api/companies/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('ok');
        setMessage('¡Vacante publicada! Ya aparece en Camello Online.');
        e.currentTarget.reset();
      } else {
        setStatus('error');
        setMessage(data.error || 'Error al publicar.');
      }
    } catch {
      setStatus('error');
      setMessage('Error de red, intenta de nuevo.');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
      {/* Honeypot anti-bots (oculto; los humanos no lo ven ni lo llenan) */}
      <input type="text" name="_hp" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <h3 className="font-bold text-slate-900">Datos de la empresa</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nombre de la empresa *</label>
          <input name="companyName" required className={inputCls} placeholder="Mi Empresa S.A.S." />
        </div>
        <div>
          <label className={labelCls}>Sitio web</label>
          <input name="website" className={inputCls} placeholder="https://miempresa.com" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Email de contacto *</label>
          <div className="flex gap-2">
            <input name="contactEmail" type="email" required className={inputCls} placeholder="reclutamiento@miempresa.com" />
            <button type="button" onClick={requestClaim} className="shrink-0 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800">
              {claimStatus === 'loading' ? 'Enviando…' : 'Solicitar código'}
            </button>
          </div>
          {claimMsg && <p className={`text-xs mt-1 ${claimStatus === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>{claimMsg}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Código de verificación * (te llega por email)</label>
          <input name="claimToken" required className={inputCls} placeholder="Pega aquí el código recibido" />
        </div>
      </div>

      <h3 className="font-bold text-slate-900 pt-2">Datos de la vacante</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={labelCls}>Título del cargo *</label>
          <input name="title" required className={inputCls} placeholder="Desarrollador Junior React" />
        </div>
        <div>
          <label className={labelCls}>Modalidad</label>
          <select name="workModality" className={inputCls} defaultValue="on_site">
            <option value="on_site">Presencial</option>
            <option value="remote_country">Remoto (Colombia)</option>
            <option value="remote_worldwide">Remoto (Mundial)</option>
            <option value="hybrid">Híbrido</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Ciudad</label>
          <input name="locationCity" className={inputCls} placeholder="Bogotá, D.C." />
        </div>
        <div>
          <label className={labelCls}>Salario mín. (USD/mes)</label>
          <input name="salaryMinUsd" type="number" min="0" className={inputCls} placeholder="1200" />
        </div>
        <div>
          <label className={labelCls}>Salario máx. (USD/mes)</label>
          <input name="salaryMaxUsd" type="number" min="0" className={inputCls} placeholder="2000" />
        </div>
        <div>
          <label className={labelCls}>Moneda</label>
          <select name="currency" className={inputCls} defaultValue="COP">
            <option value="COP">COP</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Inglés</label>
          <select name="englishRequired" className={inputCls} defaultValue="no_english">
            <option value="no_english">No requiere</option>
            <option value="b2_upper_intermediate">B2 (intermedio)</option>
            <option value="c1_advanced">C1 (avanzado)</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Descripción</label>
          <textarea name="description" rows={4} className={inputCls} placeholder="Funciones, requisitos, beneficios…" />
        </div>
        <label className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="isZeroExperience" className="w-4 h-4 text-amber-600" />
          Esta vacante es para perfiles <strong>sin experiencia</strong>
        </label>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm disabled:opacity-60"
      >
        {status === 'loading' ? 'Publicando…' : 'Publicar vacante'}
      </button>

      {status === 'ok' && <p className="text-emerald-600 text-sm font-semibold">{message}</p>}
      {status === 'error' && <p className="text-red-500 text-sm font-semibold">{message}</p>}
    </form>
  );
}
