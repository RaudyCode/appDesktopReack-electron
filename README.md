# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# Aplicación de Gestión de Préstamos

## Generación de Datos de Prueba

La aplicación incluye una herramienta para generar rápidamente datos de prueba (100 clientes con 3 préstamos cada uno), ideal para pruebas o demostraciones.

### Instrucciones

#### 1. Para crear datos de prueba:

Desde la raíz del proyecto, ejecuta:

```bash
npm run seed-create [ID_DE_RUTA]
```

Reemplaza `[ID_DE_RUTA]` con el ID de la ruta donde quieres añadir los clientes.

**Ejemplo:** Para crear datos de prueba en la ruta con ID 1:

```bash
npm run seed-create 1
```

#### 2. Para eliminar todos los datos de prueba:

```bash
npm run seed-remove
```

Esto elimina automáticamente todos los clientes de prueba y sus préstamos.

### Características de los datos generados:

- **Clientes**: 100 clientes con información personal aleatoria
- **Préstamos**: 3 préstamos por cliente (300 en total)
- **Montos**: Entre 5,000 y 50,000
- **Estados variables**: 90% activos, 10% morosos
- **Identificación**: Todos los clientes de prueba tienen IDs que comienzan con "TEST-"

## Filtrado Avanzado de Clientes

La aplicación incluye un sistema de filtrado avanzado para buscar clientes con múltiples criterios:

### Criterios de Filtrado

- **Nombre**: Buscar por coincidencia parcial en el nombre
- **ID Cliente**: Filtrar por ID (incluida búsqueda parcial)
- **Cédula**: Buscar por número de documento
- **Ruta**: Filtrar por ruta específica
- **Estado**: Filtrar por estado del cliente (activo/inactivo)
- **Datos de Prueba**: Opción para mostrar solo clientes de prueba (TEST-) o excluirlos

### Opciones de Ordenamiento

- Ordenar por nombre, ID, cédula, teléfono o fecha de registro
- Ordenamiento ascendente o descendente
- Configuración del número de resultados por página

### Cómo Usar el Filtro

1. Haga clic en el botón "Buscar clientes" en la parte superior derecha
2. Complete los criterios deseados en el formulario
3. Haga clic en "Buscar clientes" para aplicar los filtros
4. Los resultados se mostrarán en una tabla con las opciones de navegación habituales

Para más detalles, consulta `backend/README.md`.

## Pagos Parciales

Se ha implementado una solución para permitir pagos parciales (montos menores a la cuota completa) en el sistema. Los cambios incluyen:

1. **Validación mejorada en el backend**:
   - Validación individual para cada campo obligatorio con mensajes específicos
   - Conversión explícita de tipos para `monto` y `semana` usando `Number()`
   - Verificación de que los valores numéricos son válidos y mayores que cero
   - Manejo de errores mejorado con logging detallado para diagnóstico

2. **Manejo de estados del pago**:
   - Los pagos parciales se marcan correctamente como `parcial`, `atrasado y parcial` o `fuera de tiempo y parcial`
   - El estado `fuera de tiempo y parcial` se aplica a pagos realizados después de la fecha límite

3. **UI mejorada para pagos parciales**:
   - Confirmación adicional cuando se intenta realizar un pago parcial
   - Indicador visual cuando el monto ingresado es menor que la cuota completa

4. **Corrección de tipos de datos**:
   - Conversión explícita de la semana a número en la interfaz de usuario
   - Validación robusta en el servidor para asegurar que la semana sea un número válido
   - Transformación de todos los valores numéricos al tipo correcto antes de enviarlos al servidor

Para probar esta funcionalidad, ingrese un monto menor a la cuota completa al registrar un pago.

## Mejoras en la Interfaz de Pagos

Hemos implementado varias mejoras para resolver problemas con los campos del formulario de pagos que ocasionalmente se bloqueaban:

1. **Manejo robusto de eventos**:
   - Validación mejorada para detectar eventos inválidos
   - Prevención de actualizaciones con valores incorrectos
   - Gestión segura del estado del formulario

2. **Validación y formateo mejorados**:
   - Conversión automática de tipos al perder el foco (onBlur)
   - Validación específica por tipo de campo (numérico/fecha)
   - Prevención de valores inválidos o negativos

3. **Reinicio correcto del formulario**:
   - Inicialización adecuada de valores al abrir el formulario
   - Limpieza de mensajes de error al cambiar de vista
   - Uso de valores string en los estados para evitar problemas con inputs controlados

4. **Manejo seguro del cálculo de totales**:
   - Cálculo de saldo pendiente con conversión segura de tipos
   - Manejo de errores para evitar bloqueos de la interfaz
   - Formateo automático de valores monetarios

Estas mejoras proporcionan una experiencia más fluida y estable al registrar pagos en el sistema.
