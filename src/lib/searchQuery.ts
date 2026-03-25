/**
 * Prepara el texto de búsqueda para enviarlo al backend (sin IA).
 * Colapsa espacios y puntuación ruidosa; mantiene tildes (el backend puede usar unaccent/ILIKE).
 * No envía consultas de un solo carácter para evitar listados ruidosos.
 */
export function normalizeSearchQuery(raw: string): string | undefined {
  const collapsed = raw
    .replace(/[,;:!?¿¡.·…'"()[\]{}]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (collapsed.length < 2) return undefined;
  return collapsed;
}
