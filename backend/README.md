# Backend de la Aplicación de Préstamos

## Generación de Datos de Prueba

El sistema incluye un script para generar datos de prueba, que permite crear rápidamente 100 clientes ficticios con 3 préstamos cada uno para facilitar pruebas y demostraciones.

### ¿Cómo usar el generador de datos de prueba?

#### 1. Crear datos de prueba

Para crear 100 clientes de prueba con 3 préstamos cada uno, ejecuta:

```bash
npm run seed-test create [ID_DE_RUTA]
```

Donde `[ID_DE_RUTA]` es el ID de la ruta a la que deseas asignar estos clientes.

**Ejemplo:**
```bash
npm run seed-test create 1
```

Esto creará:
- 100 clientes ficticios con nombres aleatorios
- Cada cliente tendrá 3 préstamos en diferentes etapas
- Todos los clientes estarán asignados a la ruta especificada
- Los clientes tendrán ID que comienzan con "TEST-" para identificarlos fácilmente

#### 2. Eliminar datos de prueba

Para eliminar todos los datos de prueba generados (todos los clientes creados con el script y sus préstamos), ejecuta:

```bash
npm run seed-test remove
```

Esto eliminará automáticamente todos los clientes de prueba (identificados por tener un ID que comienza con "TEST-") y todos sus préstamos asociados.

### Características de los datos de prueba

- Los clientes tienen nombres, cédulas y teléfonos aleatorios
- Los préstamos tienen montos entre 5,000 y 50,000
- Algunos préstamos (10%) están marcados como morosos
- La fecha de inicio de los préstamos es aleatoria (entre 1 y 12 semanas atrás)
- Se generan automáticamente los pagos correspondientes según la semana actual 