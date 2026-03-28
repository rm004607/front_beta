# Backend: fotos opcionales en servicios (Cloudflare R2 / CDN)

Usa este documento como especificación para implementar o ajustar el endpoint **`POST /services`** cuando el cliente envía **multipart/form-data** con imágenes.

## Comportamiento esperado (alineado al front `front_beta`)

1. **JSON (sin cambios)**  
   Si la petición es `application/json` con el cuerpo actual, el comportamiento debe seguir igual (sin imágenes).

2. **Multipart**  
   Si la petición es `multipart/form-data`, el backend debe aceptar los mismos campos que antes, pero como partes de formulario:

   | Campo | Tipo | Notas |
   |-------|------|--------|
   | `service_name` | string | |
   | `description` | string | |
   | `comuna` | string | |
   | `phone` | string | opcional |
   | `region_id` | string | opcional |
   | `coverage_communes` | string JSON | array de strings, ej. `["Santiago","Ñuñoa"]` |
   | `service_type_ids` | string JSON | array de ids, ej. `["uuid-1"]` |
   | `custom_service_name` | string | opcional |
   | `price_range` | string | opcional |
   | `images` | file | **repetir la clave** `images` hasta **5 archivos** (convención típica multer: `.array('images', 5)`). |

3. **Límites**
   - Máximo **5** imágenes por servicio.
   - Tipos MIME recomendados: `image/jpeg`, `image/png`, `image/webp` (el front también permite `gif`; podéis rechazar gif si queréis ahorrar espacio).
   - Tamaño máximo por archivo razonable (ej. 8–10 MB **antes** de comprimir en servidor).

4. **Procesamiento y almacenamiento (Cloudflare R2 u otro objeto storage)**
   - Tras validar, **redimensionar y comprimir** cada imagen en servidor (p. ej. WebP o JPEG calidad ~80, ancho máximo 1600–1920 px) para **optimizar almacenamiento y ancho de banda**.
   - Generar URLs públicas HTTPS (o paths detrás del dominio CDN) y guardarlas en BD asociadas al servicio, en **orden estable** (índice 0 = portada / primera en listados).

5. **Respuesta**
   - El objeto `service` devuelto puede incluir `image_urls: string[]` en el mismo orden, para que el front las muestre en tarjetas y detalle.

6. **Listados públicos**
   - `GET /services` y respuestas relacionadas deben incluir `image_urls` (o al menos la primera URL) cuando existan, para que la vista de listado muestre la portada.

7. **Seguridad**
   - Autenticación igual que el POST JSON actual.
   - Validar tipo real del archivo (magic bytes), no solo extensión.
   - Opcional: antivirus / rate limit por usuario.

## Notas

- El front **no** comprime antes de subir (solo valida cantidad y tamaño aproximado); la **compresión definitiva** debe ser responsabilidad del backend antes de subir a R2.
- Si el backend aún no está listo, el front seguirá enviando **JSON** cuando no hay fotos; con fotos enviará multipart y fallará hasta que implementéis el handler.
