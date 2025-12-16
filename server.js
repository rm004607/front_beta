import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
// Render.com asigna el puerto automáticamente
const PORT = process.env.PORT || 8080;

// Servir archivos estáticos desde la carpeta dist
const distPath = join(__dirname, 'dist');
app.use(express.static(distPath, {
  maxAge: '1y',
  etag: true
}));

// Manejar todas las rutas de la SPA - debe ir después de express.static
app.get('*', (req, res, next) => {
  const indexPath = join(distPath, 'index.html');
  
  // Verificar que el archivo existe
  if (!existsSync(indexPath)) {
    console.error('index.html not found in dist folder');
    return res.status(500).send('Application not built correctly');
  }
  
  // Enviar index.html para todas las rutas (SPA routing)
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sending index.html:', err);
      res.status(500).send('Error loading application');
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving files from: ${distPath}`);
});

