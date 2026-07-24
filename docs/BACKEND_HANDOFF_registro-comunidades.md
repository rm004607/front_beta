# Handoff Backend — Registro (usuario normal), Comunidades, Verificación WhatsApp

Este documento describe **lo que el frontend ya hace** y **lo que necesita del backend** para
completar las nuevas funcionalidades. Escrito para pasar al Claude Code del backend de Dameldato.

Contexto: en el front, `VITE_API_URL` apunta al backend. El auth usa cookie httpOnly + `Bearer`
en `localStorage`. Roles numéricos: **1 = usuario normal**, **2 = emprendedor (prestador)**,
**3 = empresa**, 4 = admin, 5 = super-admin.

---

## 1. Registro de "usuario normal" (rol 1) — YA implementado en el front

Hoy TODO registro se hacía como emprendedor (`rol: 2`) con KYC obligatorio. Ahora el front
distingue dos caminos en `/registro`:

- **Prestador** (`rol: 2`): flujo actual sin cambios (RUT + región/comuna + KYC).
- **Usuario normal** (`rol: 1`): registro liviano, **sin RUT, sin región/comuna, SIN KYC**.

### Qué hace el front para el usuario normal
1. `POST /auth/register` con body:
   ```json
   { "name": "...", "email": "...", "password": "...", "phone": "...",
     "rol": 1, "region_id": "", "comuna": "" }
   ```
   (Nota: `rut` **no se envía**; `region_id`/`comuna` pueden ir vacíos.)
2. Inmediatamente después, `POST /auth/login` con `{ email, password }` para iniciar sesión.
3. Redirige al home ya logueado.

### Qué necesito del backend
- `POST /auth/register` debe **aceptar `rol: 1` sin `rut`** (columna nullable) y sin exigir
  región/comuna.
- Para `rol: 1`: **no** crear requerimiento de KYC. Devolver el usuario con
  `kyc_completed: true` (o equivalente) para que `/auth/me` no lo mande a verificación.
- `POST /auth/login` debe **funcionar para `rol: 1` sin exigir KYC**.
- `GET /auth/me` sigue devolviendo `role_number`, `kyc_status`, `kyc_completed`.
- Seguir sanitizando `name/phone/email` con **prepared statements**. `rut` único **solo cuando
  viene presente**.
- Respuesta esperada de register (igual que hoy): `{ ok, message, registration_id? }`
  (`registration_id` puede ser null/omitirse para `rol: 1`).

---

## 2. Verificación de teléfono por WhatsApp (OTP)

El teléfono es el canal de contacto central (botón WhatsApp), así que hay que validar que el
número es real y del usuario. Vía **WhatsApp Business API** (Meta Cloud API o Twilio).

### Endpoints necesarios
- `POST /api/phone/send-otp` — body `{ "phone": "+569..." }` →
  `{ "ok": true, "expires_in_seconds": 300 }`. Envía OTP por WhatsApp. Rate-limit por
  teléfono/IP. Guardar el código **hasheado** con TTL corto (~5 min) y límite de intentos.
- `POST /api/phone/verify-otp` — body `{ "phone": "+569...", "code": "123456" }` →
  `{ "ok": true, "verified": true }` o `400 { "error": "Código inválido o expirado" }`.
  Al validar, marcar `user.phone_verified = true`.
- `GET /auth/me` debe incluir `phone_verified: boolean`.

El front añadirá la UI de ingreso de código cuando estos endpoints existan.

---

## 3. Comunidades (modelo genérico)

Un usuario registrado crea una comunidad y queda como **admin de esa comunidad**. El admin
invita gente mediante **links con token** que pueden expirar **por tiempo y/o por número de
usos** (lo elige el admin).

### Modelo sugerido
- `communities`: `id, name, type (colegio|condominio|barrio|empresa|otro), description,
  created_by (user_id), created_at`
- `community_members`: `community_id, user_id, role (admin|member), joined_at`
- `community_invites`: `id, community_id, token (aleatorio), created_by, expires_at (nullable),
  max_uses (nullable), uses_count (default 0), revoked (bool), created_at`

### Endpoints necesarios (todos con auth salvo el preview del invite)
- `POST /api/communities` — body `{ name, type, description? }` → `{ community }`.
  El creador queda como `admin` en `community_members`.
- `GET  /api/communities/mine` → `{ communities: [...] }` (creadas o de las que soy miembro).
- `GET  /api/communities/:id` (miembro) → `{ community, my_role, members_count }`.
- `POST /api/communities/:id/invites` (admin) — body `{ expires_at?: ISO, max_uses?: int }` →
  `{ invite: { token, url, expires_at, max_uses } }`.
- `GET  /api/communities/invites/:token` (**público**, para preview antes de unirse) →
  `{ valid: bool, community: { id, name }, reason?: "expired|max_uses|revoked" }`.
- `POST /api/communities/invites/:token/accept` (auth) → `{ ok, community_id }`.
  Debe validar `expires_at`, `max_uses` vs `uses_count`, y `revoked`; e incrementar `uses_count`.
- `DELETE /api/communities/:id/invites/:inviteId` (admin) → `{ ok }` (revocar link).

### Reglas
- `token` aleatorio no adivinable (p. ej. 32+ chars).
- Validar expiración por **tiempo** y por **usos** en `accept`.
- Solo `admin` de la comunidad crea/revoca invites; solo miembros ven el contenido.

### Fase 2 (feed de recomendaciones dentro de la comunidad)
- `POST /api/communities/:id/recommendations` — body `{ service_id?, text }`.
- `GET  /api/communities/:id/recommendations` → listado.

---

## 4. Login con Apple (fase 2)

- `GET /auth/apple` (redirect OAuth) + callback, análogo a `/auth/google`. Debe dejar
  cookie/token igual que Google.
- Apple puede entregar un **email de relay privado**; guardar el email que Apple provea.
- El front añadirá un botón "Continuar con Apple" idéntico al de Google.

---

## Resumen: qué ya hace el front vs. qué falta

| Área | Front (hecho) | Backend (necesario) |
|------|---------------|---------------------|
| Registro usuario normal | Pantalla de selección + envía `rol 1` sin RUT/KYC + login inmediato | Aceptar `rol 1` sin RUT/KYC; login sin KYC |
| KYC | No fuerza KYC a roles ≠ 2,3 | `kyc_completed: true` para rol 1 |
| WhatsApp OTP | Pendiente (UI de código) | `send-otp` / `verify-otp` + `phone_verified` |
| Comunidades | Pendiente (UI) | Tablas + endpoints de comunidades e invites |
| Apple login | Pendiente (botón) | `/auth/apple` + callback |
