import type { UserProfile } from '@/contexts/UserContext';

/**
 * Pestaña "Dato insertado 1" (solo super admin): visible si el usuario coincide con Ramón Molina
 * o si su email está en `VITE_ADMIN_INSERT_SERVICE_EMAILS` (lista separada por comas).
 */
export function canShowAdminInsertServiceTab(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  const raw = import.meta.env.VITE_ADMIN_INSERT_SERVICE_EMAILS as string | undefined;
  if (raw?.trim()) {
    const allowed = new Set(
      raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    );
    if (user.email && allowed.has(user.email.toLowerCase())) return true;
  }
  const n = (user.name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  return n.includes('ramon') && n.includes('molina');
}
