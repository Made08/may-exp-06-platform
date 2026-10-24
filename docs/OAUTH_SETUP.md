# Configuración de OAuth (Google, GitHub, etc.)

Este documento explica cómo configurar el sistema de autenticación OAuth para el proyecto MAY-EXP-06.

## Estado Actual

⚠️ **IMPORTANTE**: Los DDLs de la base de datos para OAuth están listos y aplicados, pero la implementación de OAuth está **PAUSADA** debido a problemas de compatibilidad entre NextAuth.js y Next.js 15.

## Cambios en la Base de Datos (✅ Completado)

### Migración SQL Aplicada

La migración `database/migrations/001_add_oauth_fields.sql` ya se ha aplicado a tu base de datos Neon.

### Nuevos Campos en la Tabla `users`

- `provider`: Proveedor de autenticación ('local', 'google', 'github', 'microsoft', 'email')
- `provider_id`: ID único del usuario en el proveedor OAuth
- `name`: Nombre completo del usuario
- `avatar_url`: URL del avatar del usuario
- `email_verified`: Indica si el email ha sido verificado
- `last_login_at`: Última fecha de inicio de sesión
- `password_hash`: Ahora es nullable (opcional para usuarios OAuth)

### Índices Creados

- Índice único para combinación `provider + provider_id`
- Índice para búsquedas por email verificado

## Sistema de Autenticación Actual

Actualmente el proyecto solo soporta:
1. **Email + Contraseña** (funcional) - Endpoints existentes en `/api/auth/login` y `/api/auth/register`

## Implementación de OAuth (⏸️ Pausada)

### Por qué está pausado

NextAuth.js (la librería estándar para OAuth en Next.js) tiene problemas de compatibilidad con Next.js 15, que es la versión que usa este proyecto. El build falla con errores de tipos y runtime.

### Opciones para el futuro

Cuando NextAuth.js sea compatible con Next.js 15, o cuando decidas usar una solución alternativa:

#### Opción 1: Esperar a NextAuth.js
- Monitorea la compatibilidad de NextAuth.js con Next.js 15
- Cuando sea estable, instala: `npm install next-auth`
- Implementa la configuración en `lib/auth.config.ts`
- Crea los endpoints en `app/api/auth/[...nextauth]/route.ts`

#### Opción 2: Usar una solución alternativa
- **Auth0**: Servicio de autenticación gestionado
- **Clerk**: Alternativa moderna a NextAuth
- **Supabase Auth**: Incluye OAuth y está integrado con PostgreSQL
- **Implementación personalizada**: Usar Passport.js directamente (más complejo)

#### Opción 3: Downgrade Next.js
- Considerar downgrade a Next.js 14 (pero perderás las nuevas características de Next.js 15)

## Pasos para Implementar OAuth en el Futuro

Cuando decidas implementar OAuth, sigue estos pasos:

### 1. Configurar OAuth Providers

#### Google OAuth
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea OAuth client ID
3. Configura redirect URIs
4. Agrega a `.env.local`:
   ```
   GOOGLE_CLIENT_ID=tu_client_id
   GOOGLE_CLIENT_SECRET=tu_client_secret
   ```

#### GitHub OAuth
1. Ve a [GitHub Developer Settings](https://github.com/settings/developers)
2. Crea OAuth App
3. Configura callback URL
4. Agrega a `.env.local`:
   ```
   GITHUB_CLIENT_ID=tu_client_id
   GITHUB_CLIENT_SECRET=tu_client_secret
   ```

### 2. Instalar Dependencias
```bash
npm install next-auth
```

### 3. Crear Configuración
Crear `lib/auth.config.ts` con la configuración de NextAuth

### 4. Crear Endpoints
Crear `app/api/auth/[...nextauth]/route.ts`

### 5. Crear Página de Login
Crear `app/auth/signin/page.tsx` con botones de OAuth

### 6. Endpoint de Registro OAuth
Crear `app/api/auth/oauth-register/route.ts` para asignar organización

## Variables de Entorno Necesarias (para el futuro)

```env
# Auth (existente)
AUTH_SECRET=tu_secreto_generado_con_openssl

# OAuth Providers (cuando se implemente)
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GITHUB_CLIENT_ID=tu_github_client_id
GITHUB_CLIENT_SECRET=tu_github_client_secret
```

## Endpoints de Autenticación Actuales

- `POST /api/auth/login` - Login con email/contraseña ✅
- `POST /api/auth/register` - Registro con email/contraseña ✅
- `POST /api/auth/logout` - Cerrar sesión ✅

## Consideraciones de Seguridad

1. **AUTH_SECRET**: Genera uno seguro con `openssl rand -base64 32`
2. **Client Secrets**: Nunca los commitees al repositorio
3. **Redirect URIs**: Configura correctamente para desarrollo y producción
4. **Email Verification**: Los usuarios OAuth tendrán `email_verified = TRUE` automáticamente
5. **Provider Linking**: Considerar si permitir vincular múltiples providers al mismo email

## Recursos

- [NextAuth.js Documentation](https://authjs.dev/)
- [Next.js 15 Breaking Changes](https://nextjs.org/docs/app/building-your-application/upgrading)
- [Auth0 for Next.js](https://auth0.com/docs/quickstart/webapp/nextjs)
- [Clerk Authentication](https://clerk.com/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
