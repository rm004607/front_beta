import { chileData } from '@/lib/chile-data';

export function getCommunesForRegion(regionId: string): string[] {
  return chileData.find((r) => String(r.id) === String(regionId))?.communes ?? [];
}

export function communesBelongToRegion(communeNames: string[], regionId: string): boolean {
  if (communeNames.length === 0) return true;
  const allowed = getCommunesForRegion(regionId);
  return communeNames.every((c) => allowed.includes(c));
}

/** Quita comunas que no pertenecen a la región elegida (evita datos huérfanos al cambiar de región). */
export function filterCommunesToRegion(communeNames: string[], regionId: string): string[] {
  const allowed = new Set(getCommunesForRegion(regionId));
  return communeNames.filter((c) => allowed.has(c));
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
    if (coverageCommunes.every((c) => allowed.includes(c))) {
      return coverageRegion;
    }
  }
  const matches = chileData.filter((reg) =>
    coverageCommunes.every((c) => reg.communes.includes(c))
  );
  if (matches.length >= 1) return matches[0].id;
  return coverageRegion || fallbackRegion;
}

export type ServiceRegionPayload = {
  region_id: string;
  coverage_communes: string[] | undefined;
};

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
