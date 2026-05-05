# Dameldato — frontend

Web pública y panel (React + Vite + TypeScript). El API vive en otro servicio; aquí solo el cliente.

## Requisitos

- Node.js 20+ (recomendado)
- Variables en `.env` según `.env.example` (p. ej. `VITE_API_URL`)

## Scripts

| Comando        | Uso                                      |
|----------------|------------------------------------------|
| `npm run dev`  | Desarrollo (Vite)                        |
| `npm run build`| Build de producción → carpeta `dist/`   |
| `npm run preview` | Servir el build localmente (Vite)    |
| `npm run start` | Servir `dist/` con Node (`server.js`) — típico en Render u otro PaaS |
| `npm run lint` | ESLint                                   |

Si Vite se comporta raro con dependencias, borra `node_modules/.vite` y vuelve a `npm run dev`.

## Despliegue

Tras `npm run build`, los estáticos están en `dist/`. En producción suele usarse `npm start` (Express + Helmet + SPA fallback) como en `render.yaml`.
