# 🚨 CORRECCIONES CRÍTICAS DE SEGURIDAD - BACKEND

## ⚠️ VULNERABILIDAD DETECTADA: SQL INJECTION

Se detectó que el formulario de registro permite inyectar comandos SQL a través de los campos `name` y `phone`. Los datos llegan sin sanitizar a la base de datos, permitiendo ejecutar comandos como `SLEEP()`, `DROP TABLE`, etc.

---

## 🔴 CORRECCIONES CRÍTICAS (BACKEND)

### 1. Usar Consultas Parametrizadas (Prepared Statements)

**NUNCA** concatenar strings para construir queries SQL. Usar siempre parámetros.

#### ❌ MAL (Vulnerable a SQL Injection):
```javascript
// NUNCA HACER ESTO
const query = `INSERT INTO users (name, email, phone) VALUES ('${name}', '${email}', '${phone}')`;
db.query(query);
```

#### ✅ BIEN (Seguro):
```javascript
// MySQL/MariaDB con mysql2
const query = 'INSERT INTO users (name, email, phone, comuna, password_hash, rol) VALUES (?, ?, ?, ?, ?, ?)';
await db.query(query, [name, email, phone, comuna, passwordHash, rol]);

// O con placeholders nombrados
const query = 'INSERT INTO users (name, email, phone, comuna, password_hash, rol) VALUES (@name, @email, @phone, @comuna, @password, @rol)';
await db.query(query, { name, email, phone, comuna, password: passwordHash, rol });
```

### 2. Validación y Sanitización en el Servidor

**NUNCA** confiar en la validación del frontend. Siempre validar en el backend.

```javascript
// Ejemplo de validación en el controlador de registro
const registerUser = async (req, res) => {
  const { name, email, phone, comuna, password, rol } = req.body;
  
  // 1. Validar tipos y presencia
  if (!name || !email || !phone || !comuna || !password || !rol) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  
  // 2. Validar formato de nombre (solo letras, espacios, acentos)
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/;
  if (!nameRegex.test(name) || name.length < 2 || name.length > 100) {
    return res.status(400).json({ error: 'Nombre inválido' });
  }
  
  // 3. Validar teléfono (solo números y caracteres permitidos)
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  const phoneDigits = phone.replace(/\D/g, '');
  if (!phoneRegex.test(phone) || phoneDigits.length < 8 || phoneDigits.length > 15) {
    return res.status(400).json({ error: 'Teléfono inválido' });
  }
  
  // 4. Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  
  // 5. Sanitizar inputs (remover caracteres de control)
  const sanitizedName = name.trim().replace(/[\x00-\x1F\x7F]/g, '');
  const sanitizedPhone = phone.trim().replace(/[\x00-\x1F\x7F]/g, '');
  const sanitizedComuna = comuna.trim().replace(/[\x00-\x1F\x7F]/g, '');
  
  // 6. Usar consulta parametrizada
  const query = 'INSERT INTO users (name, email, phone, comuna, password_hash, rol) VALUES (?, ?, ?, ?, ?, ?)';
  const passwordHash = await bcrypt.hash(password, 10);
  
  try {
    await db.query(query, [sanitizedName, email.toLowerCase(), sanitizedPhone, sanitizedComuna, passwordHash, rol]);
    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    // NO REVELAR DETALLES TÉCNICOS AL USUARIO
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};
```

### 3. Manejo de Errores Seguro

**NUNCA** enviar mensajes de error técnicos al frontend.

#### ❌ MAL:
```javascript
catch (error) {
  res.status(500).json({ error: error.message }); // Revela detalles técnicos
}
```

#### ✅ BIEN:
```javascript
catch (error) {
  console.error('Error en registro:', error); // Log solo en servidor
  res.status(500).json({ error: 'Error al procesar la solicitud' }); // Mensaje genérico
}
```

---

## 🗑️ LIMPIEZA DE BASE DE DATOS

Hay registros maliciosos en la base de datos que deben eliminarse:

```sql
-- 1. Ver usuarios con caracteres sospechosos
SELECT id, name, phone, email, created_at 
FROM users 
WHERE name LIKE '%SLEEP%' 
   OR name LIKE '%DROP%'
   OR name LIKE '%SELECT%'
   OR name LIKE '%INSERT%'
   OR name LIKE '%DELETE%'
   OR name LIKE '%UNION%'
   OR name LIKE '%'';%'
   OR name LIKE '%--%'
   OR phone LIKE '%SLEEP%'
   OR phone LIKE '%'';%';

-- 2. Eliminar usuarios maliciosos (REVISAR ANTES DE EJECUTAR)
DELETE FROM users 
WHERE name LIKE '%SLEEP%' 
   OR name LIKE '%DROP%'
   OR name LIKE '%SELECT%'
   OR name LIKE '%'';%'
   OR name LIKE '%--%'
   OR phone LIKE '%SLEEP%'
   OR phone LIKE '%'';%';

-- 3. Verificar que no queden registros maliciosos
SELECT COUNT(*) FROM users;
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Backend (CRÍTICO)
- [ ] Reemplazar TODAS las queries concatenadas por consultas parametrizadas
- [ ] Agregar validación de inputs en TODOS los endpoints
- [ ] Sanitizar inputs antes de guardar en BD
- [ ] Implementar manejo de errores seguro (sin revelar detalles técnicos)
- [ ] Limpiar registros maliciosos de la base de datos
- [ ] Revisar endpoints de: `/auth/register`, `/auth/login`, `/jobs`, `/services`, `/posts`

### Testing
- [ ] Probar registro con inputs maliciosos (`'; DROP TABLE users; --`)
- [ ] Verificar que los errores no revelen información técnica
- [ ] Confirmar que las consultas parametrizadas funcionan correctamente
- [ ] Validar que la base de datos esté limpia

---

## 🔍 ARCHIVOS A REVISAR EN EL BACKEND

Basándome en la estructura típica de un backend Node.js/Express:

1. **Controladores de autenticación** (`controllers/auth.controller.js` o similar)
   - Función de registro
   - Función de login
   - Actualización de perfil

2. **Controladores de empleos** (`controllers/jobs.controller.js`)
   - Creación de empleos
   - Actualización de empleos

3. **Controladores de servicios** (`controllers/services.controller.js`)
   - Creación de servicios
   - Actualización de servicios

4. **Controladores de posts** (`controllers/posts.controller.js`)
   - Creación de posts
   - Creación de comentarios

5. **Middleware de validación** (crear si no existe)
   - Validadores de inputs
   - Sanitizadores

---

## 📚 RECURSOS ADICIONALES

- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [mysql2 Prepared Statements](https://github.com/sidorares/node-mysql2#using-prepared-statements)

---

## ⚡ PRIORIDAD

**URGENTE**: Estas correcciones deben implementarse lo antes posible. La vulnerabilidad actual permite:
- Robo de datos de usuarios
- Eliminación de tablas
- Modificación de datos
- Denegación de servicio (SLEEP attacks)

**NO DESPLEGAR A PRODUCCIÓN** hasta que estas correcciones estén implementadas y probadas.
