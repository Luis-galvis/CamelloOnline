/**
 * Normalizador y Validador Riguroso de Ubicaciones para REALJOBS Colombia
 * 
 * Regla de oro: El 100% de las vacantes deben ser ESTRICTAMENTE en Colombia
 * o Remotas verificadas para Colombia.
 * CUALQUIER vacante con mención de ciudad/país extranjero (ej. Bangalore, EE.UU., Londres, España, etc.)
 * queda DESCARTADA DE INMEDIATO.
 */

export interface LocationNormalizationResult {
  isColombiaValid: boolean;
  city: string;
  department?: string;
  country: string;
  isRemote: boolean;
  workModality: 'remote_worldwide' | 'remote_country' | 'hybrid' | 'on_site';
  displayLocation: string;
  filterKey: string;
}

function stripAccents(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const COLOMBIA_CITIES_ORDERED: Array<{ key: string; name: string; dept: string; regex: RegExp }> = [
  { key: 'bogota', name: 'Bogotá, D.C.', dept: 'Cundinamarca', regex: /\b(bogota|distrito\s*capital|cundinamarca|chia|soacha|cota|tocancipa|funza|mosquera|madrid\s*cundinamarca)\b/i },
  { key: 'medellin', name: 'Medellín', dept: 'Antioquia', regex: /\b(medellin|antioquia|envigado|itagui|sabaneta|rionegro|bello|la\s*estrella)\b/i },
  { key: 'cali', name: 'Cali', dept: 'Valle del Cauca', regex: /\b(cali|valle\s*del\s*cauca|yumbo|palmira|jamundi|tulua|buga)\b/i },
  { key: 'barranquilla', name: 'Barranquilla', dept: 'Atlántico', regex: /\b(barranquilla|atlantico|soledad|puerto\s*colombia|malambo)\b/i },
  { key: 'bucaramanga', name: 'Bucaramanga', dept: 'Santander', regex: /\b(bucaramanga|santander|floridablanca|giron|piedecuesta|barrancabermeja)\b/i },
  { key: 'cartagena', name: 'Cartagena', dept: 'Bolívar', regex: /\b(cartagena|bolivar|turbaco)\b/i },
  { key: 'ibague', name: 'Ibagué', dept: 'Tolima', regex: /\b(ibague|tolima|espinal|melgar)\b/i },
  { key: 'eje_cafetero', name: 'Pereira / Manizales / Armenia', dept: 'Eje Cafetero', regex: /\b(pereira|manizales|armenia|risaralda|caldas|quindio|dosquebradas|santa\s*rosa\s*de\s*cabal)\b/i },
  { key: 'cucuta', name: 'Cúcuta', dept: 'Norte de Santander', regex: /\b(cucuta|norte\s*de\s*santander|los\s*patios|villa\s*del\s*rosario)\b/i },
  { key: 'santa_marta', name: 'Santa Marta', dept: 'Magdalena', regex: /\b(santa\s*marta|magdalena|cienaga)\b/i },
  { key: 'pasto', name: 'Pasto', dept: 'Nariño', regex: /\b(pasto|narino|ipiales)\b/i },
  { key: 'monteria', name: 'Montería', dept: 'Córdoba', regex: /\b(monteria|cordoba|cerete)\b/i },
  { key: 'villavicencio', name: 'Villavicencio', dept: 'Meta', regex: /\b(villavicencio|meta|acacias)\b/i },
  { key: 'neiva', name: 'Neiva', dept: 'Huila', regex: /\b(neiva|huila|pitalito)\b/i },
  { key: 'popayan', name: 'Popayán', dept: 'Cauca', regex: /\b(popayan|cauca|santander\s*de\s*quilichao)\b/i },
  { key: 'valledupar', name: 'Valledupar', dept: 'Cesar', regex: /\b(valledupar|cesar)\b/i },
  { key: 'tunja', name: 'Tunja', dept: 'Boyacá', regex: /\b(tunja|boyaca|duitama|sogamoso)\b/i },
  { key: 'sincelejo', name: 'Sincelejo', dept: 'Sucre', regex: /\b(sincelejo|sucre|corozal)\b/i },
  { key: 'riohacha', name: 'Riohacha', dept: 'La Guajira', regex: /\b(riohacha|guajira|maicao)\b/i },
];

// Exhaustive list of foreign cities, countries and regions that invalidate the job for Colombia
const FOREIGN_LOCATION_REJECTION_REGEX = /\b(china|beijing|shanghai|shenzhen|hong\s*kong|taiwan|taipei|korea|seoul|bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai|noida|gurgaon|india|san\s*francisco|new\s*york|los\s*angeles|seattle|austin|chicago|boston|denver|atlanta|dallas|miami|united\s*states|usa|u\.s\.a?|california|texas|florida|washington|london|manchester|birmingham|united\s*kingdom|uk|u\.k\.|england|ireland|dublin|madrid|barcelona|valencia|sevilla|spain|espana|berlin|munich|frankfurt|hamburg|germany|deutschland|paris|france|amsterdam|netherlands|rotterdam|poland|warsaw|krakow|toronto|vancouver|montreal|canada|sydney|melbourne|brisbane|australia|auckland|new\s*zealand|tokyo|japan|singapore|philippines|manila|cebu|vietnam|hanoi|saudi\s*arabia|uae|dubai|mexico|ciudad\s*de\s*mexico|cdmx|guadalajara|monterrey|brazil|brasil|sao\s*paulo|rio\s*de\s*janeiro|curitiba|buenos\s*aires|argentina|cordoba|rosario|santiago|chile|lima|peru|costa\s*rica|san\s*jose|panama|uruguay|montevideo|paraguay|asuncion|bolivia|la\s*paz|ecuador|quito|guayaquil|venezuela|caracas|emea|apac|latam\s*\(excluding\s*colombia\))\b/i;

// 1. Strict negative remote signals (presencial signals that override loose remote mentions)
const STRICT_PRESENCIAL_REGEX = /\b(100%\s*presencial|totalmente\s*presencial|trabajo\s*presencial|modalidad\s*presencial|vacante\s*presencial|labor\s*presencial|jornada\s*presencial|en\s*sede|en\s*oficina|en\s*punto\s*de\s*venta|punto\s*de\s*venta|tienda\s*fisica|presencial\s*en|asistir\s*a\s*la\s*oficina|no\s*es\s*remot[oa]|no\s*remot[oa]|no\s*teletrabajo|no\s*aplica\s*teletrabajo|on[\s-]?site|onsite)\b/i;

// 2. Explicit remote in location field
const RAW_LOC_REMOTE_REGEX = /\b(remot[oa]|teletrabajo|desde\s*casa|home\s*office|wfh|remote|anywhere|worldwide)\b/i;

// 3. Explicit structured remote in title or description
const STRUCTURED_REMOTE_REGEX = /\b(100%\s*remot[oa]|full\s*remote|totalmente\s*remot[oa]|trabajo\s*100%\s*remot[oa]|modalidad:\s*100%\s*remot[oa]|modalidad:\s*remot[oa]|modalidad\s*100%\s*remota|modalidad\s*remota|puesto\s*remoto|rol\s*remoto|vacante\s*remota|trabajo\s*desde\s*casa|remote\s*colombia|remote\s*worldwide|trabajo\s*remoto\b|teletrabajo\s*100%)/i;

// 4. Hybrid
const HYBRID_REGEX = /\b(hibrid[oa]|hybrid|semipresencial|alternancia|esquema\s*hibrido|modalidad\s*hibrida|modalidad:\s*hibrid[oa]|dias\s*en\s*oficina|dias\s*remoto|teletrabajo\s*\d\s*dias|remoto\s*\d\s*dias)\b/i;

export function normalizeLocation(rawLocation: string, actualJobDescription: string = ''): LocationNormalizationResult {
  const loc = (rawLocation || '').trim();
  const desc = (actualJobDescription || '').trim();
  const normLoc = stripAccents(loc);
  const normDesc = stripAccents(desc);
  const fullText = `${normLoc} ${normDesc}`;

  // 1. HARD REJECTION: If the location explicitly mentions a foreign city or country, reject immediately!
  if (FOREIGN_LOCATION_REJECTION_REGEX.test(normLoc)) {
    const hasExplicitColombia = /\b(colombia|bogota|medellin|cali|barranquilla|ibague)\b/i.test(normLoc);
    if (!hasExplicitColombia) {
      return {
        isColombiaValid: false,
        city: loc,
        country: 'OTHER',
        isRemote: false,
        workModality: 'on_site',
        displayLocation: loc,
        filterKey: 'other'
      };
    }
  }

  const hasStrictPresencial = STRICT_PRESENCIAL_REGEX.test(fullText);
  const hasRawLocRemote = RAW_LOC_REMOTE_REGEX.test(normLoc);
  const hasStructuredRemote = STRUCTURED_REMOTE_REGEX.test(fullText);
  const hasHybrid = HYBRID_REGEX.test(fullText);

  // Determine true modality with strict priority
  let isRemote = false;
  let isHybridModality = false;

  if (hasStrictPresencial && !hasRawLocRemote) {
    // Presencial explicitly stated
    isRemote = false;
    isHybridModality = false;
  } else if (hasHybrid) {
    isHybridModality = true;
    isRemote = false;
  } else if (hasRawLocRemote || hasStructuredRemote) {
    isRemote = true;
    isHybridModality = false;
  }

  // 2. Exact match in physical Colombian cities
  for (const cityInfo of COLOMBIA_CITIES_ORDERED) {
    if (cityInfo.regex.test(normLoc)) {
      let modality: LocationNormalizationResult['workModality'] = 'on_site';
      let display = `Presencial · ${cityInfo.name}`;

      if (isRemote) {
        modality = 'remote_country';
        display = `🏠 Remoto · ${cityInfo.name}`;
      } else if (isHybridModality) {
        modality = 'hybrid';
        display = `Híbrido · ${cityInfo.name}`;
      }

      return {
        isColombiaValid: true,
        city: cityInfo.name,
        department: cityInfo.dept,
        country: 'CO',
        isRemote,
        workModality: modality,
        displayLocation: display,
        filterKey: isRemote ? 'remoto_colombia' : cityInfo.key
      };
    }
  }

  // 3. Pure Remote Colombia (without city or general remote)
  if (isRemote) {
    const hasColombia = normLoc.includes('colombia') || normLoc.includes('co') || normDesc.includes('colombia') || normDesc.includes('latam');
    const isGenericRemoteLoc = normLoc === 'remote' || normLoc === 'remoto' || normLoc === 'remote / teletrabajo' || normLoc === 'anywhere' || normLoc === 'worldwide' || normLoc.includes('home based') || normLoc === '';
    
    if ((hasColombia || isGenericRemoteLoc) && !FOREIGN_LOCATION_REJECTION_REGEX.test(normLoc)) {
      return {
        isColombiaValid: true,
        city: 'Remoto (Colombia)',
        country: 'CO',
        isRemote: true,
        workModality: 'remote_country',
        displayLocation: '🏠 Remoto (Colombia)',
        filterKey: 'remoto_colombia'
      };
    }
  }

  // 4. General "Colombia" on-site or hybrid
  if (normLoc === 'colombia' || normLoc === 'co' || normLoc.startsWith('colombia,')) {
    return {
      isColombiaValid: true,
      city: 'Colombia',
      country: 'CO',
      isRemote: isRemote,
      workModality: isRemote ? 'remote_country' : (isHybridModality ? 'hybrid' : 'on_site'),
      displayLocation: isRemote ? '🏠 Remoto (Colombia)' : (isHybridModality ? 'Híbrido · Colombia' : '📍 Colombia'),
      filterKey: isRemote ? 'remoto_colombia' : 'colombia'
    };
  }

  // Otherwise, if we can't strictly confirm it's in Colombia, reject it!
  return {
    isColombiaValid: false,
    city: loc || 'Desconocido',
    country: 'OTHER',
    isRemote,
    workModality: 'on_site',
    displayLocation: loc,
    filterKey: 'other'
  };
}

