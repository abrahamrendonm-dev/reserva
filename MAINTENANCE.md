# 📋 Notas de Mantenimiento del Proyecto

## Archivos Deprecated/Antiguos

### ❌ `CalendarioRecepcion.jsx` (DEPRECATED)
- **Ubicación:** `src/CalendarioRecepcion.jsx`
- **Razón:** Archivo antiguo reemplazado por `src/components/CalendarioPrincipal.jsx`
- **Acción:** Puede ser eliminado cuando se confirme que todo funciona correctamente

**Cambios:**
- ✅ `App.jsx` ya importa de `CalendarioPrincipal` (archivo nuevo)
- ✅ Ambos archivos tienen los mismos imports de FullCalendar
- ✅ La lógica ha sido consolidada en `CalendarioPrincipal.jsx`

## Estructura Correcta Actual

```
src/
├── App.jsx                          ← Importa CalendarioPrincipal ✓
├── components/
│   ├── CalendarioPrincipal.jsx      ← ✓ ACTIVO - Componente principal
│   ├── ModalReserva.jsx             ✓ ACTIVO
│   ├── GestionTerapeutas.jsx        ✓ ACTIVO
│   └── GestionSalas.jsx             ✓ ACTIVO
├── CalendarioRecepcion.jsx          ← ❌ DEPRECATED - Puede eliminarse
├── supabaseClient.js                ✓ ACTIVO
├── main.jsx                         ✓ ACTIVO
└── index.css                        ✓ ACTIVO
```

## Acciones Completadas

1. ✅ **Credenciales a `.env`** - Movidas a variables de entorno
2. ✅ **Tailwind CSS** - Instalado y configurado correctamente
3. ✅ **FullCalendar CSS** - Estilos cargados automáticamente
4. ✅ **Reconciliación de nombres** - App.jsx apunta a CalendarioPrincipal correcto

## Próximos Pasos (Opcional)

- [ ] Eliminar `src/CalendarioRecepcion.jsx` cuando se confirme estabilidad
- [ ] Crear hooks personalizados para lógica de Supabase
- [ ] Añadir manejo de errores mejorado
