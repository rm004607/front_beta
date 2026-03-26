function normalizeLabel(s: string): string {
  return s.normalize('NFC').trim();
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '');
}

/** Misma comuna aunque varíe mayúsculas o espacios. */
export function communesMatch(a: string, b: string): boolean {
  const x = normalizeLabel(a);
  const y = normalizeLabel(b);
  if (x === y) return true;
  if (x.localeCompare(y, 'es', { sensitivity: 'accent' }) === 0) return true;
  return stripAccents(x).toLowerCase() === stripAccents(y).toLowerCase();
}

/**
 * Ubicación de origen: la comuna no tiene que figurar en el catálogo de la región elegida.
 * El usuario elige región y comuna en la UI; enviamos esos valores tal cual (normalizados NFC).
 *
 * @param _catalog reservado por compatibilidad con llamadas existentes; ya no se usa.
 */
export function resolveOriginLocation(
  comunaRaw: string,
  baseRegionId: string,
  _catalog?: Record<string, string[]>
): { region_id: string; comuna: string } | { error: string } {
  const trimmed = normalizeLabel(comunaRaw);
  if (!trimmed) return { error: 'Indica una comuna de origen válida.' };

  const rid = String(baseRegionId || '').trim();
  if (!rid) {
    return { error: 'Selecciona una región.' };
  }
  return { region_id: rid, comuna: trimmed };
}

export type ServiceRegionPayload = {
  region_id: string;
  coverage_communes: string[] | undefined;
};

/**
 * `comuna` del API: primera comuna de cobertura si hay lista; si no, comuna de origen.
 * No se exige que pertenezcan al listado de la región de oferta.
 */
export function resolveComunaForOfferRegionApi(
  originComunaCanonical: string,
  _offerRegionId: string,
  coverageCommunesCanonical: string[] | undefined,
  _catalog?: Record<string, string[]>
): { comuna: string; usedCoverageFallback: boolean } | { error: string } {
  if (coverageCommunesCanonical && coverageCommunesCanonical.length > 0) {
    const first = normalizeLabel(coverageCommunesCanonical[0]);
    if (!first) {
      return { error: 'Indica al menos una comuna de cobertura válida.' };
    }
    const origin = normalizeLabel(originComunaCanonical);
    const usedCoverageFallback = !origin || !communesMatch(first, origin);
    return { comuna: first, usedCoverageFallback };
  }
  const o = normalizeLabel(originComunaCanonical);
  if (!o) {
    return { error: 'Indica una comuna de origen válida.' };
  }
  return { comuna: o, usedCoverageFallback: false };
}

/**
 * Arma region_id + cobertura sin filtrar comunas por región (pueden mezclarse listados en UI).
 */
export function buildServiceRegionPayload(
  coverageRegion: string,
  coverageCommunes: string[],
  fallbackRegion: string,
  _catalog?: Record<string, string[]>
): { payload: ServiceRegionPayload; error?: string } {
  const normalized = [
    ...new Set(coverageCommunes.map((c) => normalizeLabel(c)).filter(Boolean)),
  ];

  if (normalized.length === 0) {
    const fb = String(fallbackRegion || '').trim();
    if (!fb) {
      return {
        payload: { region_id: '', coverage_communes: undefined },
        error: 'Falta la región de oferta.',
      };
    }
    return {
      payload: { region_id: fb, coverage_communes: undefined },
    };
  }

  const cr = String(coverageRegion || '').trim();
  const fb = String(fallbackRegion || '').trim();
  const region_id = cr || fb;
  if (!region_id) {
    return {
      payload: { region_id: '', coverage_communes: undefined },
      error: 'Falta la región de oferta.',
    };
  }

  return {
    payload: {
      region_id,
      coverage_communes: normalized,
    },
  };
}
