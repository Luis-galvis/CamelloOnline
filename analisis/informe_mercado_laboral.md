# 📊 Análisis del Mercado Laboral — Camello Online
### Vacantes junior / entry-level en Colombia · Ventana de datos: 27 oct – 9 nov 2026 (14 días)

---

## 1. Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Vacantes totales capturadas | **7.736** |
| Activas hoy | **1.959** |
| Expiradas (ya no disponibles) | 5.777 |
| Ritmo de vacantes nuevas | **~400–560 por día** (días hábiles) |
| % Remoto | **30,4%** (2.349) |
| % Sin experiencia (0 YoE) | **28,1%** (2.174) |
| % Prácticas / Aprendizaje (SENA) | **11,5%** (887) |
| % que NO exige inglés | **83,2%** |

**Hallazgos clave:**
1. El mercado junior está **dominado por Desarrollo/Software y Ventas/Comercial** (~20% cada uno), seguidos de Soporte TI, Prácticas y Datos/IA.
2. **El jueves es el día con más vacantes nuevas; el domingo el más flojo.** La contratación se concentra de martes a viernes.
3. **El nicho "remoto + sin experiencia" es pequeño: solo 359 de 7.736 (4,6%).** Ahí está la explicación de tu frustración: existe, pero es escaso y se concentra en Ventas, Call Center, Prácticas y Soporte — **no** en desarrollo.
4. El remoto está **sesgado a perfiles con experiencia**; el "sin experiencia" está **sesgado a presencial**.

---

## 2. Alcance y método

- **Fuente:** 7.736 filas de `job_posts` (Supabase), que incluyen activas + expiradas (todo el histórico capturado desde que arrancó el scraper).
- **Ventana:** 27 oct – 9 nov 2026. El primer día (27 oct) fue la siembra inicial masiva (2.353); del 28 oct en adelante es el flujo diario real.
- **Roles:** clasificados por palabras clave del título (desarrollo, ventas, datos, QA, soporte, etc.).
- ⚠️ **Limitación importante:** solo hay **14 días** de datos, así que **no se puede calcular "mejores meses"** todavía. Lo que sí se puede ver con claridad es el **patrón semanal**, la **composición del mercado** y la **tendencia remoto**. Para "mejores meses" hay que dejar acumular datos y re-ejecutar este análisis en 60–90 días.

---

## 3. Volumen y flujo del mercado

Vacantes nuevas capturadas por día (el 27 oct fue la siembra inicial):

| Fecha | Día | Nuevas |
|---|---|---|
| 27 oct | Martes | 2.353 (siembra) |
| 28 oct | Miércoles | 509 |
| 29 oct | Jueves | 560 |
| 30 oct | Viernes | 530 |
| 31 oct | Sábado | 481 |
| 1 nov | Domingo | 437 |
| 2 nov | Lunes | 355 |
| 3 nov | Martes | 415 |
| 4 nov | Miércoles | 414 |
| 5 nov | Jueves | 416 |
| 6 nov | Viernes | 374 |
| 7 nov | Sábado | 328 |
| 8 nov | **Domingo** | **168** ⬇️ |
| 9 nov | Lunes | 396 |

### 📅 Patrón semanal (promedio de nuevas/día, sin contar la siembra)

| Día | Promedio nuevas/día |
|---|---|
| **Jueves** | **488** 🥇 |
| Miércoles | 462 🥈 |
| Viernes | 452 🥉 |
| Martes | 415 |
| Sábado | 405 |
| Lunes | 376 |
| **Domingo** | **303** ⬇️ |

> **Conclusión:** el mejor momento para **publicar una vacante** (o para que un candidato aplique con más ofertas frescas) es **miércoles–viernes, con pico el jueves**. El domingo es claramente el peor día (168 vacantes el 8 nov).

---

## 4. Roles más demandados

