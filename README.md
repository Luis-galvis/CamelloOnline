# CAMELLO ONLINE 🇨🇴 · Bolsa de Empleo Colombia

Plataforma moderna de empleo verificada para Colombia y Latinoamérica con agregación multifuente en tiempo real (**LinkedIn Jobs & Posts de Reclutadores, WeRemoto, ElEmpleo, Computrabajo, Torre.ai, Jooble, ATSs de empresas líderes y Cajas Locales**).

---

## 🚀 Características Principales

1. **Motor de Scraping Multifuente**:
   - **LinkedIn Jobs & Hiring Posts**: Extracción de ofertas verificadas y publicaciones directas de reclutadores con datos de contacto (email y perfil).
   - **WeRemoto / WorkRemoto**: Ofertas 100% remotas para Colombia y Latinoamérica (Tech, Diseño, Ventas, Soporte, Finanzas).
   - **Computrabajo & ElEmpleo**: Cobertura nacional y regional (Ibagué, Tolima, Bogotá, Medellín, Cali, etc.).
   - **ATSs Directos**: Integración con Greenhouse, Lever, Ashby y Workable de startups y unicornios (Rappi, Nubank, Bold, Addi, Simetrik, EPAM, etc.).
   - **Ventas, TAT & Comercial**: Categoría especializada en canal TAT, supervisión comercial, puntos de venta y contabilidad.
2. **Acceso 100% Libre y Sin Restricciones**:
   - Cualquier visitante puede explorar y paginar cientos de ofertas sin bloqueos de login.
   - Registro voluntario para destacar perfiles ante empresas aliadas y recibir ofertas directas.
3. **Filtros Avanzados Reactivos**:
   - Nivel de inglés (Español vs Requiere Inglés).
   - Experiencia (Sin experiencia / Trainee / 0-2 años / Mid).
   - Rango salarial en COP y USD.
   - Modalidad (100% Remoto, Híbrido, Presencial).
   - Demanda de postulantes (Baja competencia / Alto interés).
4. **Diseño Premium y 100% Responsive**:
   - Optimizado para móviles, tablets y escritorios con microinteracciones y tipografía moderna.

---

## 🛠️ Tecnologías

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Estilos**: Tailwind CSS + Lucide Icons
- **Base de Datos & Auth**: Supabase (PostgreSQL + Row Level Security)
- **Scraping & Ingestión**: Node.js / TypeScript + Cheerio + Fetch con timeouts paralelos

---

## 📦 Instalación y Desarrollo Local

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/camello-online.git
   cd camello-online
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:
   Copiar `.env.example` a `.env.local` y completar las credenciales de Supabase:
   ```bash
   cp .env.example .env.local
   ```

4. Ejecutar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

---

## 🤖 Ejecutar el Scraping de Vacantes

Para actualizar la base de datos de Supabase y el respaldo JSON local con las ofertas más recientes:

```bash
npx tsx scripts/scrape-colombia-jobs.ts
```

---

## 🌐 Despliegue en Producción (Vercel / Netlify)

1. Subir el proyecto a tu repositorio de GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: camello online colombia jobs platform"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/tu-repositorio.git
   git push -u origin main
   ```

2. En **Vercel** o **Netlify**:
   - Importar el repositorio desde GitHub.
   - Agregar las variables de entorno en el panel del proyecto:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `SUPABASE_SECRET_KEY`
   - El comando de build es `npm run build` y la carpeta de salida es `.next`.
