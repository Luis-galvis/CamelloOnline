import Link from 'next/link';
import { ShieldCheck, Heart, Zap, MapPin, CheckCircle2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-500 py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-indigo-600 flex items-center justify-center text-white shadow-xs font-black">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <span className="font-extrabold text-slate-900 text-base tracking-tight">CAMELLO<span className="text-amber-600">ONLINE</span></span>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold border border-slate-200">
              COLOMBIA
            </span>
          </div>
          <p className="text-xs text-slate-600 max-w-md leading-relaxed">
            Plataforma centralizada de empleo y oportunidades remotas para Colombia. Facilitamos el acceso a camello real y verificado con información transparente sobre salarios, modalidades y requisitos.
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl w-fit font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Ofertas verificadas a diario en Colombia</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Cobertura Nacional</h4>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>Bogotá, D.C. & Cundinamarca</span>
            </li>
            <li className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>Medellín & Antioquia</span>
            </li>
            <li className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>Cali & Valle del Cauca</span>
            </li>
            <li className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>Barranquilla, Santander & Remoto</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Áreas & Categorías</h4>
          <ul className="space-y-2 text-xs text-slate-600">
            <li>Desarrollo Frontend, Backend & Full Stack</li>
            <li>Ingeniería de Datos, IA & Cloud</li>
            <li>Ventas Remotas, SDR & BDR Internacional</li>
            <li>Marketing Digital & Contenidos</li>
            <li>Soporte al Cliente & Asistentes Virtuales</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <p>© 2026 CamelloOnline Colombia. Empleo y camello remoto verificado.</p>
        <p className="flex items-center gap-1">
          Construido con pasión para profesionales en Colombia <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
        </p>
      </div>
    </footer>
  );
}
