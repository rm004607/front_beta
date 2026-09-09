# Mejorar las respuestas del chat IA — spec para el backend

Endpoint actual: `POST /api/ai/chat`
Request hoy: `{ message: string }`
Response hoy: `{ answer: string, cards?: [{ type, id, title, subtitle, details, url }] }`

Objetivo: que el asistente responda como un vecino que cacha, corto y útil, y que
siempre que pueda devuelva servicios REALES de Dameldato como `cards` (no invente).

---

## 1) Aceptar historial (para que sea conversacional)

Hoy cada mensaje llega solo, sin memoria. Si la IA pregunta "¿en qué comuna?" y el
usuario responde "Ñuñoa", el back no tiene contexto. Cambio pedido:

Request nuevo (retrocompatible — si no viene `history`, funciona igual):
```json
{
  "message": "en Ñuñoa",
  "history": [
    { "role": "user", "content": "busco un gasfiter" },
    { "role": "assistant", "content": "¿En qué comuna lo necesitas?" }
  ]
}
```
Mandar al modelo: system prompt + history + message. Con 6–8 turnos basta.

---

## 2) System prompt sugerido (español, tono chileno, conciso)

```
Eres el asistente de Dameldato.com, una plataforma chilena donde se encuentran
servicios de confianza cerca (gásfiter, electricista, clases, belleza, etc.).

Tu trabajo: entender qué necesita la persona y mostrarle servicios REALES de la
plataforma que le sirvan. Hablas cercano y chileno, pero claro y breve (2–3 frases
máximo). No usas emojis en exceso (uno ocasional está bien).

Reglas:
- NUNCA inventes servicios, nombres, teléfonos ni precios. Solo puedes recomendar
  servicios que vienen en la lista de CONTEXTO que te entrego en cada consulta.
- Si la persona es vaga ("necesito ayuda", "un maestro"), haz UNA sola pregunta corta
  para acotar: el rubro o la comuna. No hagas interrogatorios.
- Si tienes servicios que calzan, preséntalos en 1 frase y deja que las tarjetas
  (cards) muestren el detalle. Ej: "Te encontré 2 gásfiter en Ñuñoa, mira:".
- Si NO hay servicios que calcen en el contexto, dilo con honestidad y ofrece publicar
  un pedido: "Por ahora no tengo un [rubro] en [comuna]. Puedes publicar un pedido y
  te contactan los prestadores del rubro." (el front muestra el botón).
- No prometas tiempos, garantías ni precios que no estén en los datos.
- Si preguntan algo fuera de Dameldato (algo no relacionado con buscar servicios),
  responde amable y reencáusala a "¿qué servicio necesitas?".
```

## 3) Contexto que hay que inyectarle (clave para no inventar)

Antes de llamar al modelo, filtrar en la BD por rubro/comuna detectados y pasarle SOLO
los servicios relevantes (no todo el catálogo — ahorra tokens y evita alucinaciones).
Por cada servicio: id, nombre, rubro, comuna, rango de precio, 1 línea de descripción.
De ahí el modelo elige cuáles van como `cards` (usar el mismo `id` real para el link).

## 4) Modelo y costo

- Usar `gpt-4o-mini` (barato y suficiente para esto). A 200 mensajes/día ~US$3–5/mes.
- Filtrar servicios antes de mandar (punto 3) mantiene el costo y la calidad.

## 5) Manejo de errores

- Si el modelo no está configurado o falla, responder 200 con un `answer` amable tipo
  "Ando con un problemita, intenta de nuevo en un momento" en vez de 500, para que el
  widget no muestre error técnico. (Opcional pero mejora la experiencia.)
```
