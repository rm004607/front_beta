# Handoff Backend — Registro por teléfono (usuario normal), Comunidades

Este documento describe **lo que el frontend ya hace** y **lo que necesita del backend** para
completar las nuevas funcionalidades. Escrito para pasar al Claude Code del backend de Dameldato.

Contexto: en el front, `VITE_API_URL` apunta al backend. El auth usa cookie httpOnly + `Bearer`
en `localStorage`. Roles numéricos: **1 = usuario normal**, **2 = emprendedor (prestador)**,
**3 = empresa**, 4 = admin, 5 = super-admin.

> IMPORTANTE: confirmar que **rol 1 = usuario normal/consumidor** (sin KYC). El equipo listó
> 2/3/4/5 pero no el 1. Si prefieren otro número, avisar para ajustar el front.

---

## 1. Registro/login por teléfono del "usuario normal" (rol 1) — YA implementado en el front

El registro ahora distingue dos caminos en `/registro`:

- **Prestador** (`rol: 2`): flujo actual sin cambios (nombre + RUT + región/comuna + KYC).
- **Usuario normal** (`rol: 1`): **sin contraseña, por teléfono, estilo WhatsApp**. Sin RUT,
  sin email, sin KYC. Puede crear/unirse a comunidades.

### Flujo del usuario normal (lo que hace el front)
1. **Ingresa teléfono** → `POST /auth/phone/send-code` con `{ "phone": "+569..." }`.
2. **Ingresa el código de 6 dígitos** → `POST /auth/phone/verify-code` con
   `{ "phone": "+569...", "code": "123456" }`.
   - Si el código es válido, el **backend crea la sesión** (cookie httpOnly) y, si el número es
     nuevo, **crea el usuario con `rol: 1`** (sin KYC).
   - La respuesta indica `is_new_user` para saber si falta pedir el nombre.
3. **Si es usuario nuevo**, el front pide el nombre y llama `PATCH /auth/profile` con
   `{ "name": "..." }` (endpoint ya existente). Si no es nuevo, entra directo.
4. La **sesión queda guardada en el dispositivo** → no vuelve a pedir código en ese equipo.
   Solo re-verifica si cambia de teléfono, borra cookies o entra desde otro dispositivo.

### Endpoints necesarios
- `POST /auth/phone/send-code` — body `{ phone }` →
  `{ "ok": true, "expires_in_seconds": 300 }`.
  Genera un código (6 dígitos), lo guarda **hasheado** con **TTL corto (~5 min)**, y lo envía
  por **SMS o WhatsApp** (Twilio / Meta Cloud API). **Rate-limit por teléfono/IP** (evita que
  alguien spamee el número de otro). Costo: por mensaje enviado.
- `POST /auth/phone/verify-code` — body `{ phone, code }` →
  `{ "ok": true, "token": "...", "is_new_user": true|false, "user": { id, name?, phone, role_number } }`
  o `400 { "error": "Código inválido o expirado" }`.
  - En éxito: **crear sesión** (cookie httpOnly; opcionalmente `token` para el `localStorage`).
  - Si el teléfono no existía: **crear usuario `rol: 1`**, `phone_verified: true`, sin KYC.
  - Límite de intentos por código; invalidar el código tras usarlo.
- `PATCH /auth/profile` (ya existe) debe aceptar `{ name }` para el usuario recién creado.
- `GET /auth/me` debe devolver estos usuarios con `role_number: 1` y **sin exigir KYC**
  (`kyc_completed: true` o equivalente). El front ya evita el redirect a KYC para roles ≠ 2,3.

### Notas de seguridad / producto
- La sesión persistente resuelve "no pedir código cada vez"; el código resuelve "que sea su
  número" (el código llega solo al teléfono real).
- **No se puede leer la agenda de contactos desde la web** (solo una app nativa). Para mostrar
  "quién te invitó", se usa el **nombre** que cada usuario definió, no la agenda.
- Riesgos conocidos de OTP (SIM swap, reciclaje de números): aceptables para este caso;
  mitigar con rate-limit e invalidación de código.

---

## 2. Comunidades (modelo genérico)

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

### Feed de recomendaciones (el front YA lo llama — PENDIENTE en backend)
Dentro de la comunidad, los miembros recomiendan servicios/prestadores de confianza.
- `GET  /api/communities/:id/recommendations` (auth, miembro) →
  `{ recommendations: Recommendation[] }`
- `POST /api/communities/:id/recommendations` (auth, miembro) —
  body `{ title?, text, contact_name?, contact_phone? }` → `{ recommendation }`

`Recommendation`: `{ id, community_id, user_id, author_name, title?, text,
contact_name?, contact_phone?, created_at }`.
- `author_name`: nombre del miembro que publicó (para mostrar "por Fulano").
- `contact_phone`: el front arma un botón de WhatsApp (`wa.me/<dígitos>`).
- Solo miembros de la comunidad pueden ver/publicar. Sanitizar `text/title`.

> Con esto Comunidades queda completa: crear, invitar por link, unirse y
> **recomendar servicios dentro del grupo** (el core del producto).

### Foro — Fase 3 (el front YA lo llama — PENDIENTE en backend)
Convierte la comunidad en un foro: votar recomendaciones y comentar.
- `POST /api/communities/:id/recommendations/:recId/upvote` (auth, miembro) →
  `{ upvoted: boolean, upvotes_count: number }`. **Toggle**: si ya votó, quita el voto.
- `GET  /api/communities/:id/recommendations/:recId/comments` (auth, miembro) →
  `{ comments: Comment[] }`
- `POST /api/communities/:id/recommendations/:recId/comments` (auth, miembro) —
  body `{ text }` → `{ comment }`

`Comment`: `{ id, recommendation_id, user_id, author_name, text, created_at }`.
Además, el `GET .../recommendations` debería incluir en cada reco:
`upvotes_count`, `has_upvoted` (del usuario actual) y `comments_count` — para pintar
los contadores sin llamadas extra. Tabla sugerida `recommendation_upvotes
(recommendation_id, user_id, UNIQUE)` y `recommendation_comments`.

> Fase 3 futura (opcional): tags/categorías dentro de la comunidad y
> notificaciones cuando responden o recomiendan tu rubro.

---

## 3. Login con Apple (fase 2)

- `GET /auth/apple` (redirect OAuth) + callback, análogo a `/auth/google`. Debe dejar
  cookie/token igual que Google.
- Apple puede entregar un **email de relay privado**; guardar el email que Apple provea.
- El front añadirá un botón "Continuar con Apple" idéntico al de Google.

---

## Resumen: qué ya hace el front vs. qué falta

| Área | Front (hecho) | Backend (necesario) |
|------|---------------|---------------------|
| Registro usuario normal | Pantalla de selección + flujo teléfono→código→nombre (UI completa) | ✅ HECHO: `/auth/phone/send-code` y `/auth/phone/verify-code` |
| Login de vecino | Botón "Ingresar con mi teléfono" en `/login` y `/registro?tipo=vecino` | Nada nuevo: reutiliza `verify-code` (si `is_new_user=false`, entra directo) |
| KYC | No fuerza KYC a roles ≠ 2,3 | ✅ `kyc_completed: true` para rol 1 |
| **Comunidades** | **UI completa** (crear, invitar por link con vencimiento, unirse) | **PENDIENTE: tablas + endpoints de §2** (el front ya los llama con el contrato de ahí) |
| Apple login | Pendiente (botón) | `/auth/apple` + callback |

> Estado actual: A + B verificados en producción. **Lo que sigue es la sección 2 (Comunidades)** — el front ya está construido y esperando esos endpoints.
