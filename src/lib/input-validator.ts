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
 * Valida un teléfono y retorna el tipo de error si lo hay
 */
export type PhoneValidationError = 'valid' | 'format' | 'length';

export const validatePhone = (phone: string): PhoneValidationError => {
    if (!phone) return 'valid'; // Dejar que la validación de requeridos lo maneje

    // Permitir solo números, espacios, guiones, paréntesis y el símbolo +
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;

    if (!phoneRegex.test(phone)) {
        return 'format';
    }

    // Extraer solo los dígitos
    const digitsOnly = phone.replace(/\D/g, '');

    // Debe tener entre 8 y 15 dígitos (formato internacional)
    if (digitsOnly.length > 0 && (digitsOnly.length < 8 || digitsOnly.length > 15)) {
        return 'length';
    }

    return 'valid';
};

/**
 * Valida que un teléfono solo contenga números y caracteres permitidos
 */
export const isValidPhone = (phone: string): boolean => {
    return validatePhone(phone) === 'valid';
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
 * Valida un RUT chileno (con o sin puntos/guión)
 */
export const isValidRut = (rut: string): boolean => {
    if (!rut || typeof rut !== 'string') return false;

    // Limpiar RUT de puntos y guiones
    let valor = rut.replace(/\./g, '').replace(/\-/g, '').toUpperCase();

    // Validar longitud mínima
    if (valor.length < 8) return false;

    // Extraer cuerpo y dígito verificador
    let cuerpo = valor.slice(0, -1);
    let dv = valor.slice(-1);

    // Validar que el cuerpo sea numérico
    if (!/^\d+$/.test(cuerpo)) return false;

    // Calcular dígito verificador y comparar
    let suma = 0;
    let multiplo = 2;
    for (let i = 1; i <= cuerpo.length; i++) {
        let index = multiplo * Math.floor(cuerpo.length - i);
        suma = suma + parseInt(cuerpo.charAt(cuerpo.length - i)) * multiplo;
        if (multiplo < 7) {
            multiplo = multiplo + 1;
        } else {
            multiplo = 2;
        }
    }
    let dvEsperado = 11 - (suma % 11);
    let dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();

    return dvCalculado === dv;
};

/**
 * Formatea un RUT a XX.XXX.XXX-X
 */
export const formatRut = (rut: string): string => {
    const cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (cleanRut.length < 2) return cleanRut;

    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1);

    return body.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
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
            rut: 'El RUT contiene caracteres no permitidos',
            default: 'Este campo contiene caracteres no permitidos'
        },
        format: {
            name: 'El nombre solo puede contener letras, espacios y guiones',
            phone: 'El teléfono solo puede contener números y los caracteres + - ( )',
            comuna: 'La comuna solo puede contener letras, espacios y guiones',
            email: 'Por favor ingresa un email válido',
            rut: 'El RUT ingresado no es válido',
            default: 'El formato de este campo no es válido'
        },
        length: {
            name: 'El nombre debe tener entre 2 y 100 caracteres',
            phone: 'El teléfono debe tener entre 8 y 15 dígitos',
            comuna: 'La comuna debe tener entre 2 y 50 caracteres',
            rut: 'El RUT debe tener un largo razonable',
            default: 'La longitud de este campo no es válida'
        }
    };

    return messages[type][field as keyof typeof messages[typeof type]] || messages[type].default;
};
