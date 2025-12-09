# Instrucciones para Configurar Flow Payment

## 1. Configurar Base de Datos

Ejecuta el siguiente script SQL en tu base de datos MySQL para crear la tabla de pagos:

```bash
mysql -u root -p pega_ya < backend/create_payments_table.sql
```

O ejecuta manualmente:

```sql
-- Create payments table to track Flow transactions
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  package_id VARCHAR(50) NOT NULL,
  package_type ENUM('services', 'jobs') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  flow_token VARCHAR(255) UNIQUE,
  flow_order VARCHAR(255),
  status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  publications_added INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_payments (user_id),
  INDEX idx_flow_token (flow_token),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add purchased publications columns to users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS purchased_services INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS purchased_jobs INT DEFAULT 0;
```

## 2. Configurar Variables de Entorno

Ya agregaste las credenciales en el archivo `.env` del backend:

```bash
FLOW_API_KEY=45D6F244-DCFA-4C7F-88E7-9643806DFLBF
FLOW_SECRET_KEY=7e539327c195f75cdae2b886008788d9afc46cff
FLOW_API_URL=https://www.flow.cl/api
```

También necesitas configurar la URL del backend si no está configurada:

```bash
BACKEND_URL=http://localhost:3000
```

## 3. Reiniciar el Servidor

Si el servidor backend está corriendo, reinícialo para cargar las nuevas variables de entorno y las rutas de Flow:

```bash
# Ctrl+C para detener el servidor actual
npm run dev
```

## 4. Probar la Integración

1. **Inicia sesión** en la aplicación
2. Navega a **Publicar Servicio** o **Publicar Empleo**
3. Si has alcanzado el límite gratuito, se abrirá el modal de paquetes
4. **Selecciona un paquete** - serás redirigido a Flow para completar el pago
5. Completa el pago en Flow (o cancela para probar el flujo de cancelación)
6. Serás redirigido de vuelta a la aplicación en `/flow/callback`
7. La página mostrará el estado del pago
8. Si el pago fue exitoso, tus publicaciones adicionales se habrán activado

## 5. Verificar Límites de Usuario

Para verificar que las publicaciones adicionales se agregaron correctamente después de un pago exitoso:

```bash
# Ejemplo de consulta SQL
SELECT 
    u.id, 
    u.name, 
    u.email,
    u.purchased_services,
    u.purchased_jobs,
    COUNT(p.id) as total_payments,
    SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as completed_payments
FROM users u
LEFT JOIN payments p ON u.id = p.user_id
WHERE u.id = 'TU_USER_ID'
GROUP BY u.id;
```

## 6. Configurar Webhook en Flow (Producción)

Para producción, debes configurar la URL del webhook en tu panel de Flow:

1. Inicia sesión en [flow.cl](https://www.flow.cl)
2. Ve a **Integración** > **Configuración**
3. Configura la URL de confirmación: `https://tu-dominio.com/api/flow/confirm`
4. Esta URL debe ser pública y accesible desde los servidores de Flow

## 7. Testing con Sandbox (Opcional)

Si quieres usar el entorno sandbox de Flow para pruebas:

1. Crea una cuenta en [sandbox.flow.cl](https://sandbox.flow.cl)
2. Obtén las credenciales de sandbox
3. Actualiza el `.env`:
   ```bash
   FLOW_API_URL=https://sandbox.flow.cl/api
   FLOW_API_KEY=tu_api_key_sandbox
   FLOW_SECRET_KEY=tu_secret_key_sandbox
   ```

## Notas Importantes

- ⚠️ **Webhook**: En desarrollo local, Flow no podrá llamar al webhook de confirmación. Usa ngrok o un servidor público para pruebas completas.
- 💳 **Métodos de pago**: Flow soporta tarjetas de débito/crédito y transferencias bancarias
- 🔒 **Seguridad**: Las credenciales en `.env` nunca deben subirse a git (ya están en `.gitignore`)
- 📊 **Monitoreo**: Revisa la tabla `payments` en la base de datos para monitorear transacciones
