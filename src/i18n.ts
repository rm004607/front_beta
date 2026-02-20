import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    es: {
        translation: {
            "nav": {
                "services": "Servicios",
                "wall": "Muro de Datos",
                "home": "Inicio",
                "profile": "Mi Perfil",
                "admin": "Admin",
                "login": "Iniciar Sesión",
                "register": "Registrarse",
                "logout": "Cerrar Sesión"
            },
            "hero": {
                "verified_community": "Comunidad 100% Verificada",
                "title_part1": "¡Acá está el ",
                "title_part2": "Dato que necesitas!",
                "description": "(Gásfiter, electricista, cerrajero, limpieza, construcciones, mecánica automotriz, cuidadores y más...)",
                "join_now": "Únete Ahora",
                "explore_services": "Explorar Servicios"
            },
            "common": {
                "language_name": "Español",
                "switch_to": "Switch to English"
            }
        }
    },
    en: {
        translation: {
            "nav": {
                "services": "Services",
                "wall": "Data Wall",
                "home": "Home",
                "profile": "My Profile",
                "admin": "Admin",
                "login": "Login",
                "register": "Register",
                "logout": "Logout"
            },
            "hero": {
                "verified_community": "100% Verified Community",
                "title_part1": "Here is the ",
                "title_part2": "Data you need!",
                "description": "(Plumber, electrician, locksmith, cleaning, construction, automotive mechanics, caregivers and more...)",
                "join_now": "Join Now",
                "explore_services": "Explore Services"
            },
            "common": {
                "language_name": "English",
                "switch_to": "Cambiar a Español"
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'es',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        }
    });

export default i18n;
