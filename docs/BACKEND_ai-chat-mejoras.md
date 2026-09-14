# Mejorar las respuestas del chat IA — spec para el backend

Endpoint actual: `POST /api/ai/chat`
Request hoy: `{ message: string }`
Response hoy: `{ answer: string, cards?: [{ type, id, title, subtitle, details, url }] }`

Objetivo: que el asistente responda como un vecino que cacha, corto y útil, y que
siempre que pueda devuelva servicios REALES de Dameldato como `cards` (no invente).

---

## 0) GUARDARRAÍL DE ALCANCE — lo más importante (esto es lo que está fallando hoy)

Hoy el chat responde CUALQUIER cosa: da recetas de cocina, ofrece cursos de
programación, etc. Eso está mal. El asistente es SOLO un buscador de servicios de
Dameldato, no un ChatGPT de propósito general.

Regla dura: si el mensaje NO es una petición de encontrar/recomendar un servicio local,
el asistente NO responde el contenido y NO adjunta tarjetas al azar. Solo reencáusala,
en 1 frase, hacia buscar un servicio.

Ejemplos reales que hoy salen mal (deben cambiar):

- Usuario: "dame una receta de carne"
  MAL (hoy): entrega la receta completa con ingredientes y preparación.
  BIEN: "Jeje, de cocina no sé 😅, pero soy tu buscador de servicios de confianza.
  ¿Necesitas un cocinero, un banquetero o algo para tu casa?"

- Usuario: "quiero crear una función en Ford, enséñame un curso básico de programación"
  MAL (hoy): explica y además muestra tarjetas de "Clases particulares" que no calzan.
  BIEN: "Eso se escapa de lo mío. Puedo buscarte a alguien en Dameldato que haga clases
  de programación o soporte de PC. ¿En qué comuna o lo prefieres online?"
  (Si de verdad hay un servicio de clases de programación en el contexto, ahí sí lo
  muestras como card. Si no hay, no inventes ni muestres cards de otro rubro.)

Nunca adjuntar `cards` que no correspondan al rubro pedido. Sin match real → sin cards.

---

## 0.b) FILTRO DE VERDAD (no confiar solo en el prompt) — IMPORTANTE

El prompt es una instrucción que la IA PUEDE ignorar. Hay que poner un filtro real,
una capa de código que decide ANTES de responder si el mensaje es o no del rubro de
Dameldato. Así, aunque el modelo falle, el off-topic nunca recibe respuesta.

Flujo con filtro (2 capas):

1. CLASIFICADOR (capa 1, obligatoria). Antes de generar la respuesta, clasificar el
   mensaje: ¿es una petición de buscar/recomendar un servicio local? Se puede hacer con
   una llamada barata al modelo que devuelva JSON, por ejemplo:
   ```
   { "es_servicio": true/false, "rubro": "gasfiteria" | null, "comuna": "Ñuñoa" | null }
   ```
   - Si `es_servicio` = false  -> NO se llama a la generación normal. Se responde con un
     mensaje fijo de reencauce (sin cards). Ej: "Soy tu buscador de servicios de
     Dameldato. ¿Qué servicio necesitas?". Esto además ahorra tokens.
   - Si `es_servicio` = true   -> se sigue al paso 2.

2. GENERACIÓN (capa 2). Se buscan en la BD los servicios del rubro/comuna detectados,
   se inyectan como CONTEXTO y recién ahí se genera la respuesta con el system prompt.

Filtro de salida (capa 3, barata y muy efectiva): las `cards` NO las elige libremente el
modelo; el backend solo permite como card un servicio cuyo `id` esté en el CONTEXTO que
se le pasó. Si el modelo "inventa" o intenta colar otra, el back la descarta. Así nunca
salen tarjetas de un rubro que no se pidió.

(Opcional) Lista negra rápida de temas: si el mensaje matchea patrones claramente
ajenos —"receta", "código/programar", "chiste", "clima", "tarea"— se puede cortar de
inmediato en la capa 1 sin siquiera llamar al modelo.

Resumen: el prompt educa, pero el FILTRO (clasificador + validación de cards) es el que
garantiza el comportamiento. Ambos, no uno solo.

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
- ALCANCE: SOLO ayudas a encontrar servicios locales en Dameldato. NO respondes
  recetas, tareas, código, cursos, consejos generales ni nada ajeno a buscar un
  servicio. Si te piden algo así, NO lo respondas: en 1 frase amable reencáusala a
  "¿qué servicio necesitas?". No eres un asistente de propósito general.
- NUNCA inventes servicios, nombres, teléfonos ni precios. Solo puedes recomendar
  servicios que vienen en la lista de CONTEXTO que te entrego en cada consulta.
- NUNCA adjuntes tarjetas (cards) de un rubro distinto al que pidió la persona. Si no
  hay un servicio que calce de verdad en el contexto, no muestres ninguna card.
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
