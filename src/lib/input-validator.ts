/**
 * Utilidades de validación y sanitización de inputs para prevenir SQL Injection
 */

// Caracteres peligrosos que pueden usarse en SQL Injection
const SQL_DANGEROUS_CHARS = [
    "'", '"', ';', '--', '/*', '*/', 'xp_', 'sp_',
    'EXEC', 'EXECUTE', 'SELECT', 'INSERT', 'UPDATE', 'DELETE',
    'DROP', 'CREATE', 'ALTER', 'UNION', 'SLEEP', 'BENCHMARK',
    'WAITFOR', 'DELAY', 'LOAD_FILE', 'OUTFILE', 'DUMPFILE'
];

/**
 * Detecta si un string contiene caracteres o patrones peligrosos de SQL
 */
export const containsSQLInjection = (input: string): boolean => {
    const upperInput = input.toUpperCase();

    return SQL_DANGEROUS_CHARS.some(dangerous => {
        if (dangerous.length === 1 || dangerous.length === 2) {
            // Para caracteres especiales, buscar exactamente
            return input.includes(dangerous);
        }
        // Para palabras clave SQL, buscar como palabra completa
        const regex = new RegExp(`\\b${dangerous}\\b`, 'i');
        return regex.test(upperInput);
    });
};

/**
 * Valida que un teléfono solo contenga números y caracteres permitidos
 */
export const isValidPhone = (phone: string): boolean => {
    // Permitir solo números, espacios, guiones, paréntesis y el símbolo +
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;

    if (!phoneRegex.test(phone)) {
        return false;
    }

    // Extraer solo los dígitos
    const digitsOnly = phone.replace(/\D/g, '');

    // Debe tener entre 8 y 15 dígitos (formato internacional)
    return digitsOnly.length >= 8 && digitsOnly.length <= 15;
};

/**
 * Sanitiza un string removiendo caracteres peligrosos
 */
export const sanitizeInput = (input: string, maxLength: number = 255): string => {
    // Remover caracteres de control y espacios múltiples
    let sanitized = input
        .replace(/[\x00-\x1F\x7F]/g, '') // Remover caracteres de control
        .replace(/\s+/g, ' ') // Normalizar espacios
        .trim();

    // Limitar longitud
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
};

/**
 * Valida que un nombre sea válido (sin caracteres especiales peligrosos)
 */
export const isValidName = (name: string): boolean => {
    // Permitir letras, espacios, acentos, ñ, apóstrofes y guiones
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/;

    if (!nameRegex.test(name)) {
        return false;
    }

    // No debe contener patrones SQL peligrosos
    if (containsSQLInjection(name)) {
        return false;
    }

    // Longitud razonable
    return name.length >= 2 && name.length <= 100;
};

/**
 * Valida que un campo de texto general sea seguro
 */
export const isValidTextField = (text: string, maxLength: number = 500): boolean => {
    // No debe estar vacío
    if (!text || text.trim().length === 0) {
        return false;
    }

    // No debe exceder la longitud máxima
    if (text.length > maxLength) {
        return false;
    }

    // No debe contener patrones SQL peligrosos
    if (containsSQLInjection(text)) {
        return false;
    }

    return true;
};

/**
 * Valida que una comuna sea válida
 */
export const isValidComuna = (comuna: string): boolean => {
    // Similar a nombre, pero más restrictivo
    const comunaRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-]+$/;

    if (!comunaRegex.test(comuna)) {
        return false;
    }

    // No debe contener patrones SQL peligrosos
    if (containsSQLInjection(comuna)) {
        return false;
    }

    return comuna.length >= 2 && comuna.length <= 50;
};

/**
 * Formatea un teléfono chileno
 */
export const formatChileanPhone = (phone: string): string => {
    // Extraer solo dígitos
    const digits = phone.replace(/\D/g, '');

    // Si empieza con 56 (código de Chile), formatear como +56 9 XXXX XXXX
    if (digits.startsWith('56') && digits.length === 11) {
        return `+56 ${digits.substring(2, 3)} ${digits.substring(3, 7)} ${digits.substring(7)}`;
    }

    // Si es un número de 9 dígitos (celular chileno), formatear como +56 9 XXXX XXXX
    if (digits.length === 9 && digits.startsWith('9')) {
        return `+56 ${digits.substring(0, 1)} ${digits.substring(1, 5)} ${digits.substring(5)}`;
    }

    // Si es un número de 8 dígitos (fijo chileno), formatear como +56 X XXXX XXXX
    if (digits.length === 8) {
        return `+56 ${digits.substring(0, 1)} ${digits.substring(1, 5)} ${digits.substring(5)}`;
    }

    // Retornar sin formato si no coincide con patrones conocidos
    return phone;
};

/**
 * Mensajes de error amigables
 */
export const getValidationErrorMessage = (field: string, type: 'sql' | 'format' | 'length'): string => {
    const messages = {
        sql: {
            name: 'El nombre contiene caracteres no permitidos',
            phone: 'El teléfono contiene caracteres no permitidos',
            comuna: 'La comuna contiene caracteres no permitidos',
            default: 'Este campo contiene caracteres no permitidos'
        },
        format: {
            name: 'El nombre solo puede contener letras, espacios y guiones',
            phone: 'El teléfono solo puede contener números y los caracteres + - ( )',
            comuna: 'La comuna solo puede contener letras, espacios y guiones',
            email: 'Por favor ingresa un email válido',
            default: 'El formato de este campo no es válido'
        },
        length: {
            name: 'El nombre debe tener entre 2 y 100 caracteres',
            phone: 'El teléfono debe tener entre 8 y 15 dígitos',
            comuna: 'La comuna debe tener entre 2 y 50 caracteres',
            default: 'La longitud de este campo no es válida'
        }
    };

    return messages[type][field as keyof typeof messages[typeof type]] || messages[type].default;
};
