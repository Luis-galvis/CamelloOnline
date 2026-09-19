'use client';

import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

export function AuthModal() {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authModalMode, 
    openAuthModal, 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail 
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const isRegister = authModalMode === 'register';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (isRegister) {
        if (!fullName.trim()) {
          setErrorMessage('Por favor escribe tu nombre completo.');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
          setIsSubmitting(false);
          return;
        }

        const { error } = await signUpWithEmail(email, password, fullName);
        if (error) {
          setErrorMessage(error.message || 'No pudimos crear tu cuenta. Intenta de nuevo.');
        } else {
          setSuccessMessage('¡Cuenta creada con éxito! Ingresando...');
          setTimeout(() => {
            closeAuthModal();
          }, 1200);
        }
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          setErrorMessage('Correo o contraseña incorrectos.');
        } else {
          setSuccessMessage('¡Bienvenido de nuevo!');
          setTimeout(() => {
            closeAuthModal();
          }, 1000);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleClick = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al conectar con Google.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              100% Gratuito y Verificado
            </span>
          </div>

          <h2 className="text-xl font-extrabold tracking-tight text-white">
            {isRegister ? 'Crea tu perfil en CamelloOnline' : 'Inicia sesión en CamelloOnline'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {isRegister
              ? 'Desbloquea +900 camellos verificados a diario, postúlate en 1 clic y sube tu hoja de vida.'
              : 'Accede a tus postulaciones, camellos guardados y a tu perfil profesional.'}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Quick Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isRegister ? 'Registrarme con Google' : 'Continuar con Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              o con tu correo
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <span>{isRegister ? 'Crear Cuenta Gratis' : 'Iniciar Sesión'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Switch Tab */}
          <div className="text-center pt-2 border-t border-slate-100">
            {isRegister ? (
              <p className="text-xs text-slate-600">
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    openAuthModal('login');
                  }}
                  className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Inicia sesión aquí
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-600">
                ¿Aún no tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    openAuthModal('register');
                  }}
                  className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Regístrate gratis
                </button>
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Tus datos son privados · Cero spam · 100% Gratuito</span>
          </div>
        </div>
      </div>
    </div>
  );
}
