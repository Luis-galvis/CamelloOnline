import Link from 'next/link';
import { Heart, MapPin, CheckCircle2, Globe, Briefcase, Users, HelpCircle, ShieldCheck } from 'lucide-react';
import { CamelloIcon } from '@/components/brand/CamelloIcon';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-500 pt-14 pb-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
        {/* Brand & Mission */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-indigo-600 flex items-center justify-center text-white shadow-xs p-1">
              <CamelloIcon className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-slate-900 text-lg tracking-tight">
              CAMELLO<span className="text-amber-600">ONLINE</span>
            </span>
            <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full font-bold border border-amber-200">
              COLOMBIA 🇨🇴
            </span>
          </div>
          
          <p className="text-xs text-slate-600 max-w-md leading-relaxed">
            El portal de empleo inteligente para Colombia y trabajo remoto internacional. Centralizamos oportunidades reales y verificadas en Tech, Ventas, IA y Operaciones con transparencia en salarios y beneficios.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Ofertas Verificadas</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl font-medium">
              <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Vacantes en USD & COP</span>
            </div>
          </div>
        </div>

        {/* Portales de Búsqueda */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-amber-600" />
            Portales de Empleo
          </h4>
          <ul className="space-y-2 text-xs text-slate-600">
            <li>
              <Link href="/" className="hover:text-amber-600 hover:underline transition-colors">
                Tech, Software & IA
              </Link>
            </li>
            <li>
              <Link href="/remoto-colombia" className="hover:text-amber-600 hover:underline transition-colors">
                Trabajo Remoto General (USD)
              </Link>
            </li>
            <li>
              <Link href="/ventas-comercial" className="hover:text-amber-600 hover:underline transition-colors">
                Ventas, Comercial & SDR
              </Link>
            </li>
            <li>
              <Link href="/talent" className="hover:text-amber-600 hover:underline transition-colors">
                Directorio de Talento
              </Link>
            </li>
            <li>
              <Link href="/claim-job" className="hover:text-amber-600 hover:underline transition-colors">
                Publicar / Reclamar Vacante
              </Link>
            </li>
          </ul>
        </div>

        {/* Cobertura & Modalidades */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            Ciudades & Remoto
          </h4>
          <ul className="space-y-2 text-xs text-slate-600">
            <li>
              <Link href="/remoto-colombia" className="hover:text-amber-600 transition-colors">
                Remoto Internacional (EE.UU. & Latam)
              </Link>
            </li>
            <li>
              <Link href="/jobs" className="hover:text-amber-600 transition-colors">
                Empleos en Bogotá, D.C.
              </Link>
            </li>
            <li>
              <Link href="/jobs" className="hover:text-amber-600 transition-colors">
                Empleos en Medellín & Antioquia
              </Link>
            </li>
            <li>
              <Link href="/jobs" className="hover:text-amber-600 transition-colors">
                Empleos en Cali & Valle
              </Link>
            </li>
            <li>
              <Link href="/jobs" className="hover:text-amber-600 transition-colors">
                Barranquilla, Bucaramanga & Eje Cafetero
              </Link>
            </li>
          </ul>
        </div>

        {/* Roles Populares / SEO Clusters */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-600" />
            Búsquedas Destacadas
          </h4>
          <ul className="space-y-2 text-xs text-slate-600">
            <li>
              <Link href="/" className="hover:text-amber-600 transition-colors">
                Desarrollador Frontend & Backend
              </Link>
            </li>
            <li>
              <Link href="/remoto-colombia" className="hover:text-amber-600 transition-colors">
                Asistente Virtual Bilingüe
              </Link>
            </li>
            <li>
              <Link href="/ventas-comercial" className="hover:text-amber-600 transition-colors">
                Ejecutivo de Cuentas & BDR
              </Link>
            </li>
            <li>
              <Link href="/remoto-colombia" className="hover:text-amber-600 transition-colors">
                Servicio al Cliente Remoto
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-amber-600 transition-colors">
                Ingeniería de Datos & Python
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* SEO FAQ Accordion / Informative Snippet */}
      <div className="max-w-7xl mx-auto border-t border-slate-100 pt-8 mb-8">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
          Preguntas Frecuentes sobre Empleo en CamelloOnline Colombia
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <h5 className="font-semibold text-slate-900 mb-1">¿Cómo encontrar trabajo remoto que pague en dólares?</h5>
            <p className="leading-relaxed text-slate-600">
              Navega a la sección <Link href="/remoto-colombia" className="text-amber-700 font-medium hover:underline">Trabajo Remoto Colombia</Link> para ver vacantes internacionales que contratan profesionales en Colombia con contratos tipo Contractor o Full-time en USD.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <h5 className="font-semibold text-slate-900 mb-1">¿CamelloOnline cobra por postularse a las vacantes?</h5>
            <p className="leading-relaxed text-slate-600">
              No. CamelloOnline es 100% gratuito para todos los profesionales. Puedes filtrar por salario, ciudad o tecnología y postularte de inmediato a los enlaces oficiales de cada empresa.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <p>© 2026 CamelloOnline (camelloonline.com) - Portal de Empleo y Trabajo Remoto en Colombia.</p>
        <p className="flex items-center gap-1">
          Hecho con pasión para el talento colombiano <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
        </p>
      </div>
    </footer>
  );
}
