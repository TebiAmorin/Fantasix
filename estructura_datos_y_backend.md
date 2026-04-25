# Arquitectura Técnica y Base de Datos (Supabase)

## 1. Configuración de Base de Datos
- **Motor:** PostgreSQL.
- **Tablas principales:** `profiles`, `tournaments`, `teams`, `players`, `matches`.
- **Tablas relacionales:** `match_predictions`, `player_match_stats`, `fantasy_rosters`, `fantasy_picks`.

## 2. Flujo de Datos Híbrido
- El sistema debe permitir la creación manual de partidos desde el panel de Admin.
- Cada partido tiene un campo `external_stats_url` que apunta a SiegeGG para referencia del usuario.
- **Cálculo Automático:** Se recomienda usar un **Trigger de Postgres** o una **Edge Function** en Supabase para que, al insertar datos en `player_match_stats`, se actualicen automáticamente los puntos en `fantasy_picks` y la tabla de clasificación.

## 3. Jerarquía de Torneos
- Un torneo a la vez marcado como `is_active = true`.
- Los datos históricos no se borran, se filtran por `tournament_id` en el perfil del usuario.

## 4. Requerimientos de Seguridad (RLS)
- Usuarios: Solo lectura de sus propios datos y lectura pública de tablas de torneos.
- Admin: Permisos de escritura (Insert/Update/Delete) en todas las tablas excepto en los picks de los usuarios una vez empezado el partido.