| Rol | Vacantes | % |
|---|---|---|
| Desarrollo / Software | 1.530 | 19,8% |
| Ventas / Comercial | 1.515 | 19,6% |
| Soporte TI / Infraestructura | 724 | 9,4% |
| Prácticas / Aprendizaje (SENA) | 515 | 6,7% |
| Datos / Analytics / IA | 380 | 4,9% |
| QA / Testing | 295 | 3,8% |
| Finanzas / Contabilidad | 293 | 3,8% |
| Servicio al Cliente / Call Center | 241 | 3,1% |
| Salud / Enfermería | 142 | 1,8% |
| Operaciones / Admin / Logística | 102 | 1,3% |
| Marketing / Contenido | 98 | 1,3% |
| RRHH / Reclutamiento | 45 | 0,6% |
| Otros (cola larga: abogados, conductores, etc.) | 1.856 | 24,0% |

> **Lectura:** Desarrollo y Ventas empatan como los dos grandes motores del mercado junior. La "cola larga" (24%) son roles no-tech muy variados (operativos, legales, salud, oficios) que aportan volumen pero diluyen el foco.

---

## 5. Modalidad: remoto vs presencial

| Modalidad | Vacantes | % |
|---|---|---|
| Presencial | 5.033 | 65,1% |
| **Remoto** (nacional + mundial) | **2.349** | **30,4%** |
| Híbrido | 354 | 4,6% |

**Tendencia remoto por día (sobre nuevas):** estable entre **24% y 35%**, sin dirección clara (promedio ~28–31%). No se ve ni explosión ni caída del remoto en esta ventana.

### Qué roles son más remotos (dentro de las 2.349 remotas)

| Rol | Remotas |
|---|---|
| Desarrollo / Software | 684 |
| Ventas / Comercial | 497 |
| Servicio al Cliente / Call Center | 158 |
| Soporte TI / Infra | 125 |
| Datos / Analytics / IA | 99 |
| Prácticas / Aprendizaje | 56 |
| Marketing / Contenido | 49 |
| QA / Testing | 46 |

> **Conclusión:** si tu foco es remoto, **Desarrollo** es el rol más remoto del mercado (684 remotas), pero casi siempre **con experiencia**.

---

## 6. Sin experiencia y primer empleo

| Métrica | Vacantes | % |
|---|---|---|
| Sin experiencia (0 años) | 2.174 | 28,1% |
| Con experiencia | 5.562 | 71,9% |
| Nivel trainee / intern | 2.826 | 36,5% |
| Con flag "practicante/aprendiz/SENA" en el título | 887 | 11,5% |

### Qué roles ofrecen "sin experiencia"

| Rol | Sin exp |
|---|---|
| Ventas / Comercial | 554 |
| Prácticas / Aprendizaje | 457 |
| Finanzas / Contabilidad | 171 |
| Soporte TI / Infra | 129 |
| Desarrollo / Software | 126 |
| Servicio al Cliente / Call Center | 78 |

> **Conclusión:** la puerta de entrada para el **primer empleo** está en **Ventas y Prácticas/Aprendizaje**, no en desarrollo. Desarrollo sí contrata junior, pero pide al menos algo de experiencia.

---

## 7. 🎯 Tu nicho: "remoto + sin experiencia"

Este es el dato que explica tu frustración:

| Combinación | Vacantes | % del total |
|---|---|---|
| **Remoto + Sin experiencia** | **359** | **4,6%** |
| Remoto (cualquier experiencia) | 2.349 | 30,4% |
| Sin experiencia (cualquier modalidad) | 2.174 | 28,1% |

**Dónde están esos 359 "remoto sin experiencia":**

| Rol | Vacantes |
|---|---|
| Ventas / Comercial | 56 |
| Prácticas / Aprendizaje | 46 |
| Servicio al Cliente / Call Center | 40 |
| Soporte TI / Infra | 31 |
| Desarrollo / Software | 27 |
| Finanzas / Contabilidad | 13 |
| Marketing / Contenido | 12 |

