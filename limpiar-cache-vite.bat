@echo off
echo ========================================
echo   Limpiando caché de Vite
echo ========================================
echo.

if exist "node_modules\.vite" (
    echo Eliminando directorio node_modules\.vite...
    rmdir /s /q "node_modules\.vite"
    echo ✅ Caché eliminado exitosamente
) else (
    echo ℹ️  El directorio node_modules\.vite no existe
)

echo.
echo Ahora puedes ejecutar: npm run dev
echo.
pause

