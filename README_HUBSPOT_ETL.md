# HubSpot ETL - Guía de Uso

## Descripción

Este proyecto implementa un ETL (Extract, Transform, Load) automatizado que sincroniza contactos desde HubSpot CRM a una base de datos PostgreSQL usando NestJS, TypeORM y OAuth 2.0.

## Características

- ✅ **OAuth 2.0 Automatizado**: Flujo completo de autenticación con HubSpot
- ✅ **ETL Automático**: Sincronización automática después de la autenticación
- ✅ **Paginación**: Maneja grandes volúmenes de contactos
- ✅ **Persistencia**: Almacena contactos en PostgreSQL con TypeORM
- ✅ **Refresh Token**: Refresca automáticamente tokens expirados
- ✅ **Logging**: Seguimiento detallado del proceso ETL

## Arquitectura

```
src/
├── config/
│   └── database.config.ts          # Configuración de TypeORM
├── crm/
│   ├── contacts/
│   │   ├── entities/
│   │   │   └── contact.entity.ts   # Entidad de contacto
│   │   ├── contacts.controller.ts  # Endpoints de consulta
│   │   ├── contacts.service.ts     # Lógica de sincronización ETL
│   │   └── contacts.module.ts
│   └── hubspot/
│       ├── hubspot-auth.service.ts     # Servicio de autenticación OAuth
│       ├── hubspot-api.service.ts      # Cliente API de HubSpot
│       ├── hubspot-auth.controller.ts  # Endpoints de OAuth
│       └── hubspot.module.ts
└── app.module.ts                    # Módulo principal
```

## Configuración

### 1. Variables de Entorno

Copia `.env.example` a `.env` y configura las credenciales de HubSpot:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
# Database
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=etl_hubspot
DB_HOST=db
DB_PORT=5432

# Application
NODE_ENV=development
APP_PORT=3000
APP_URL=http://localhost

# HubSpot OAuth Configuration
HUBSPOT_CLIENT_ID=tu-client-id-aqui
HUBSPOT_CLIENT_SECRET=tu-client-secret-aqui
HUBSPOT_REDIRECT_URI=http://localhost:3000/hubspot/auth/callback
HUBSPOT_SCOPES=crm.objects.contacts.read crm.objects.contacts.write
```

### 2. Obtener Credenciales de HubSpot

1. Ve a [HubSpot Developer Portal](https://developers.hubspot.com/)
2. Crea una nueva aplicación o usa una existente
3. En la configuración de la app:
   - Copia el **Client ID** y **Client Secret**
   - Agrega la URL de redirección: `http://localhost:3000/hubspot/auth/callback`
   - Habilita los scopes: `crm.objects.contacts.read` y `crm.objects.contacts.write`

### 3. Iniciar la Aplicación

Con Docker:

```bash
docker-compose -f docker-compose.dev.yml up
```

O localmente:

```bash
pnpm install
pnpm run start:dev
```

## Flujo de Uso

### 1. Autorización OAuth

Visita en tu navegador:

```
http://localhost:3000/hubspot/auth/authorize
```

Esto te redirigirá a HubSpot para autorizar la aplicación.

### 2. Proceso Automático

Después de autorizar:

1. HubSpot redirige a: `http://localhost:3000/hubspot/auth/callback?code=XXX`
2. El backend intercambia el código por un access token
3. **Automáticamente** inicia el proceso ETL
4. Extrae todos los contactos de HubSpot (con paginación)
5. Los guarda/actualiza en PostgreSQL
6. Retorna un JSON con el resultado:

```json
{
  "success": true,
  "message": "Autenticación exitosa y ETL completado",
  "data": {
    "contactsSynced": 10,
    "contactsUpdated": 5,
    "contactsFailed": 0,
    "totalProcessed": 15
  }
}
```

## Endpoints Disponibles

### OAuth y Sincronización

#### `GET /hubspot/auth/authorize`
Inicia el flujo de OAuth. Redirige a HubSpot para autorización.

