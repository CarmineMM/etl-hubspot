# Quick Start - HubSpot ETL

## Configuración Rápida (5 minutos)

### 1. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Edita `.env` y agrega tus credenciales de HubSpot:

```env
HUBSPOT_CLIENT_ID=tu-client-id-aqui
HUBSPOT_CLIENT_SECRET=tu-client-secret-aqui
HUBSPOT_REDIRECT_URI=http://localhost:3000/hubspot/auth/callback
HUBSPOT_SCOPES=crm.objects.contacts.read crm.objects.contacts.write
```

### 2. Iniciar Servicios

```bash
docker-compose -f docker-compose.dev.yml up
```

Espera a que los servicios estén listos (verás logs de NestJS).

### 3. Autorizar y Sincronizar

Abre en tu navegador:

```
http://localhost:3000/hubspot/auth/authorize
```

**Flujo automático:**
1. Te redirige a HubSpot
2. Autorizas la aplicación
3. Vuelves al callback
4. **ETL se ejecuta automáticamente**
5. Recibes JSON con resultados

### 4. Verificar Contactos

```bash
# Ver todos los contactos sincronizados
curl http://localhost:3000/crm/contacts

# Ver estadísticas
curl http://localhost:3000/crm/contacts/stats
```

## Comandos Útiles

```bash
# Ver logs en tiempo real
docker-compose -f docker-compose.dev.yml logs -f app

# Reiniciar servicios
docker-compose -f docker-compose.dev.yml restart

# Detener servicios
docker-compose -f docker-compose.dev.yml down

# Sincronización manual (después de autorizar)
curl http://localhost:3000/hubspot/auth/sync
```

## Estructura del Proyecto

```
src/
├── crm/
│   ├── contacts/          # Módulo de contactos
│   │   ├── entities/      # Entidad TypeORM
│   │   ├── contacts.service.ts    # Lógica ETL
│   │   └── contacts.controller.ts # Endpoints
│   └── hubspot/           # Módulo HubSpot OAuth
│       ├── hubspot-auth.service.ts    # OAuth flow
│       ├── hubspot-api.service.ts     # API client
│       └── hubspot-auth.controller.ts # OAuth endpoints
└── config/
    └── database.config.ts # Configuración DB
```

## Endpoints Principales

| Endpoint | Descripción |
|----------|-------------|
| `GET /hubspot/auth/authorize` | Inicia OAuth (visita en navegador) |
| `GET /hubspot/auth/callback` | Callback OAuth + ETL automático |
| `GET /hubspot/auth/status` | Estado de autenticación |
| `GET /hubspot/auth/sync` | Sincronización manual |
| `GET /crm/contacts` | Lista contactos |
| `GET /crm/contacts/stats` | Estadísticas |

## Solución de Problemas

**Error de conexión a DB:**
```bash
# Verifica que PostgreSQL esté corriendo
docker-compose -f docker-compose.dev.yml ps
```

**Cambios en código no se reflejan:**
```bash
# El hot-reload está activo, pero si hay problemas:
docker-compose -f docker-compose.dev.yml restart app
```

**Ver logs de errores:**
```bash
docker-compose -f docker-compose.dev.yml logs app
```

## Próximos Pasos

1. ✅ Autoriza la aplicación
2. ✅ Verifica que los contactos se sincronizaron
3. 📖 Lee `README_HUBSPOT_ETL.md` para detalles completos
4. 🔧 Personaliza según tus necesidades

## Notas Importantes

- El token se almacena en memoria (se pierde al reiniciar)
- La sincronización es completa (todos los contactos)
- TypeORM sincroniza el schema automáticamente en desarrollo
- Los contactos se actualizan si ya existen (upsert)

¡Listo! Tu ETL de HubSpot está funcionando 🚀