> **Conclusión estratégica:** el cruce "remoto + sin experiencia" **casi no existe en desarrollo** (27). Existe sobre todo en **Ventas, Call Center y Prácticas**. Si quieres llenar ese hueco (tu foco), el scraper debe atacar **call centers remotos, ventas remotas y prácticas virtuales**, no tanto "desarrollador junior remoto".

---

## 8. Inglés

| Nivel | Vacantes | % |
|---|---|---|
| No requiere inglés | 6.434 | 83,2% |
| B2 (intermedio-alto) | 1.231 | 15,9% |
| C1 (avanzado) | 71 | 0,9% |

> El **83% no exige inglés**. El 17% que sí lo exige paga el plus bilingüe (call center B2 sobre todo). Buena noticia para tu audiencia masiva.

---

## 9. Ubicación (dónde está el trabajo)

| Ubicación | Vacantes | % |
|---|---|---|
| **Remoto (Colombia)** | 2.325 | 30,0% |
| Bogotá D.C. | 1.759 | 22,7% |
| Colombia (general) | 1.597 | 20,6% |
| Ibagué | 709 | 9,2% ⚠️ |
| Medellín | 630 | 8,1% |
| Cali | 243 | 3,1% |
| Bucaramanga | 120 | 1,6% |
| Eje Cafetero | 109 | 1,4% |
| Barranquilla | 75 | 1,0% |

> ⚠️ **Ibagué está sobrerrepresentado (9,2%)** porque el scraper tiene un foco especial en Tolima/Ibagué. Bogotá es el polo real (23%), y Remoto ya compite con Bogotá como la "ubicación" #1.

---

## 10. Fuentes de vacantes

| Fuente | Vacantes | % |
|---|---|---|
| Computrabajo | 4.778 | 61,8% |
| LinkedIn | 1.552 | 20,1% |
| ElEmpleo | 879 | 11,4% |
| Greenhouse (ATS) | 240 | 3,1% |
| WeRemoto | 175 | 2,3% |
| Ashby (ATS) | 41 | 0,5% |
| GetOnBoard | 27 | 0,3% |
| Otros (Stripe, Dropbox, Databricks…) | ~44 | 0,6% |

> Computrabajo es la mina de oro (62%), sobre todo para roles no-tech y primer empleo. LinkedIn aporta el 20% (tech/remoto). Los ATS globales (Greenhouse/Ashby) son el canal más limpio de vacantes remotas internacionales.

---

## 11. Salario (⚠️ con reserva)

- El **49,5%** de las vacantes no publica salario (se les asigna un default de $700 USD).
- Donde **sí** hay salario real (convertido de COP a USD), el mínimo se agrupa en **$366–$976 USD/mes** (≈ **1,6M–4,4M COP**), con la mayor concentración en **$427–$488 USD (≈ 1,9M–2,2M COP)**.
- Esto es coherente con el mercado junior colombiano: ligeramente por encima del SMMLV.

> ⚠️ El extractor de salarios es el componente más ruidoso del pipeline; no lo uses para decisiones finas. Es recomendable invertir en un extractor salarial más preciso si quieres reportes de compensación confiables.

---

## 12. Conclusiones y acciones recomendadas

**Para tu estrategia de contenido / captación de candidatos:**
1. **Publica/promociona de martes a viernes (pico jueves).** El domingo no vale la pena.
2. **Bogotá + Remoto** son tus dos audiencias principales.

**Para el producto (foco "remoto sin experiencia"):**
3. El hueco real está en **call center remoto, ventas remotas y prácticas virtuales** — no en "desarrollador junior remoto". Redirige los scrapers hacia esas fuentes (Computrabajo tiene miles de "call center remoto sin experiencia").
4. El remoto y el "sin experiencia" casi no se cruzan en la data actual; si logras llenar ese cruce, tienes un diferenciador.

**Para la calidad del dato:**
5. El extractor salarial necesita mejora (50% defaults).
6. Acumular datos 60–90 días para poder responder "mejores meses" con solidez.

---

*Generado por el análisis de Camello Online — datos reales de Supabase, 9 nov 2026.*
