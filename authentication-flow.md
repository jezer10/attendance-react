# Flujo de autenticacion para frontend (React + Vite)

Este documento describe el flujo real de autenticacion del backend y sirve para
validar la implementacion del frontend.

## Objetivo
- Obtener un access token de Supabase mediante el backend.
- Usar ese token como Bearer en endpoints protegidos.
- Renovar y cerrar sesion cuando sea necesario.

## Base URL
- `http://localhost:8000/api/v1`

## Flujo principal (happy path)
1. Login con `POST /auth/login` usando HTTP Basic (email + password).
2. Guardar `access_token` y `refresh_token`.
3. Usar `Authorization: Bearer <access_token>` en llamadas protegidas
   (`/attendance`, `/auth/me`, `/auth/logout`, etc.).
4. Si el access token expira, renovar con `GET /auth/refresh?token=<refresh>`.
5. En logout, llamar `POST /auth/logout` con el access token actual.

## Endpoints y contratos

### POST /auth/login
- Auth: HTTP Basic (email y password de Supabase).
- Request: sin body (solo header `Authorization: Basic <base64(email:password)>`).
- Response (200):
  - `user_id`, `access_token`, `refresh_token`, `token_type`.
- Errores comunes:
  - `401` credenciales invalidas.
  - `500` error interno.

Ejemplo JS (React):
```ts
const credentials = btoa(`${email}:${password}`);
const res = await fetch(`${API_BASE}/auth/login`, {
  method: "POST",
  headers: { Authorization: `Basic ${credentials}` },
});
const data = await res.json();
```

### GET /auth/refresh?token=...
- Auth: no requiere header, usa query param `token` (refresh token).
- Response (200):
  - `user_id`, `access_token`, `refresh_token`, `token_type`.
- Errores comunes:
  - `401` si falta el token.

Ejemplo JS:
```ts
const res = await fetch(`${API_BASE}/auth/refresh?token=${refreshToken}`);
const data = await res.json();
```

### POST /auth/logout
- Auth: Bearer token en header `Authorization`.
- Response (200):
  - `user_id`, `detail`.
- Errores comunes:
  - `401` token invalido o expirado.
  - `503` proveedor no disponible.

Ejemplo JS:
```ts
await fetch(`${API_BASE}/auth/logout`, {
  method: "POST",
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

### GET /auth/me
- Auth: Bearer token en header `Authorization`.
- Response (200):
  - `id`, `email`, `full_name`.
- Errores comunes:
  - `401` token invalido o expirado.

### Endpoints protegidos adicionales
- `/attendance` (GET/PUT) usa el mismo Bearer token.

## Token de prueba (solo backend/dev)
`POST /auth/token` genera un JWT firmado con `APP_JWT_SECRET_KEY`.
Ese token **no** es validado por Supabase, por lo que **no sirve** para
rutas protegidas en ambientes reales. Usar solo para pruebas internas.

## Reglas de autenticacion aplicadas en backend
- Todos los endpoints protegidos requieren `Authorization: Bearer <token>`.
- El token se valida contra Supabase (`auth.get_user(token)`).
- Si Supabase rechaza el token se devuelve `401`.

## Recomendaciones para frontend
- Guardar tokens con cuidado (preferible memoria o storage seguro).
- Reintentar una vez el refresh si recibes `401` por expiracion.
- Loggear el status code y el body del error para depuracion.

## Variables de entorno relevantes
- `APP_SUPABASE_URL`
- `APP_SUPABASE_KEY`
- `APP_SUPABASE_SERVICE_KEY`

## Checklist rapido de depuracion
- El header `Authorization` existe y tiene el prefijo `Bearer `.
- El access token viene de `/auth/login` o `/auth/refresh`.
- El refresh token no esta vencido.
- El backend apunta al proyecto correcto de Supabase.
