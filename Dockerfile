# Multi-stage build para AiDuxCare V.2
FROM node:20-bullseye AS base

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

# Instalar dependencias
RUN npm ci --legacy-peer-deps --only=production && npm cache clean --force

# Etapa de desarrollo
FROM base AS development

# Instalar dependencias de desarrollo
RUN npm ci --legacy-peer-deps

# Copiar código fuente
COPY . .

# Exponer puertos
EXPOSE 5173 5174 5175 5176 5177 3000 3001

# Comando de desarrollo
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Etapa de build
FROM base AS build

# Instalar dependencias de desarrollo para build
RUN npm ci --legacy-peer-deps

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# Etapa de producción
FROM nginx:alpine AS production

# Copiar archivos buildados
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Exponer puerto
EXPOSE 80

# Comando de producción
CMD ["nginx", "-g", "daemon off;"] 