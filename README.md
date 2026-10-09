# CAMELLO ONLINE 🇨🇴 · Bolsa de Empleo Open Source para Colombia

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=flat&logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**CamelloOnline** ([camelloonline.com](https://www.camelloonline.com)) es una plataforma open source creada por y para la comunidad en Colombia. Centraliza ofertas laborales verificadas en tiempo real para **roles de Tecnología, Inteligencia Artificial, Ventas, Trabajo Remoto (en USD y COP), Prácticas SENA / Universitarias y Operaciones**.

---

## 🚀 Características Principales

1. **Motor de Ingestión & Scraping Multifuente**:
   - **LinkedIn Jobs & Hiring Posts**: Ofertas verificadas y publicaciones directas de reclutadores con datos de contacto.
   - **WeRemoto / WorkRemoto**: Vacantes 100% remotas para Colombia y Latinoamérica con salarios en USD.
   - **Torre.ai, Get on Board & ElEmpleo / Computrabajo**: Cobertura nacional (Bogotá, Medellín, Cali, Barranquilla, Bucaramanga, Ibagué, Eje Cafetero, etc.).
   - **ATSs Directos**: Integración directa con Greenhouse, Lever, Ashby y Workable de empresas líderes (Rappi, Nubank, Bold, Addi, Simetrik, etc.).
2. **Clasificadores Inteligentes**:
   - **Detector de Modalidad Estricto**: Diferencia con precisión entre ofertas *100% Remotas*, *Híbridas* y *Presenciales*.
   - **Filtro Granular de Experiencia**: Distingue vacantes *Sin Experiencia / Trainee / SENA* de ofertas que requieren *6 meses*, *1 año*, *2-3 años* o *Senior*.
   - **Extractor Salarial Normalizado**: Detección automática de salarios en COP y USD con rangos y periodicidad.
   - **Detector de Requisito de Inglés**: Clasificación en *Español*, *B1/B2 Intermedio* o *C1/C2 Avanzado*.
3. **SEO & Indexación Estructurada**:
   - Esquemas JSON-LD completos de `JobPosting` optimizados para **Google for Jobs** con `directApply: true`.
   - Soporte para PWA, Sitemap XML dinámico y OpenGraph con branding oficial del camellito.
4. **100% Gratuito y Libre**:
   - Sin muros de pago ni bloqueo de login para postularse a cualquier oferta.

---

## 🏗️ Arquitectura del Proyecto

```text
REALJOBS/
├── public/                  # Assets estáticos, favicons (48px, 96px, 192px, 512px) y póster oficial
├── scripts/                 # Scripts de scraping, ingestión y mantenimiento de base de datos
│   ├── scrape-colombia-jobs.ts           # Scraper principal multicanal
│   ├── scrape-non-tech-remote-jobs.ts    # Scraper de vacantes remotas no-tech
│   ├── build-sales-dataset.js            # Pipeline de vacantes comerciales y ventas
│   └── reclassify-db-jobs.ts             # Script de reclasificación de modalidades y experiencia
├── src/
│   ├── app/                 # Rutas de Next.js App Router (Páginas, API Crons, Sitemap, Robots)
│   ├── components/          # Componentes de UI (Tableros por categoría, Modales, Auth, Navbar, Footer)
│   │   ├── brand/           # Icono vectorial y recursos de marca
│   │   ├── jobs/            # Tableros de Tech, Remoto No-Tech y Ventas Comercial
│   │   └── seo/             # Esquemas JSON-LD para Google for Jobs y Organización
│   ├── lib/
│   │   ├── services/        # Lógica de scraping, extractores de salario, detectores de experiencia y modalidad
│   │   ├── store.ts         # Zustand store reactivo con sincronización a Supabase
│   │   └── supabase.ts      # Cliente de Supabase
│   └── types/               # Definiciones de tipos TypeScript
└── supabase/                # Esquema de base de datos PostgreSQL (schema.sql)
```

---

## 📦 Instalación y Desarrollo Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/Luis-galvis/CamelloOnline.git
cd CamelloOnline
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env.local` basado en `.env.example`:
```bash
cp .env.example .env.local
```

Configura tus claves de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
SUPABASE_SECRET_KEY=tu-secret-key
```

### 4. Inicializar la base de datos (Opcional si usas tu propia instancia de Supabase)
Puedes ejecutar el script SQL ubicado en `supabase/schema.sql` en el SQL Editor de tu proyecto de Supabase.

### 5. Iniciar el servidor de desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🤖 Ejecución de Scrapers

Para ejecutar manualmente los scrapers y alimentar la base de datos:

```bash
# Scraping principal de tecnología y empleo general en Colombia
npx tsx scripts/scrape-colombia-jobs.ts

# Scraping de vacantes remotas no-tech (Customer Support, Ventas, Ops)
npx tsx scripts/scrape-non-tech-remote-jobs.ts
```

---

## 🤝 Cómo Contribuir

¡Las contribuciones son bienvenidas! Si deseas colaborar:

1. Haz un **Fork** del proyecto.
2. Crea una rama para tu feature o fix (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios y verifica que el build pase (`npm run build`).
4. Haz commit de tus cambios (`git commit -m "feat: agrega nuevo scraper de vacantes"`).
5. Haz push a tu rama (`git push origin feature/nueva-funcionalidad`).
6. Abre un **Pull Request** explicando detalladamente tu cambio.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
