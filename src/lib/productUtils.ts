export type ProductStatus = 'new' | 'used' | 'refurbished';

export const PRODUCT_STATUS_OPTIONS: Array<{ value: ProductStatus; label: string }> = [
  { value: 'new', label: 'Nuevo' },
  { value: 'used', label: 'Usado' },
  { value: 'refurbished', label: 'Reacondicionado' },
];

export function getProductStatusLabel(status?: string): string {
  return PRODUCT_STATUS_OPTIONS.find((item) => item.value === status)?.label || 'Sin estado';
}

/** Quita HTML básico por si el backend guarda rich text. */
function stripHtmlToPlainText(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const DESCRIPTION_KEY_CANDIDATES = [
  'description',
  'descripcion',
  'product_description',
  'summary',
  'short_description',
  'shortDescription',
  'desc',
  'body',
  'details',
  'detail',
  'text',
  'content',
  'notes',
  'snippet',
  'excerpt',
] as const;

function getStringFieldLoose(obj: Record<string, unknown>, canonical: string): string | undefined {
  const hit = Object.keys(obj).find((k) => k.toLowerCase() === canonical.toLowerCase());
  if (hit === undefined) return undefined;
  const v = obj[hit];
  return typeof v === 'string' ? v : undefined;
}

/**
 * Texto para tarjetas y listados: el API puede usar otro nombre de campo u omitir `description` en el índice.
 */
export function resolveProductDescription(
  product: Record<string, unknown> | { description?: string | null; summary?: string | null; short_description?: string | null }
): string {
  const obj =
    product && typeof product === 'object' ? (product as Record<string, unknown>) : {};

  const tryRecord = (rec: Record<string, unknown>): string => {
    for (const key of DESCRIPTION_KEY_CANDIDATES) {
      const raw = getStringFieldLoose(rec, key);
      if (raw == null) continue;
      const plain = stripHtmlToPlainText(raw);
      if (plain) return plain;
    }
    return '';
  };

  const fromRoot = tryRecord(obj);
  if (fromRoot) return fromRoot;

  for (const wrap of ['data', 'product', 'attributes']) {
    const inner = obj[wrap];
    if (!inner || typeof inner !== 'object' || Array.isArray(inner)) continue;
    const nested = tryRecord(inner as Record<string, unknown>);
    if (nested) return nested;
  }

  return '';
}

export function formatProductPrice(price?: number | null, currency = 'CLP'): string {
  if (price == null || Number.isNaN(Number(price))) return 'Precio a convenir';
  try {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'CLP' ? 0 : 2,
    }).format(Number(price));
  } catch {
    return `${Number(price)} ${currency}`;
  }
}

export function getProductCoverImage(product: {
  cover_image_url?: string | null;
  images?: Array<{ image_url: string; sort_order?: number }>;
}): string | null {
  if (product.cover_image_url) return product.cover_image_url;
  const sorted = [...(product.images || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  return sorted[0]?.image_url || null;
}
