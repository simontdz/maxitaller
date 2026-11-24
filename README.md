# Sistema de Presupuestos - Talleres Mecánicos

Sistema web de presupuestos para taller mecánico con generación de PDF.

## Talleres

- **Maxi Taller** — Presupuesto/OT con plantilla Maxi Taller
- **Suscars** — Presupuesto con plantilla Suscars

## Uso

Abrir `index.html` en un navegador y seleccionar el taller correspondiente.

## Funcionalidades

- Datos del vehículo y cliente
- Tabla dinámica de ítems (categoría, subcategoría, descripción, cantidad, precio unitario)
- Cálculo automático de totales, valor neto, IVA (19%) y total final
- Generación de PDF sobre plantilla personalizada por taller
- Soporte multi-página: si hay más de 11 ítems se genera una segunda página con los ítems restantes y totales
- Observación opcional (hasta 700 caracteres), impresa sobre el pie del PDF. Si el texto es largo, se reduce a 7 pt para que quepa
- Fotos opcionales desde la cámara o la galería (hasta 16): se comprimen, se pueden girar o eliminar, y van al final del PDF, 4 por página, con el logo y el folio/patente en el encabezado
- Responsive (móvil y desktop)

## Estructura

```
├── index.html                  # Página principal con selección de taller
├── formularios/
│   ├── presupuesto/            # Formulario Maxi Taller
│   └── suscars/                # Formulario Suscars
├── archivos/                   # Plantillas PDF
│   ├── MaxiTaller.pdf          # Plantilla con totales
│   ├── MaxiTaller - v2.pdf     # Plantilla sin totales (pág 1 multi-página)
│   ├── Suscars.pdf             # Plantilla con totales
│   └── Suscars - v2.pdf        # Plantilla sin totales (pág 1 multi-página)
└── assets/
    ├── images/                 # Logos
    └── js/
        └── evidencia.js        # Observación y fotos (compartido por ambos formularios)
```
