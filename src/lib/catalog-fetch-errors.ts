/**
 * Errores al cargar catálogo público (regiones / comunas).
 * 5xx o fallo de red (sin respuesta útil) → mensaje orientado a reintento.
 */
export function catalogFetchUserMessage(err: unknown): string {
  if (err != null && typeof err === 'object' && (err as { name?: string }).name === 'AbortError') {
    return 'La solicitud se canceló.';
  }
  if (err instanceof TypeError) {
    return 'No hubo respuesta del servidor o falló la conexión. Comprueba tu red e inténtalo de nuevo.';
  }
  if (err != null && typeof err === 'object' && 'status' in err) {
    const status = Number((err as { status?: number }).status);
    if (Number.isFinite(status) && status >= 500) {
      return 'El servidor respondió con error. Suele ser temporal; puedes reintentar en unos segundos.';
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'No pudimos cargar los datos. Inténtalo de nuevo.';
}
