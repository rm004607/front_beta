/**
 * Orden del listado público de servicios por “calidad” de reseñas.
 * Combina rating medio con volumen (evita que un 5★ con 1 reseña gane siempre a un 4.7★ con 30).
 * Los sin reseñas quedan al final; empates por más reseñas y luego más recientes.
 */
export type ServiceReviewSortable = {
  id: string;
  average_rating?: number;
  reviews_count?: number;
  created_at?: string;
};

function reviewQualityScore(s: ServiceReviewSortable): number {
  const n = Math.max(0, Number(s.reviews_count) || 0);
  const raw = Number(s.average_rating);
  const avg = Number.isFinite(raw) && raw > 0 ? raw : 0;
  if (n === 0) return -1e6;
  const priorMean = 3.5;
  const priorWeight = 4;
  const bayesian = (avg * n + priorMean * priorWeight) / (n + priorWeight);
  return bayesian + Math.log1p(n) * 0.02;
}

export function compareServicesByReviewQuality(a: ServiceReviewSortable, b: ServiceReviewSortable): number {
  const qa = reviewQualityScore(a);
  const qb = reviewQualityScore(b);
  if (qb !== qa) return qb - qa;
  const na = Number(a.reviews_count) || 0;
  const nb = Number(b.reviews_count) || 0;
  if (nb !== na) return nb - na;
  const ra = Number(a.average_rating) || 0;
  const rb = Number(b.average_rating) || 0;
  if (rb !== ra) return rb - ra;
  const ta = new Date(a.created_at || 0).getTime();
  const tb = new Date(b.created_at || 0).getTime();
  return tb - ta;
}

export function sortServicesByReviewQuality<T extends ServiceReviewSortable>(list: T[]): T[] {
  return [...list].sort(compareServicesByReviewQuality);
}
