# 💰 Gestor de Gastos

Aplicación web para el control de gastos personales desarrollada con React, Vite y Tailwind CSS.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
# Crear archivo .env con:
# VITE_EXCHANGE_API_KEY=tu_api_key_de_exchangerate-api.com

# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build
```

## ✨ Características Principales

- **Dashboard** - Estadísticas y resumen de gastos
- **Gestión de Gastos** - Agregar, editar y eliminar gastos
- **Gráficos Interactivos** - Visualización de datos con Chart.js
- **Sistema de Monedas** - Soporte para LPS y USD con conversión automática
- **Importación de Datos** - Importar desde Excel (.xlsx, .xls) y CSV
- **Presupuestos** - Control de presupuestos mensuales
- **Análisis de Gastos** - Cálculos y reportes detallados
- **Configuración** - Tema claro/oscuro, notificaciones y más

## 🛠️ Tecnologías

- **React 18** - Framework de UI
- **Vite** - Build tool
- **Tailwind CSS** - Estilos
- **Chart.js** - Gráficos
- **Supabase** - Base de datos y autenticación

## 📱 Características Móviles

- Diseño responsive
- Controles de zoom (50% - 150%)
- Interfaz optimizada para móviles

## 📊 Categorías

Comida, Transporte, Entretenimiento, Regalos, Utilidades, Salud, Educación, Tecnología, Otros

## 💱 Monedas

- **LPS** (Lempiras) - Moneda por defecto
- **USD** (Dólares) - Con conversión automática a LPS
- Tasa de cambio configurable

## 📥 Importación

Soporta archivos Excel (.xlsx, .xls) y CSV con formato:
```
fecha,monto,categoria,descripcion
2024-01-15,150.50,Comida,Almuerzo
```

## 🔧 Comandos

```bash
npm run dev          # Desarrollo
npm run build        # Compilar
npm run preview      # Previsualizar build
```

## 📄 Licencia

MIT License
