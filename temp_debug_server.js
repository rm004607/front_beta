const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

const API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnQiOiJSYW3Ds24gRWR1YXJkbyBNb2xpbmEgRmllcnJvIiwicGxhbiI6ImZyZWUiLCJhZGRvbnMiOiIiLCJleGNsdWRlcyI6IiIsInRhdGUiOiI1eDEwIiwiY3VzdG9tIjp7ImRvY3VtZW50X251bWJlcl9kYWlseV9saW1pdCI6MTAsInBsYXRlc19kYWlseV9saW1pdCI6MH0sImlhdCI6MTc3MjQ1NTIyMiwiZXhwIjoxNzc1MDQ3MjIyfQ.G3JvxDxpDg8TLxgvqJ-r0tmSGevgjLFDeC7VNijmXrA';
const API_BASE_URL = 'https://api.boostr.cl/rut/name/';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/api/verify/:rut', (req, res) => {
    const rut = req.params.rut;
    const url = `${API_BASE_URL}${rut}.json`;

    console.log(`Verificando RUT (vía curl): ${rut}`);

    // Usamos curl directamente porque Cloudflare bloquea el fetch de Node.js
    const command = `curl -s -X GET "${url}" -H "Authorization: Bearer ${API_TOKEN}" -H "Accept: application/json"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error('Error ejecutando curl:', error);
            return res.status(502).json({ error: 'No se pudo conectar con el servidor de Boostr.' });
        }

        try {
            const result = JSON.parse(stdout);
            console.log('Respuesta recibida:', result.status);
            res.json(result);
        } catch (parseError) {
            console.error('Error al parsear respuesta:', stdout);
            // Si Cloudflare bloquea, stdout tendrá el HTML de error
            if (stdout.includes('Cloudflare') || stdout.includes('403 Forbidden')) {
                return res.status(403).json({ error: 'Acceso bloqueado por Cloudflare. Intenta más tarde.' });
            }
            res.status(502).json({ error: 'La API devolvió un formato inválido.' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`\x1b[32m%s\x1b[0m`, `✓ Servidor de validación activo en http://localhost:${PORT}`);
    console.log(`Bypass activado: Usando curl para llamadas externas.`);
});