#### `GET /hubspot/auth/callback?code=XXX`
Callback de OAuth. Intercambia el código por token y ejecuta ETL automáticamente.

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Autenticación exitosa y ETL completado",
  "data": {
    "contactsSynced": 10,
    "contactsUpdated": 5,
    "contactsFailed": 0,
    "totalProcessed": 15
  }
}
```

#### `GET /hubspot/auth/status`
Verifica el estado de autenticación.

**Respuesta:**
```json
{
  "authenticated": true,
  "message": "Autenticado con HubSpot"
}
```

#### `GET /hubspot/auth/sync`
Ejecuta sincronización manual (requiere autenticación previa).

**Respuesta:**
```json
{
  "success": true,
  "message": "Sincronización completada",
  "data": {
    "contactsSynced": 2,
    "contactsUpdated": 13,
    "contactsFailed": 0,
    "totalProcessed": 15
  }
}
```

### Consulta de Contactos

#### `GET /crm/contacts`
Lista todos los contactos sincronizados.

**Respuesta:**
```json
[
  {
    "id": "172363059809",
    "email": "bh@hubspot.com",
    "firstname": "Brian",
    "lastname": "Halligan (Sample Contact)",
    "hsObjectId": "172363059809",
    "hubspotCreatedAt": "2025-11-06T03:39:04.429Z",
    "hubspotUpdatedAt": "2025-11-06T11:23:49.683Z",
    "archived": false,
    "properties": { ... },
    "createdAt": "2025-11-07T12:00:00.000Z",
    "updatedAt": "2025-11-07T12:00:00.000Z"
  }
]
```

#### `GET /crm/contacts/stats`
Obtiene estadísticas de contactos.

**Respuesta:**
```json
{
  "total": 15,
  "active": 15,
  "archived": 0
}
```

#### `GET /crm/contacts/:id`
Obtiene un contacto específico por ID.

## Estructura de la Base de Datos

### Tabla `contacts`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | VARCHAR(255) | ID del contacto en HubSpot (PK) |
| `email` | VARCHAR(255) | Email del contacto |
| `firstname` | VARCHAR(255) | Nombre |
| `lastname` | VARCHAR(255) | Apellido |
| `hs_object_id` | VARCHAR(255) | ID de objeto de HubSpot |
| `hubspot_created_at` | TIMESTAMP | Fecha de creación en HubSpot |
| `hubspot_updated_at` | TIMESTAMP | Fecha de actualización en HubSpot |
| `archived` | BOOLEAN | Si está archivado |
| `properties` | JSONB | Todas las propiedades del contacto |
| `created_at` | TIMESTAMP | Fecha de creación en DB local |
| `updated_at` | TIMESTAMP | Fecha de actualización en DB local |

## Características Técnicas

### Manejo de Tokens

- **Access Token**: Se almacena en memoria y se refresca automáticamente
- **Refresh Token**: Se usa para obtener nuevos access tokens
- **Expiración**: Se verifica antes de cada llamada a la API
- **Auto-refresh**: Si el token expira en menos de 5 minutos, se refresca automáticamente

### Sincronización

- **Upsert**: Usa `save()` de TypeORM que hace INSERT o UPDATE según corresponda
- **Paginación**: Maneja automáticamente la paginación de HubSpot (100 contactos por página)
- **Error Handling**: Registra errores individuales sin detener el proceso completo
- **Logging**: Logs detallados en cada paso del proceso

### Best Practices Implementadas

- ✅ TypeScript estricto
- ✅ Dependency Injection (NestJS)
- ✅ Repository Pattern (TypeORM)
- ✅ Environment Variables (ConfigModule)
- ✅ Error Handling robusto
- ✅ Logging estructurado
- ✅ Type safety completo
- ✅ Async/await pattern

## Troubleshooting

### Error: "No autenticado"

**Solución**: Visita `/hubspot/auth/authorize` primero para autenticar.

### Error: "Invalid client_id or client_secret"

**Solución**: Verifica que las credenciales en `.env` sean correctas.

### Error: "Redirect URI mismatch"

**Solución**: Asegúrate de que `HUBSPOT_REDIRECT_URI` en `.env` coincida exactamente con la configurada en HubSpot Developer Portal.

### Base de datos no conecta

**Solución**: 
- Verifica que Docker esté corriendo
- Revisa las credenciales de DB en `.env`
- Espera a que el healthcheck de PostgreSQL pase

## Desarrollo

### Agregar más objetos de HubSpot

Para sincronizar otros objetos (deals, companies, etc.):

1. Crea una nueva entidad en `src/crm/{objeto}/entities/`
2. Crea un servicio similar a `contacts.service.ts`
3. Agrega métodos en `hubspot-api.service.ts` para el nuevo objeto
4. Registra el módulo en `app.module.ts`

### Ejecutar migraciones

TypeORM está configurado con `synchronize: true` en desarrollo, pero para producción:

```bash
pnpm run build
pnpm run typeorm migration:generate -- -n MigrationName
pnpm run typeorm migration:run
```

## Próximos Pasos

- [ ] Agregar sincronización de Companies
- [ ] Agregar sincronización de Deals
- [ ] Implementar webhooks de HubSpot
- [ ] Agregar sincronización incremental (solo cambios)
- [ ] Implementar cola de trabajos (Bull/BullMQ)
- [ ] Agregar tests unitarios e integración
- [ ] Persistir tokens en base de datos
- [ ] Agregar autenticación para endpoints

## Licencia

UNLICENSED
