# Contexto del Proyecto: Fantasix (Portal R6 Esports & Fantasy League)

## 1. Concepto de Marca y UX/UI
Desarrollo de una plataforma web gamificada para el ecosistema competitivo de Rainbow Six Siege, comenzando con el MVP para el **BLAST R6 Major de Salt Lake City 2026**.
- **Nombre de la App:** Fantasix (Fantasy + R6).
- **Estilo Visual:** "Premium Tactical". Elegante, nocturno, inspirado en operaciones encubiertas y prestigio de esports.
- **Paleta de Colores (Tailwind Tokens):**
  - Background (Deep Void): `#0A0B10` (Azul/morado casi negro para fondo principal).
  - Surface (Card): `#151226` (Morado noche para tarjetas y contenedores).
  - Primary (Champion Gold): `#FBBF24` (Dorado para botones principales, MVPs, prestigio).
  - Secondary (Neon Purple): `#8B5CF6` (Morado eléctrico para barras, acentos y enlaces).
  - Text Primary: `#F8FAFC` (Blanco puro/azulado para títulos).
  - Text Secondary: `#94A3B8` (Gris azulado para estadísticas).
- **Tipografía:** 
  - Títulos: `Rajdhani` (Estilo militar/esports).
  - Interfaz: `Inter` (Limpia y moderna).
  - Estadísticas: `Roboto Mono` (Para alinear perfectamente los números en tablas).
- **UX:** Mobile-First, centrado en legibilidad de tablas y tarjetas de jugadores.

## 2. Stack Tecnológico y Arquitectura
- **Frontend & Framework:** Next.js (App Router) + TypeScript.
- **Estilos y UI:** Tailwind CSS + shadcn/ui.
- **Backend & Base de Datos:** Supabase (PostgreSQL).
- **Autenticación:** Supabase Auth (Integración obligatoria con Discord, Twitch y Google).
- **Hosting:** Vercel.
- **Estructura de Carpetas (Next.js):**
  - `app/(public)`: Home, torneos, leaderboards, perfiles, fantasy.
  - `app/(admin)`: Rutas protegidas (CMS manual) para introducción de stats.
  - `app/api`: Webhooks o cálculos del lado del servidor.

## 3. Lógica de Juego (Gamificación)

### A. Sistema de Predicciones (Pick'Em - Fase 1)
- Votación del equipo ganador de cada partido.
- Posibilidad de exportar gráficamente el ranking a X (Twitter).

### B. Liga Fantasy (Fase 2)
- **Formato:** Fase 1 (Bracket Doble eliminacion) -> Fase Suiza -> Playoffs.
- **Draft:** Cada usuario tiene que fichar a 5 jugadores profesionales.
- **Full Redraft:** Al finalizar cada fase, el mercado se reabre y los usuarios pueden rehacer sus rosters por completo para los Playoffs sin penalización.
- **Scoring Matrix (Matriz de Puntos):**
  - Kill: +2
  - Death: -1
  - Entry Kill: +2 (Acumula +4 total por la kill)
  - Entry Death: -1 (Acumula -2 total por la muerte)
  - Plant / Defuse: +4
  - Clutch 1vsX: +3 por cada enemigo vivo superado (1v1 = +3, 1v2 = +6).
  - KOST: Valor decimal * 10 (Ej: KOST de 0.85 = 8.5 puntos).
  - Survival: +1 por cada ronda sobrevivida.

## 4. Gestión de Datos y Modo Admin
- **Solo un torneo activo** a la vez (`is_active: true`). Los perfiles guardan el historial.
- **No scraper bots:** Para evitar inestabilidad, la ingesta de estadísticas es manual.
- El Admin selecciona un partido finalizado e introduce solo las métricas de la "Scoring Matrix" para los 10 jugadores.
- Base de datos calcula los puntos totales del Fantasy automáticamente (preferiblemente vía Postgres Triggers).
- Para estadísticas profundas de los partidos, se incluirá un link externo (`external_stats_url`) apuntando a SiegeGG.

## 5. Esquema de Base de Datos Relacional (Supabase)

**Tablas Core:**
1. `profiles`: id (Auth), username, avatar_url, created_at.
2. `tournaments`: id, name, slug, is_active, start_date, end_date.
3. `teams`: id, name, region, logo_url.
4. `matches`: id, tournament_id, team_a_id, team_b_id, status, winner_id, external_stats_url.
5. `match_predictions`: id, user_id, match_id, predicted_winner_id, points.

**Tablas Fantasy:**
6. `players`: id, team_id, nickname, role, fantasy_cost.
7. `player_match_stats`: id, match_id, player_id, kills, deaths, entry_kills, entry_deaths, kost, plants, clutches, rounds_survived, fantasy_points_earned.
8. `fantasy_rosters`: id, user_id, tournament_id, budget_spent.
9. `fantasy_picks`: id, roster_id, player_id, is_captain.

## 6. Instrucciones para el Asistente IA
Actúa como Desarrollador Full-Stack Senior. Utiliza este documento como fuente de verdad absoluta para el proyecto "Fantasix". Prioriza código modular, componentes reutilizables (shadcn), consultas SQL eficientes y el uso de Server Actions en Next.js.