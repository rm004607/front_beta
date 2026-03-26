import { regionsAPI } from '@/lib/api';

export type RegionOption = { id: string; name: string };

/**
 * Regiones tal cual la BD (`GET /api/regions`): el `id` es la PK numérica del backend,
 * no el ordinal de chile-data (en esta app RM puede ser 15, no 13).
 */
export async function loadRegionOptionsSorted(): Promise<RegionOption[]> {
  const res = await regionsAPI.getRegions();
  const list = (res.regions ?? []).map((r) => ({ id: String(r.id), name: r.name }));
  list.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  return list;
}
