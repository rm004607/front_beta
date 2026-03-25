import { chileData } from '@/lib/chile-data';

function normalizeLabel(s: string): string {
  return s.normalize('NFC').trim();
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '');
}

/** Misma comuna aunque varíe mayúsculas o espacios; útil vs backend que normaliza distinto. */
export function communesMatch(a: string, b: string): boolean {
  const x = normalizeLabel(a);
  const y = normalizeLabel(b);
  if (x === y) return true;
  if (x.localeCompare(y, 'es', { sensitivity: 'accent' }) === 0) return true;
  return stripAccents(x).toLowerCase() === stripAccents(y).toLowerCase();
}

export function getCommunesForRegion(regionId: string): string[] {
  return chileData.find((r) => String(r.id) === String(regionId))?.communes ?? [];
}

/**
 * Devuelve el nombre exacto del catálogo (chile-data) para esa región.
 * Evita 400 por diferencias Unicode o tildes vs el backend.
 */
export function canonicalizeCommuneInRegion(name: string, regionId: string): string | null {
  const list = getCommunesForRegion(regionId);
  if (!normalizeLabel(name)) return null;
  for (const c of list) {
    if (communesMatch(c, name)) return c;
  }
  return null;
}

/** Regiones cuyo listado incluye esta comuna (puede haber homónimos raros). */
export function findRegionIdsContainingCommune(comuna: string): string[] {
  const ids: string[] = [];
  for (const reg of chileData) {
    if (reg.communes.some((c) => communesMatch(c, comuna))) ids.push(reg.id);
  }
  return ids;
}

/**
 * Comuna de origen + región base coherentes con el catálogo.
 * `baseRegionId` puede venir vacío: se infiere por la comuna.
 */
export function resolveOriginLocation(
  comunaRaw: string,
  baseRegionId: string
): { region_id: string; comuna: string } | { error: string } {
  const trimmed = normalizeLabel(comunaRaw);
  if (!trimmed) return { error: 'Indica una comuna de origen válida.' };

  let rid = String(baseRegionId || '').trim();
  if (rid) {
    const canon = canonicalizeCommuneInRegion(trimmed, rid);
    if (canon) return { region_id: rid, comuna: canon };
  }

  const candidates = findRegionIdsContainingCommune(trimmed);
  if (candidates.length === 0) {
    return { error: 'No reconocemos esa comuna. Elige la comuna desde el listado.' };
  }
  if (candidates.length === 1) {
    const r = candidates[0];
    const c = canonicalizeCommuneInRegion(trimmed, r);
    if (!c) return { error: 'Comuna no válida para la región.' };
    return { region_id: r, comuna: c };
  }

  if (rid && candidates.includes(rid)) {
    const c = canonicalizeCommuneInRegion(trimmed, rid);
    if (c) return { region_id: rid, comuna: c };
  }

  return {
    error:
      'Tu comuna aparece en más de una región en el catálogo. Usa “Cambiar ubicación” y elige región y comuna desde los selectores.',
  };
}

export function communesBelongToRegion(communeNames: string[], regionId: string): boolean {
  if (communeNames.length === 0) return true;
  return communeNames.every((c) => canonicalizeCommuneInRegion(c, regionId) != null);
}

/** Quita comunas que no pertenecen a la región elegida (evita datos huérfanos al cambiar de región). */
export function filterCommunesToRegion(communeNames: string[], regionId: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of communeNames) {
    const canon = canonicalizeCommuneInRegion(raw, regionId);
    if (canon && !seen.has(canon)) {
      seen.add(canon);
      out.push(canon);
    }
  }
  return out;
}

/**
 * region_id del servicio debe alinear con las comunas de cobertura.
 * Si hay cobertura y la región elegida contiene todas las comunas, usa esa.
 * Si no, intenta inferir la única región que contiene todas las comunas seleccionadas.
 */
export function resolveRegionIdForCoverage(
  coverageCommunes: string[],
  coverageRegion: string,
  fallbackRegion: string
): string {
  if (coverageCommunes.length === 0) {
    return coverageRegion || fallbackRegion;
  }
  if (coverageRegion) {
    const allowed = getCommunesForRegion(coverageRegion);
    if (coverageCommunes.every((c) => allowed.some((a) => communesMatch(a, c)))) {
      return coverageRegion;
    }
  }
  const matches = chileData.filter((reg) =>
    coverageCommunes.every((c) => reg.communes.some((a) => communesMatch(a, c)))
  );
  if (matches.length >= 1) return matches[0].id;
  return coverageRegion || fallbackRegion;
}

export type ServiceRegionPayload = {
  region_id: string;
  coverage_communes: string[] | undefined;
};

/**
 * El backend valida que `comuna` pertenezca a `region_id` (región de oferta).
 * Si la comuna de origen/domicilio está en otra región, usamos una comuna de cobertura
 * (misma región que region_id) para que el POST no falle.
 */
export function resolveComunaForOfferRegionApi(
  originComunaCanonical: string,
  offerRegionId: string,
  coverageCommunesCanonical: string[] | undefined
): { comuna: string; usedCoverageFallback: boolean } | { error: string } {
  const rid = String(offerRegionId);
  const inOffer = canonicalizeCommuneInRegion(originComunaCanonical, rid);
  if (inOffer) {
    return { comuna: inOffer, usedCoverageFallback: false };
  }

  if (coverageCommunesCanonical && coverageCommunesCanonical.length > 0) {
    const first = coverageCommunesCanonical[0];
    const canon = canonicalizeCommuneInRegion(first, rid) ?? first;
    return { comuna: canon, usedCoverageFallback: true };
  }

  return {
    error:
      'Tu comuna de origen no está en la región donde ofreces el servicio. En “Zona de cobertura” marca al menos una comuna de esa región, o cambia la ubicación de origen.',
  };
}

/**
 * Único punto para armar region_id + cobertura hacia el API.
 * Evita enviar comunas de una región con region_id de otra.
 */
export function buildServiceRegionPayload(
  coverageRegion: string,
  coverageCommunes: string[],
  fallbackRegion: string
): { payload: ServiceRegionPayload; error?: string } {
  const cleaned =
    coverageRegion.length > 0
      ? filterCommunesToRegion(coverageCommunes, coverageRegion)
      : [...coverageCommunes];

  const region_id = resolveRegionIdForCoverage(cleaned, coverageRegion, fallbackRegion);

  const aligned =
    cleaned.length > 0 ? filterCommunesToRegion(cleaned, region_id) : [];

  if (cleaned.length > 0 && aligned.length === 0) {
    return {
      payload: { region_id: fallbackRegion, coverage_communes: undefined },
      error:
        'Las comunas de cobertura no coinciden con la región seleccionada. Elige de nuevo la región y marca las comunas.',
    };
  }

  if (import.meta.env.DEV && aligned.length > 0 && !communesBelongToRegion(aligned, region_id)) {
    console.error('[buildServiceRegionPayload] Inconsistencia interna', { aligned, region_id });
  }

  return {
    payload: {
      region_id,
      coverage_communes: aligned.length > 0 ? aligned : undefined,
    },
  };
}
