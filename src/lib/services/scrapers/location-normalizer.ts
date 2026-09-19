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

const COLOMBIA_CITIES_ORDERED: Array<{ key: string; name: string; dept: string; regex: RegExp }> = [
  { key: 'bogota', name: 'Bogotá, D.C.', dept: 'Cundinamarca', regex: /\b(bogot[aá]|distrito\s*capital|cundinamarca|ch[ií]a|soacha|cota|tocancip[aá]|funza|mosquera|madrid\s*cundinamarca)\b/i },
  { key: 'medellin', name: 'Medellín', dept: 'Antioquia', regex: /\b(medell[ií]n|antioquia|envigado|itag[uü][ií]|sabaneta|rionegro|bello|la\s*estrella)\b/i },
  { key: 'cali', name: 'Cali', dept: 'Valle del Cauca', regex: /\b(cali|valle\s*del\s*cauca|yumbo|palmira|jamund[ií]|tulu[aá]|buga)\b/i },
  { key: 'barranquilla', name: 'Barranquilla', dept: 'Atlántico', regex: /\b(barranquilla|atl[aá]ntico|soledad|puerto\s*colombia|malambo)\b/i },
  { key: 'bucaramanga', name: 'Bucaramanga', dept: 'Santander', regex: /\b(bucaramanga|santander|floridablanca|gir[oó]n|piedecuesta|barrancabermeja)\b/i },
  { key: 'cartagena', name: 'Cartagena', dept: 'Bolívar', regex: /\b(cartagena|bol[ií]var|turbaco)\b/i },
  { key: 'ibague', name: 'Ibagué', dept: 'Tolima', regex: /\b(ibagu[eé]|tolima|espinal|melgar)\b/i },
  { key: 'eje_cafetero', name: 'Pereira / Manizales / Armenia', dept: 'Eje Cafetero', regex: /\b(pereira|manizales|armenia|risaralda|caldas|quind[ií]o|dosquebradas|santa\s*rosa\s*de\s*cabal)\b/i },
  { key: 'cucuta', name: 'Cúcuta', dept: 'Norte de Santander', regex: /\b(c[uú]cuta|norte\s*de\s*santander|los\s*patios|villa\s*del\s*rosario)\b/i },
  { key: 'santa_marta', name: 'Santa Marta', dept: 'Magdalena', regex: /\b(santa\s*marta|magdalena|ci[eé]naga)\b/i },
  { key: 'pasto', name: 'Pasto', dept: 'Nariño', regex: /\b(pasto|nari[ñn]o|ipiales)\b/i },
  { key: 'monteria', name: 'Montería', dept: 'Córdoba', regex: /\b(monter[ií]a|c[oó]rdoba|ceret[eé])\b/i },
  { key: 'villavicencio', name: 'Villavicencio', dept: 'Meta', regex: /\b(villavicencio|meta|acac[ií]as)\b/i },
  { key: 'neiva', name: 'Neiva', dept: 'Huila', regex: /\b(neiva|huila|pitalito)\b/i },
  { key: 'popayan', name: 'Popayán', dept: 'Cauca', regex: /\b(popay[aá]n|cauca|santander\s*de\s*quilichao)\b/i },
  { key: 'valledupar', name: 'Valledupar', dept: 'Cesar', regex: /\b(valledupar|cesar)\b/i },
  { key: 'tunja', name: 'Tunja', dept: 'Boyacá', regex: /\b(tunja|boyac[aá]|duitama|sogamoso)\b/i },
  { key: 'sincelejo', name: 'Sincelejo', dept: 'Sucre', regex: /\b(sincelejo|sucre|corozal)\b/i },
  { key: 'riohacha', name: 'Riohacha', dept: 'La Guajira', regex: /\b(riohacha|guajira|maicao)\b/i },
];

// Exhaustive list of foreign cities, countries and regions that invalidate the job for Colombia
const FOREIGN_LOCATION_REJECTION_REGEX = /\b(bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai|noida|gurgaon|india|san\s*francisco|new\s*york|los\s*angeles|seattle|austin|chicago|boston|denver|atlanta|dallas|miami|united\s*states|usa|u\.s\.a?|california|texas|florida|washington|london|manchester|birmingham|united\s*kingdom|uk|u\.k\.|england|ireland|dublin|madrid|barcelona|valencia|sevilla|spain|espa[ñn]a|berlin|munich|frankfurt|hamburg|germany|deutschland|paris|france|amsterdam|netherlands|rotterdam|poland|warsaw|krakow|toronto|vancouver|montreal|canada|sydney|melbourne|brisbane|australia|auckland|new\s*zealand|tokyo|japan|singapore|philippines|manila|cebu|vietnam|hanoi|saudi\s*arabia|uae|dubai|mexico|ciudad\s*de\s*m[eé]xico|cdmx|guadalajara|monterrey|brazil|brasil|s[aã]o\s*paulo|rio\s*de\s*janeiro|curitiba|buenos\s*aires|argentina|cordoba|rosario|santiago|chile|lima|peru|costa\s*rica|san\s*jos[eé]|panam[aá]|uruguay|montevideo|paraguay|asunci[oó]n|bolivia|la\s*paz|ecuador|quito|guayaquil|venezuela|caracas|emea|apac|latam\s*\(excluding\s*colombia\))\b/i;

