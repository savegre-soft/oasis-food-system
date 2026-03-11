# Oasis Food System

**Oasis Food System** es un sistema web desarrollado con **React + Vite** diseñado para la gestión integral de operaciones en un negocio de alimentos. Permite administrar clientes, pedidos, recetas, rutas de entrega, producción de cocina y procesos logísticos de forma centralizada.

El sistema está construido con tecnologías modernas de frontend y utiliza **Supabase** como backend para autenticación, base de datos y almacenamiento.

----------

# Características principales

### Gestión de clientes

-   Registro y administración de clientes.
    
-   Visualización de detalles de cliente.
    
-   Gestión de direcciones y rutas de entrega.
    

### Gestión de pedidos

-   Creación de pedidos.
    
-   Visualización y seguimiento de pedidos.
    
-   Estados de producción y entrega.
    

### Producción de cocina

-   Gestión de recetas.
    
-   Edición de ingredientes.
    
-   Control de producción basado en pedidos.
    

### Gestión de menús y plantillas

-   Creación de menús.
    
-   Plantillas de menú reutilizables.
    

### Rutas de entrega

-   Gestión de rutas de distribución.
    
-   Visualización geográfica utilizando mapas.
    

### Dashboard administrativo

-   Vista centralizada de operaciones.
    
-   Métricas y gráficos.
    

### Autenticación de usuarios

-   Registro de usuarios.
    
-   Inicio de sesión.
    
-   Recuperación y cambio de contraseña.
    

----------

# Tecnologías utilizadas

### Frontend

-   React 19
    
-   Vite
    
-   React Router
    
-   TailwindCSS
    
-   Framer Motion
    

### Backend / Servicios

-   Supabase
    
-   Supabase Storage
    

### Mapas

-   Leaflet
    
-   React Leaflet
    
-   Leaflet Heatmap
    

### Visualización de datos

-   Recharts
    

### UI / Iconos

-   Lucide React
    
-   React Icons
    

### Herramientas de desarrollo

-   ESLint
    
-   Prettier
    

----------

# Instalación

### 1. Clonar el repositorio

`git clone https://github.com/tu-usuario/oasis-food-system.git` 

### 2. Entrar al proyecto

`cd oasis-food-system` 

### 3. Instalar dependencias

`npm install` 

----------

# Variables de entorno

Crear un archivo `.env` en la raíz del proyecto.

Ejemplo:

`VITE_SUPABASE_URL=your_supabase_url VITE_SUPABASE_ANON_KEY=your_supabase_key` 

----------

# Ejecutar en desarrollo

`npm run dev` 

El proyecto se ejecutará en:

`http://localhost:5173` 

----------

# Compilar para producción

`npm run build` 

Esto generará la carpeta:

`dist/` 

que puede ser desplegada en servidores como:

-   Vercel
    
-   Netlify
    
-   Hostinger
    
-   Firebase Hosting
    
-   Nginx / Apache
    

----------

# Vista previa del build

`npm run preview` 

----------

# Formateo del código

Formatear automáticamente:

`npm run format` 

Verificar formato:

`npm run format:check` 

----------

# Linting

`npm run lint` 

----------

# Funcionalidades del sistema

El sistema permite gestionar:

-   Clientes
    
-   Pedidos
    
-   Recetas
    
-   Producción de cocina
    
-   Entregas
    
-   Rutas de distribución
    
-   Plantillas de menú
    
-   Facturación
    
-   Autenticación de usuarios
    

----------

# Arquitectura

El sistema sigue una arquitectura basada en:

`React Components
        │
        
React Context (AppContext)
        │
        │
Supabase Client
        │
        │
Supabase Database / Storage / Auth`
