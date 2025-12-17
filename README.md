# 💰 Gestor de Gastos Web

Una aplicación web moderna para el control de gastos personales, desarrollada con **React + Vite + Tailwind CSS**.

## ✨ Características

### 🎨 **Interfaz Moderna**
- Diseño smooth y minimalista
- Colores suaves y gradientes
- Animaciones fluidas
- Responsive y adaptable

### 💱 **Sistema de Monedas**
- Soporte para **LPS** (Lempiras) y **USD** (Dólares)
- Conversión automática USD → LPS
- Tasa de cambio configurable
- Configuración persistente

### 📊 **Gráficos Interactivos**
- Gráfico de torta por categorías
- Gráfico de barras comparativo
- Gráfico de línea temporal
- Visualizaciones con Chart.js

### 📥 **Importación Inteligente**
- Soporte para Excel (.xlsx, .xls)
- Soporte para CSV (.csv)
- Detección automática de formato
- Validación de datos
- Vista previa antes de importar

### 🗄️ **Base de Datos**
- SQLite integrado con sql.js
- Datos persistentes
- Backup y restauración
- Exportación de datos

### ⚙️ **Configuración**
- Tema claro/oscuro
- Idioma español/inglés
- Notificaciones configurables
- Respaldo automático

## 🚀 Instalación y Uso

### **Prerrequisitos**
- Node.js 16+ 
- npm o yarn

### **Instalación**
```bash
# Clonar o descargar el proyecto
cd gestor-gastos-web

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build:electron
```

### **Comandos Disponibles**
```bash
npm run dev              # Desarrollo con hot reload
npm run build            # Build de la aplicación web
npm run build:electron   # Compilar ejecutable
npm run dist             # Crear distributables
npm run pack             # Empaquetar sin distribuir
```

## 📁 Estructura del Proyecto

```
gestor-gastos-moderno/
├── src/
│   ├── components/          # Componentes React reutilizables
│   ├── pages/              # Páginas principales
│   ├── database/           # Gestión de base de datos SQLite
│   ├── utils/              # Utilidades (monedas, Excel, etc.)
│   ├── charts/             # Componentes de gráficos
│   ├── App.jsx             # Componente principal
│   └── main.jsx            # Punto de entrada
├── electron/
│   └── main.js             # Proceso principal de Electron
├── public/                 # Assets estáticos
├── assets/                 # Iconos y recursos
└── dist-electron/          # Ejecutables compilados
```

## 🎯 Funcionalidades

### **Dashboard**
- Estadísticas generales
- Gastos recientes
- Acciones rápidas
- Cards informativos

### **Agregar Gasto**
- Formulario intuitivo
- Selección de categorías
- Conversión automática de monedas
- Validación en tiempo real

### **Gráficos**
- Distribución por categorías
- Comparativas temporales
- Análisis de tendencias
- Exportación de gráficos

### **Importar Datos**
- Archivos Excel y CSV
- Detección automática de columnas
- Vista previa de datos
- Validación y corrección

### **Configuración**
- Tasa de cambio USD/LPS
- Tema de interfaz
- Configuraciones de notificación
- Backup y restauración

## 🛠️ Tecnologías

### **Frontend**
- **React 18** - Framework de UI
- **Tailwind CSS** - Estilos y diseño
- **Chart.js** - Gráficos interactivos
- **Vite** - Build tool y dev server

### **Backend/Desktop**
- **Electron** - Framework de aplicaciones de escritorio
- **SQL.js** - Base de datos SQLite en el navegador
- **Node.js** - Runtime de JavaScript

### **Utilidades**
- **XLSX** - Manipulación de archivos Excel
- **File System API** - Manejo de archivos nativo

## 📊 Categorías Predefinidas

- 🍽️ **Comida** - Gastos en alimentación
- 🚌 **Transporte** - Movilidad y transporte
- 🎮 **Entretenimiento** - Ocio y diversión
- 🎁 **Regalos** - Compras para otros
- ⚡ **Utilidades** - Servicios básicos
- 🏥 **Salud** - Medicina y cuidado médico
- 📚 **Educación** - Gastos educativos
- 💻 **Tecnología** - Equipos y software
- 📦 **Otros** - Categoría general

## 💱 Sistema de Monedas

### **Monedas Soportadas**
- **LPS** - Lempira Hondureño (por defecto)
- **USD** - Dólar Estadounidense

### **Conversión Automática**
- Los gastos en USD se convierten automáticamente a LPS
- Tasa de cambio configurable (por defecto: 1 USD = 26.18 LPS)
- Almacenamiento de monto original y convertido
- Configuración persistente en la base de datos

## 📥 Importación de Datos

### **Formatos Soportados**
- **Excel**: .xlsx, .xls
- **CSV**: .csv con separador de comas

### **Formato Esperado**
```csv
fecha,monto,categoria,descripcion
2024-01-15,150.50,Comida,Almuerzo en restaurante
2024-01-16,25.00,Transporte,Taxi al trabajo
```

### **Validaciones**
- Fechas en formato YYYY-MM-DD
- Montos como números positivos
- Categorías válidas
- Descripciones opcionales

## 🔧 Configuración

### **Variables de Entorno**
```bash
NODE_ENV=development  # Modo desarrollo
```

### **Configuración de Build**
- **Windows**: NSIS installer
- **macOS**: DMG package
- **Linux**: AppImage

## 📱 Compatibilidad

### **Sistemas Operativos**
- ✅ Windows 10/11
- ✅ macOS 10.14+
- ✅ Linux (Ubuntu 18.04+)

### **Navegadores (para desarrollo)**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🚀 Distribución

### **Crear Ejecutable**
```bash
# Compilar aplicación
npm run build:electron

# El ejecutable estará en:
# dist-electron/Gestor de Gastos Setup.exe (Windows)
# dist-electron/Gestor de Gastos.dmg (macOS)
```

### **Tamaño del Ejecutable**
- **Windows**: ~150MB
- **macOS**: ~140MB
- **Linux**: ~130MB

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación
2. Busca en los issues existentes
3. Crea un nuevo issue con detalles del problema
4. Incluye logs y pasos para reproducir

## 🎉 Agradecimientos

- **React** - Por el framework de UI
- **Electron** - Por hacer posible las apps de escritorio
- **Tailwind CSS** - Por los estilos modernos
- **Chart.js** - Por los gráficos interactivos
- **SQL.js** - Por la base de datos en el navegador

---

**Desarrollado con ❤️ usando tecnologías modernas para una experiencia de usuario excepcional.**
