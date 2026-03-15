# Prompt para Backend: Rutas 404 en registro (perfil y pending service)

## Problema 1: POST /api/services/pending → 404 (flujo email/contraseña)

En el flujo de registro **con email y contraseña**, al hacer "Finalizar Registro" (paso 4) el front llama **POST /api/services/pending** para guardar el perfil de emprendedor asociado al `registration_id`. Esa ruta devuelve **404**.

- **Error en front:** `Error updating entrepreneur profile: Error: Ruta no encontrada`
- **Petición:** `POST {API_BASE_URL}/api/services/pending`
- **Body:** `{ registration_id, service_name, description, rubro, portfolio }` (sin auth; el backend identifica por `registration_id`).

**Acción backend:** Exponer **POST /api/services/pending** que reciba ese body y cree/actualice el servicio pendiente para ese `registration_id`, o indicar la ruta correcta si es otra.

*(Mientras tanto, el front hace fallback a PATCH /auth/profile si el usuario tiene token.)*

---

## Problema 2: PATCH /auth/profile (flujo Google)

El frontend también usa **PATCH /auth/profile** cuando el usuario termina el registro (flujo Google) o cuando falla POST /api/services/pending y hay sesión.

---

## Lo que el frontend está llamando hoy

| Dato | Valor |
|------|--------|
| **Método** | `PATCH` |
| **URL** | `{API_BASE_URL}/auth/profile` (ej: `https://back-beta-1kdv.onrender.com/auth/profile`) |
| **Headers** | `Content-Type: application/json`, `Authorization: Bearer <token>` |
| **Body (ejemplo)** | `{ "rol": 2, "rubro": "...", "service": "...", "portfolio": "...", "experience": "..." }` |

El front puede enviar **solo algunos** de estos campos (actualización parcial). Siempre manda al menos `rol` cuando es el flujo de registro emprendedor.

---

## Lo que necesitamos en backend

Exponer **una ruta** que permita al **usuario autenticado** (por token/cookie) actualizar su perfil con los campos que envíe el front. Por ejemplo:

### Opción A – Ruta actual

- **Método:** `PATCH` (o `PUT`, si en backend usan PUT para actualizar perfil).
- **Path:** `/auth/profile`.
- **Auth:** Requerido (Bearer token o cookie de sesión).
- **Body (JSON):** aceptar al menos:
  - `rol` (number)
  - `rubro` (string, opcional)
  - `experience` (string, opcional)
  - `service` (string, opcional)
  - `portfolio` (string, opcional)
  - Y si ya existen: `name`, `phone`, `rut`, `comuna`, `region_id`, `profile_image`.

**Respuesta esperada (éxito):**

- Status: `200` (o `204` si no devuelven body).
- Si devuelven body, algo como: `{ "message": "Perfil actualizado", "user": { ... } }`.

**Errores:**

- `401` si no hay token o sesión válida.
- `400` si validación falla (ej. RUT inválido), con mensaje claro en el body.
- **No devolver 404** para esta funcionalidad; si la ruta es otra, indicarlo (ver abajo).

### Opción B – Otra ruta

Si en backend la actualización de perfil está en **otra ruta** (por ejemplo `/api/users/me`, `/api/auth/profile`, etc.) o con **otro método** (`PUT` en vez de `PATCH`):

1. Confirmar **método y path exactos** (ej: `PUT /api/users/me`).
2. Confirmar que aceptan los mismos campos (al menos `rol`, `rubro`, `experience`, `service`, `portfolio`).
3. Avisar al front para que cambie la URL y el método en el cliente y deje de recibir 404.

---

## Resumen para el desarrollador backend

- **Objetivo:** que “Finalizar Registro” (perfil de emprendedor) no devuelva 404.
- **Acción:** tener una ruta de actualización de perfil del usuario autenticado que:
  - Acepte `PATCH` (o `PUT`) a `/auth/profile` (o la ruta que decidan).
  - Reciba en el body campos como: `rol`, `rubro`, `experience`, `service`, `portfolio` (y los que ya tengan para perfil).
  - Responda con 2xx cuando la actualización sea correcta.
- Si la ruta o el método son distintos, indicar exactamente cuáles son para que el front los use y deje de llamar a la ruta que hoy devuelve 404.
