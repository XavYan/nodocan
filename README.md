# NODOCAN · Nómina Docente Canarias

Esta aplicación es una herramienta avanzada diseñada para que el personal docente de la Comunidad Autónoma de Canarias pueda calcular su salario neto como estimación transparente con las tablas de **2026**.

La información salarial y los componentes de la nómina se basan en las tablas publicadas por el **STEC-IC**, disponibles en este [enlace oficial (PDF)](https://www.stec.es/stec/archivos_subidos/gal_descargas/2/_214.pdf).

## 🚀 Características Principales

- **Actualizado a 2026**: Incluye las tablas de la guía STEC-IC de febrero de 2026 y cotizaciones de 2026.
- **Multicuerpo**: Soporte para distintos cuerpos docentes (Maestros, Secundaria, Catedráticos, etc.).
- **Gestión de Trienios y Sexenios**:
  - Cálculo automático de trienios con suplemento por islas no capitalinas.
  - Integración del Complemento de Formación Permanente (Sexenios) según la tabla oficial.
- **Cálculo de Pagas Extras**:
  - Desglose detallado del bruto de la paga extra.
  - Cálculo del importe neto estimado tras retenciones.
- **Transparencia en Deducciones**:
  - Cálculo de bases de cotización (CC y CP) incluyendo el prorrateo de pagas extras.
  - Desglose de cuotas obreras de la Seguridad Social (Contingencias Comunes, Desempleo y FP).
  - Simulación de retención de IRPF personalizada.
- **Reducción por Compatibilidad**: Aplicación proporcional del importe de reducción autorizado en la resolución individual.
- **Identidad NODOCAN**: Manrope para títulos, Source Sans 3 para lectura y cifras, azul profundo, turquesa y acento dorado. Fuentes locales y diseño adaptable.

## 🛠️ Tecnologías Utilizadas

- **Core**: Angular 21 (Signals, Standalone Components).
- **Estilos**: Bootstrap 5, Bootstrap Icons y estilos de NODOCAN.
- **Datos**: JSON data-driven architecture para salarios y complementos.

## 💻 Desarrollo

### Servidor de Desarrollo

Para iniciar el servidor local de desarrollo:

```bash
npm start
```

Navega a `http://localhost:4200/`. La aplicación se recargará automáticamente al detectar cambios.

### Construcción (Build)

Para generar el bundle de producción:

```bash
npm run build
```

Los artefactos se almacenarán en el directorio `dist/`.

## 📄 Licencia

Este proyecto es una herramienta informativa. Los cálculos son estimaciones y no tienen validez legal oficial. Se recomienda contrastar los resultados con la nómina emitida por la Consejería de Educación.

## Revisión de importes y fórmulas

Consulta [SALARY_AUDIT.md](SALARY_AUDIT.md) para ver los cambios, fuentes, clasificación de centros y límites de la estimación.

```bash
npm ci
npm test -- --watch=false
npm run build -- --base-href /nodocan/
```

## Exportar simulaciones

Después de calcular, pulsa **Descargar PDF** en el resultado. El documento incluye los parámetros, devengos, bases, deducciones, neto ordinario, todas las extras del contrato, vacaciones pendientes, liquidación y totales anuales de la última simulación calculada. Se genera en el navegador con texto seleccionable, fuentes incorporadas y paginación automática. El generador se carga al pulsar el botón.

Las fechas de inicio y fin de contrato calculan las extras de todos los semestres que se solapan con el contrato, con su año, periodo y porcentaje de devengo. La fecha de fin se incluye en el cómputo. El IRPF inicial es del 20%, editable.

## Identidad visual

Los recursos de marca están en `public/brand`: SVG trazados y fuentes WOFF2 con sus licencias OFL. La web y los PDF usan la misma paleta. El PDF incorpora subconjuntos latinos de las fuentes en `src/app/services/pdf-fonts`; sus licencias se incluyen junto al código. Los números de la interfaz se muestran en formato español.

La aplicación se publica en https://xavyan.github.io/nodocan/. El nombre público es NODOCAN; la clave interna de Angular y la carpeta `dist/nomina-docente/browser` se conservan para el flujo existente de GitHub Pages. La telemetría de Angular está desactivada.
