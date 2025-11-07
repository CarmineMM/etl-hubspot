# 🚀 ETL HubSpot - Sistema de Sincronización

Bienvenido al sistema ETL (Extract, Transform, Load) para HubSpot. Esta aplicación permite sincronizar contactos desde HubSpot CRM a una base de datos PostgreSQL de manera automatizada, utilizando OAuth 2.0 para la autenticación segura.

## 📋 Tabla de Contenidos

1. [📌 Descripción General](#-descripción-general)
2. 🚀 [Guía Rápida](#-guía-rápida)
3. 📚 [Documentación Detallada](#-documentación-detallada)
4. 🛠️ [Configuración del Entorno](#-configuración-del-entorno)
5. 🔄 [Flujo de Autenticación y Sincronización](#-flujo-de-autenticación-y-sincronización)
6. 🐳 [Despliegue con Docker](#-despliegue-con-docker)
7. 🔍 [Solución de Problemas](#-solución-de-problemas)
8. 📄 [Documentación Adicional](#-documentación-adicional)
9. 🤝 [Contribución](#-contribución)

## 📌 Descripción General

Este proyecto implementa un sistema ETL que:

- Se conecta a la API de HubSpot usando OAuth 2.0
- Extrae contactos de manera paginada
- Transforma los datos según sea necesario
- Almacena la información en una base de datos PostgreSQL
- Proporciona una API REST para consultar los datos sincronizados

## 🚀 Guía Rápida

### Requisitos Previos

- Node.js 16+ y pnpm
- Docker y Docker Compose (opcional)
- Una aplicación registrada en el portal de desarrolladores de HubSpot

### Instalación con Docker Compose

1. Clona el repositorio:

    ```bash
    git clone [URL_DEL_REPOSITORIO]
    cd etl-hubspot
    ```

2. Configura las variables de entorno (crea un archivo `.env` basado en `.env.example`)

3. Inicia todos los servicios con Docker Compose:

    ```bash
    docker compose -f docker-compose.dev.yml up --build -d
    ```

    Esto iniciará:
    - La aplicación Node.js con recarga en caliente
    - La base de datos PostgreSQL
    - Todas las dependencias necesarias

4. Accede a la aplicación en: http://localhost:3000

## 📚 Documentación Detallada

### [📋 GUÍA DE INICIO RÁPIDO](./QUICKSTART.md)

Pasos detallados para configurar y ejecutar la aplicación rápidamente.

### [📊 IMPLEMENTACIÓN TÉCNICA](./IMPLEMENTATION_SUMMARY.md)

Detalles técnicos sobre la arquitectura y decisiones de implementación.

### [🔌 INTEGRACIÓN CON HUBSPOT](./README_HUBSPOT_ETL.md)

Documentación específica sobre la integración con la API de HubSpot.

## 🛠️ Configuración del Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Configuración de la base de datos
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=etlhubspot

# Configuración de HubSpot
HUBSPOT_CLIENT_ID=tu_client_id
HUBSPOT_CLIENT_SECRET=tu_client_secret
HUBSPOT_REDIRECT_URI=http://localhost:3000/hubspot/auth/callback
HUBSPOT_SCOPES=crm.objects.contacts.read crm.objects.contacts.write

# Configuración de la aplicación
PORT=3000
NODE_ENV=development
```

## 🔄 Flujo de Autenticación y Sincronización

1. **Iniciar el flujo de autorización**:

    ```
    GET /hubspot/auth/authorize
    ```

2. **El usuario autoriza la aplicación en HubSpot**

3. **HubSpot redirige al callback con el código de autorización**

4. **La aplicación intercambia el código por un token de acceso**

5. **Se inicia automáticamente el proceso ETL**

6. **Los datos se almacenan en PostgreSQL**

## 🐳 Despliegue con Docker

### Desarrollo

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

### Producción

```bash
# Construir la imagen
docker build -t etl-hubspot:prod .

# Ejecutar el contenedor
docker run -p 3000:3000 --env-file .env etl-hubspot:prod
```

## 🔍 Solución de Problemas

### Error de autenticación

- Verifica que las credenciales de HubSpot sean correctas
- Asegúrate de que la URL de re-dirección esté configurada correctamente en el portal de desarrolladores de HubSpot

### Problemas con la base de datos

- Verifica que el servicio de PostgreSQL esté en ejecución
- Comprueba las credenciales de la base de datos en el archivo `.env`

## 📄 Documentación Adicional

- [Documentación de la API de HubSpot](https://developers.hubspot.com/docs/api/overview)
- [Documentación de NestJS](https://docs.nestjs.com/)
- [Documentación de TypeORM](https://typeorm.io/)

## 🤝 Contribución

1. Haz un fork del proyecto
2. Crea una rama para tu característica (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Haz push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

Desarrollado por Carmine Maggio
