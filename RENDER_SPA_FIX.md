# Solución para Error "Not Found" al Refrescar en Render.com

## Problema
Al refrescar (F5) en rutas como `/muro`, `/servicios`, etc., aparece "Not Found" en lugar de la página correcta.

## Solución

### 1. Verificar Configuración en Render.com

En el dashboard de Render.com, verifica que tu servicio esté configurado como **Web Service** (Node.js) y NO como **Static Site**.

**Pasos:**
1. Ve a tu servicio en Render.com
2. Ve a **Settings**
3. Verifica que:
   - **Environment**: `node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Root Directory**: (dejar vacío o poner `.`)

### 2. Si está configurado como Static Site

Si tu servicio está como "Static Site", necesitas cambiarlo:

1. **Opción A: Crear nuevo servicio Web Service**
   - Crea un nuevo servicio
   - Selecciona "Web Service"
   - Conecta tu repositorio
   - Usa la configuración del `render.yaml`

2. **Opción B: Usar render.yaml**
   - Asegúrate de que `render.yaml` esté en la raíz del repositorio
   - Render.com debería detectarlo automáticamente
   - Si no, ve a Settings → Advanced → Config File y especifica `render.yaml`

### 3. Verificar que el servidor funciona localmente

```bash
# Instalar dependencias
npm install

# Construir la aplicación
npm run build

# Iniciar el servidor
npm start
```

Luego prueba acceder a `http://localhost:8080/muro` y refrescar (F5). Debería funcionar.

### 4. Verificar logs en Render.com

Ve a **Logs** en tu servicio de Render.com y verifica:
- Que el servidor se inicia correctamente: `Server is running on port...`
- Que no hay errores al servir archivos
- Que el build se completa exitosamente

### 5. Forzar nuevo despliegue

Después de hacer los cambios:
1. Haz commit y push de los cambios
2. En Render.com, ve a **Manual Deploy** → **Deploy latest commit**
3. Espera a que termine el build y deploy

## Archivos Importantes

- ✅ `server.js` - Servidor Express que maneja las rutas SPA
- ✅ `render.yaml` - Configuración de Render.com
- ✅ `package.json` - Scripts y dependencias (incluye `express` y script `start`)

## Verificación Final

Después del despliegue, prueba:
1. Ir a `https://fron-beta.onrender.com/muro`
2. Presionar F5 (refrescar)
3. Debería mostrar la página del muro, NO "Not Found"

Si aún no funciona, verifica los logs en Render.com para ver qué error está ocurriendo.


