-- ============================================================================
-- Migración 001: Agregar campos OAuth a la tabla users
-- ============================================================================
-- Esta migración agrega soporte para autenticación OAuth (Google, GitHub, etc.)
-- manteniendo compatibilidad con el sistema existente de email/contraseña.

-- Agregar campos OAuth a la tabla users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS provider TEXT CHECK (provider IN ('local', 'google', 'github', 'microsoft', 'email')),
ADD COLUMN IF NOT EXISTS provider_id TEXT,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Crear índice único para combinación provider + provider_id (para OAuth)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id) WHERE provider IS NOT NULL AND provider_id IS NOT NULL;

-- Crear índice para búsquedas por email verificado
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email) WHERE email_verified = TRUE;

-- Comentario sobre la migración
COMMENT ON COLUMN users.provider IS 'Proveedor de autenticación: local (email/pass), google, github, microsoft, email (magic link)';
COMMENT ON COLUMN users.provider_id IS 'ID único del usuario en el proveedor OAuth';
COMMENT ON COLUMN users.name IS 'Nombre completo del usuario (opcional para local, requerido para OAuth)';
COMMENT ON COLUMN users.avatar_url IS 'URL del avatar del usuario (opcional)';
COMMENT ON COLUMN users.email_verified IS 'Indica si el email ha sido verificado (siempre TRUE para OAuth)';
COMMENT ON COLUMN users.last_login_at IS 'Última fecha de inicio de sesión';