export function normalizeLocation(rawLocation: string, actualJobDescription: string = ''): LocationNormalizationResult {
  const loc = (rawLocation || '').trim();
  const desc = (actualJobDescription || '').trim();
  const lowerLoc = loc.toLowerCase();
  const lowerDesc = desc.toLowerCase();

  // 1. HARD REJECTION: If the location explicitly mentions a foreign city or country, reject immediately!
  // Example: "Remote, Bangalore", "Remote, United States", "Madrid, Spain", "London, UK"
  if (FOREIGN_LOCATION_REJECTION_REGEX.test(lowerLoc)) {
    // Only exception is if it specifically says "Colombia" along with it
    const hasExplicitColombia = /\b(colombia|bogot[aá]|medell[ií]n|cali|barranquilla|ibagu[eé])\b/i.test(lowerLoc);
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

  const isExplicitRemote = /\b(remote|remoto|teletrabajo|desde\s*casa|home\s*office|wfh|100%\s*remot[oa])\b/i.test(lowerLoc) ||
                          /\b(remote|remoto|teletrabajo|desde\s*casa|home\s*office|wfh|100%\s*remot[oa]|modalidad:\s*remot[oa]|modalidad\s*100%\s*remot[oa])\b/i.test(lowerDesc);

  const isHybrid = /\b(hybrid|h[ií]brido|semipresencial|alternancia)\b/i.test(lowerLoc) ||
                   /\b(modalidad:\s*h[ií]brid[oa]|esquema\s*h[ií]brido|d[ií]as\s*de\s*teletrabajo|teletrabajo\s*\d\s*d[ií]as)\b/i.test(lowerDesc);

  // 2. Exact match in raw location field FIRST (ground truth)
  for (const cityInfo of COLOMBIA_CITIES_ORDERED) {
    if (cityInfo.regex.test(lowerLoc)) {
      let modality: LocationNormalizationResult['workModality'] = 'on_site';
      let display = `Presencial · ${cityInfo.name}`;

      if (isExplicitRemote) {
        modality = 'remote_country';
        display = `🏠 Remoto · ${cityInfo.name}`;
      } else if (isHybrid) {
        modality = 'hybrid';
        display = `Híbrido · ${cityInfo.name}`;
      }

      return {
        isColombiaValid: true,
        city: cityInfo.name,
        department: cityInfo.dept,
        country: 'CO',
        isRemote: isExplicitRemote,
        workModality: modality,
        displayLocation: display,
        filterKey: isExplicitRemote ? 'remoto_colombia' : cityInfo.key
      };
    }
  }

  // 3. Remote Colombia ONLY if location specifically mentions Colombia or pure general remote without foreign flags
  if (isExplicitRemote) {
    const hasColombia = lowerLoc.includes('colombia') || lowerLoc.includes('co') || lowerDesc.includes('colombia') || lowerDesc.includes('latam');
    
    // If it's a pure generic "Remote" with no foreign cities
    if (hasColombia || lowerLoc === 'remote' || lowerLoc === 'remoto' || lowerLoc === 'remote / teletrabajo' || !FOREIGN_LOCATION_REJECTION_REGEX.test(lowerLoc)) {
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
  if (lowerLoc === 'colombia' || lowerLoc === 'co' || lowerLoc.startsWith('colombia,')) {
    return {
      isColombiaValid: true,
      city: 'Colombia',
      country: 'CO',
      isRemote: false,
      workModality: isHybrid ? 'hybrid' : 'on_site',
      displayLocation: isHybrid ? 'Híbrido · Colombia' : '📍 Colombia',
      filterKey: 'colombia'
    };
  }

  // Otherwise, if we can't strictly confirm it's in Colombia, reject it!
  return {
    isColombiaValid: false,
    city: loc || 'Desconocido',
    country: 'OTHER',
    isRemote: isExplicitRemote,
    workModality: 'on_site',
    displayLocation: loc,
    filterKey: 'other'
  };
}
