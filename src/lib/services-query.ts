import type { QueryClient } from '@tanstack/react-query';

/** Prefijo de queries de listado GET /services (invalidar tras crear/editar para datos enriquecidos del backend). */
export const SERVICES_LIST_QUERY_PREFIX = ['services', 'list'] as const;

export function invalidateServicesListQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: [...SERVICES_LIST_QUERY_PREFIX] });
}
