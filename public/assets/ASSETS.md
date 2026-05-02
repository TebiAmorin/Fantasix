# Fantasix — Assets Checklist
## BLAST R6 Major Salt Lake City 2026

> **Instrucciones de entrega:**
> - Coloca cada archivo en la ruta exacta indicada (relativa a `/public/`)
> - Formato preferido: **SVG** para logos vectoriales, **PNG** con fondo transparente para el resto
> - Los logos de equipos deben estar optimizados para fondo oscuro (versión dark/mono si existe)
> - Dimensiones mínimas indicadas — no subas nada más pequeño
> - Después de subir, corre: `vercel deploy --prod`

---

## 1. LOGOS DE EQUIPOS — 20 equipos

Ruta base: `public/assets/teams/`
Formato: PNG transparente o SVG · Mínimo **256×256 px** · Versión dark/blanca preferida

| Archivo | Equipo | Región | PandaScore ID | Estado |
|---|---|---|---|---|
| `assets/teams/g2.png` | G2 Esports | EU | 126940 | ⬜ pendiente |
| `assets/teams/vp.png` | Virtus.pro | EU | — | ⬜ pendiente |
| `assets/teams/5f.png` | Five Fears | EU | — | ⬜ pendiente |
| `assets/teams/wc.png` | Wildcard | NA | — | ⬜ pendiente |
| `assets/teams/dz.png` | DarkZero | NA | — | ⬜ pendiente |
| `assets/teams/sho.png` | Shopify Rebellion | NA | 136374 | ⬜ pendiente |
| `assets/teams/elv.png` | Elevate | NA | — | ⬜ pendiente |
| `assets/teams/fur.png` | FURIA | BR | 127596 | ⬜ pendiente |
| `assets/teams/nip.png` | Ninjas in Pyjamas | BR | 126934 | ⬜ pendiente |
| `assets/teams/faze.png` | FaZe Clan | BR | 126927 | ⬜ pendiente |
| `assets/teams/los.png` | Los Grandes | LATAM | — | ⬜ pendiente |
| `assets/teams/fal.png` | Team Falcons | MENA | — | ⬜ pendiente |
| `assets/teams/wbg.png` | Weibo Gaming | APAC | 137039 | ⬜ pendiente |
| `assets/teams/day.png` | Daystar | APAC | — | ⬜ pendiente |
| `assets/teams/cag.png` | CAG Osaka | APAC | 127170 | ⬜ pendiente |
| `assets/teams/ent.png` | ENTERPRISE Esports | APAC | 137051 | ⬜ pendiente |
| `assets/teams/ag.png` | All Gamers | CN | — | ⬜ pendiente |
| `assets/teams/edg.png` | EDward Gaming | CN | — | ⬜ pendiente |
| `assets/teams/4am.png` | Four Angry Men | CN | — | ⬜ pendiente |
| `assets/teams/wlv.png` | Wolves Esports | CN | — | ⬜ pendiente |

> **Nota:** Los 7 equipos con PandaScore ID se auto-poblarán desde la API cuando haya datos de SLC 2026.
> Los 13 sin ID hay que subirlos manualmente y actualizar `logo_url` en la DB.

---

## 2. FOTOS DE JUGADORES — 5 por equipo = 100 fotos

Ruta base: `public/assets/players/`
Formato: PNG/JPG · Mínimo **400×400 px** · Recorte busto/cara · Fondo oscuro o transparente

### Formato de nombre de archivo
`{short_name_equipo_lowercase}_{nickname_lowercase}.png`

Ejemplo: `g2_kantoraketti.png`, `faze_nesk.png`

| Equipo | Jugadores necesarios |
|---|---|
| G2 Esports (g2) | ⬜ g2_kantoraketti · g2_pl1nk · g2_w1dow · g2_lotus · g2_shlaa |
| Virtus.pro (vp) | ⬜ 5 jugadores de la roster SLC 2026 |
| Five Fears (5f) | ⬜ 5 jugadores de la roster SLC 2026 |
| Wildcard (wc) | ⬜ 5 jugadores de la roster SLC 2026 |
| DarkZero (dz) | ⬜ 5 jugadores de la roster SLC 2026 |
| Shopify Rebellion (sho) | ⬜ 5 jugadores de la roster SLC 2026 |
| Elevate (elv) | ⬜ 5 jugadores de la roster SLC 2026 |
| FURIA (fur) | ⬜ 5 jugadores de la roster SLC 2026 |
| Ninjas in Pyjamas (nip) | ⬜ 5 jugadores de la roster SLC 2026 |
| FaZe Clan (faze) | ⬜ 5 jugadores de la roster SLC 2026 |
| Los Grandes (los) | ⬜ 5 jugadores de la roster SLC 2026 |
| Team Falcons (fal) | ⬜ 5 jugadores de la roster SLC 2026 |
| Weibo Gaming (wbg) | ⬜ 5 jugadores de la roster SLC 2026 |
| Daystar (day) | ⬜ 5 jugadores de la roster SLC 2026 |
| CAG Osaka (cag) | ⬜ 5 jugadores de la roster SLC 2026 |
| ENTERPRISE Esports (ent) | ⬜ 5 jugadores de la roster SLC 2026 |
| All Gamers (ag) | ⬜ 5 jugadores de la roster SLC 2026 |
| EDward Gaming (edg) | ⬜ 5 jugadores de la roster SLC 2026 |
| Four Angry Men (4am) | ⬜ 5 jugadores de la roster SLC 2026 |
| Wolves Esports (wlv) | ⬜ 5 jugadores de la roster SLC 2026 |

> **Fuente sugerida:** Liquipedia R6 · BLAST.tv · Siegegg.com

---

## 3. BRANDING DEL EVENTO

Ruta base: `public/assets/event/`

| Archivo | Descripción | Dimensiones | Estado |
|---|---|---|---|
| `assets/event/blast-logo.svg` | Logo BLAST horizontal (blanco) | vectorial | ⬜ pendiente |
| `assets/event/blast-icon.svg` | Ícono BLAST solo (para favicon/badge) | vectorial | ⬜ pendiente |
| `assets/event/r6-logo.svg` | Logo Rainbow Six Siege (blanco/color) | vectorial | ⬜ pendiente |
| `assets/event/slc-banner.jpg` | Banner del evento SLC 2026 (foto/arte) | 1920×640 px | ⬜ pendiente |
| `assets/event/slc-logo.png` | Logo "BLAST R6 Major SLC 2026" completo | 800×400 px | ⬜ pendiente |

---

## 4. SEO / SOCIAL

Ruta base: `public/`

| Archivo | Descripción | Dimensiones | Estado |
|---|---|---|---|
| `og-image.png` | Open Graph — se ve al compartir en redes | **1200×630 px** | ⬜ pendiente |
| `favicon.ico` | Favicon clásico (multi-size embebido) | 16/32/48 px | ⬜ pendiente |
| `icon-192.png` | PWA icon (Android homescreen) | 192×192 px | ⬜ pendiente |
| `icon-512.png` | PWA icon grande | 512×512 px | ⬜ pendiente |
| `apple-touch-icon.png` | iOS homescreen icon | 180×180 px | ⬜ pendiente |

> **og-image.png**: Debe mostrar el título "FANTASIX · Pick'Em", el logo BLAST, y la fecha May 8–17. Fondo oscuro con gradiente azul/dorado.

---

## 5. SONIDOS UI

Ruta base: `public/assets/sounds/`
Formato: **WebM** (primary) + **MP3** (fallback) · Duración < 1s · Volumen normalizado a -12 dBFS

| Archivo | Uso | Duración | Estado |
|---|---|---|---|
| `assets/sounds/pick-confirm.webm` | Al hacer click en un equipo y guardar pick | ~150ms | ⬜ pendiente |
| `assets/sounds/pick-confirm.mp3` | Fallback MP3 | ~150ms | ⬜ pendiente |
| `assets/sounds/pick-lock.webm` | Al bloquear picks (match goes live) | ~200ms | ⬜ pendiente |
| `assets/sounds/pick-lock.mp3` | Fallback MP3 | ~200ms | ⬜ pendiente |
| `assets/sounds/result-correct.webm` | Predicción correcta revelada | ~400ms | ⬜ pendiente |
| `assets/sounds/result-correct.mp3` | Fallback MP3 | ~400ms | ⬜ pendiente |
| `assets/sounds/result-wrong.webm` | Predicción incorrecta revelada | ~300ms | ⬜ pendiente |
| `assets/sounds/result-wrong.mp3` | Fallback MP3 | ~300ms | ⬜ pendiente |

> **Fuentes gratuitas sugeridas:** freesound.org · zapsplat.com · mixkit.co (licencia libre)

---

## 6. DESPUÉS DE SUBIR LOS LOGOS

Una vez que hayas subido los logos a `/public/assets/teams/`, hay que actualizar `logo_url` en la DB para los equipos sin PandaScore ID.

Ejecuta este SQL en Supabase SQL Editor (ajustando rutas):

```sql
UPDATE teams SET logo_url = '/assets/teams/vp.png'    WHERE short_name = 'VP';
UPDATE teams SET logo_url = '/assets/teams/5f.png'     WHERE short_name = '5F';
UPDATE teams SET logo_url = '/assets/teams/wc.png'     WHERE short_name = 'WC';
UPDATE teams SET logo_url = '/assets/teams/dz.png'     WHERE short_name = 'DZ';
UPDATE teams SET logo_url = '/assets/teams/elv.png'    WHERE short_name = 'ELV';
UPDATE teams SET logo_url = '/assets/teams/los.png'    WHERE short_name = 'LOS';
UPDATE teams SET logo_url = '/assets/teams/fal.png'    WHERE short_name = 'FAL';
UPDATE teams SET logo_url = '/assets/teams/day.png'    WHERE short_name = 'DAY';
UPDATE teams SET logo_url = '/assets/teams/ag.png'     WHERE short_name = 'AG';
UPDATE teams SET logo_url = '/assets/teams/edg.png'    WHERE short_name = 'EDG';
UPDATE teams SET logo_url = '/assets/teams/4am.png'    WHERE short_name = '4AM';
UPDATE teams SET logo_url = '/assets/teams/wlv.png'    WHERE short_name = 'WLV';
-- Los equipos con pandascore_id se auto-populan con el primer sync de SLC 2026:
-- G2 (126940), Shopify (136374), FURIA (127596), NIP (126934), FaZe (126927),
-- Weibo (137039), CAG (127170), ENTERPRISE (137051)
```

---

## 7. ICONOS UI — Sistema de iconos propio

> Los iconos de abajo ya existen como **SVG prototipo** en `public/assets/icons/` y como **componentes React** en `components/icons/rank-icons.tsx`.
> Si tienes versiones finales (más pulidas, de un diseñador), reemplaza los SVG en sus rutas y los componentes actualizarán automáticamente.

Ruta: `public/assets/icons/`

| Archivo | Componente React | Uso en la app | Estado |
|---|---|---|---|
| `rank-1-crown.svg` | `<CrownIcon />` | Leaderboard — fila rank 1 | ✅ prototipo creado |
| `rank-2-medal.svg` | `<SilverMedalIcon />` | Leaderboard — fila rank 2 | ✅ prototipo creado |
| `rank-3-medal.svg` | `<BronzeMedalIcon />` | Leaderboard — fila rank 3 | ✅ prototipo creado |
| `streak-lightning.svg` | `<StreakIcon />` | Perfil / stats — racha de aciertos consecutivos | ✅ prototipo creado |
| `pick-correct.svg` | `<PickCorrectIcon />` | Predicciones — resultado correcto | ✅ prototipo creado |
| `pick-wrong.svg` | `<PickWrongIcon />` | Predicciones — resultado incorrecto | ✅ prototipo creado |
| `picks-locked.svg` | `<LockedIcon />` | Predicciones — picks bloqueados | ✅ prototipo creado |
| `target-crosshair.svg` | `<TargetIcon />` | Pick'Em badges / CTAs | ✅ prototipo creado |
| `trophy.svg` | `<TrophyIcon />` | Cabecera leaderboard / banners ganadores | ✅ prototipo creado |

### Iconos pendientes (futuras funciones)

| Archivo sugerido | Componente React | Uso futuro | Estado |
|---|---|---|---|
| `share.svg` | `<ShareIcon />` | Botón "Share my picks" | ⬜ pendiente |
| `bell.svg` | `<NotifIcon />` | Notificaciones de partido en directo | ⬜ pendiente |
| `fire.svg` | `<FireIcon />` | Streak visual alternativo (estilo llama) | ⬜ pendiente |
| `phase-playins.svg` | `<PlayinsIcon />` | Badge de fase Playins en tab | ⬜ pendiente |
| `phase-swiss.svg` | `<SwissIcon />` | Badge de fase Swiss Stage | ⬜ pendiente |
| `phase-playoffs.svg` | `<PlayoffsIcon />` | Badge de fase Playoffs | ⬜ pendiente |

### Especificaciones de diseño para versión final

```
ViewBox:       24×24 (todos los iconos)
Stroke width:  1.5px stroked / fill para iconos de estado (correct, wrong)
Color:         currentColor — se colorean con clases Tailwind (text-gold, text-success…)
Estilo:        Geométrico / línea fina — coherente con la estética del navbar (escudo) y cards
Exportar como: SVG optimizado (sin clases, sin estilos inline, sin inkscape:*)
Sin emojis, sin rellenos flat cartoon, sin sombras internas complejas
```

### Cómo reemplazar un icono prototipo

1. Diseña el SVG final con viewBox="0 0 24 24" y usa `currentColor`
2. Reemplaza el archivo en `public/assets/icons/{nombre}.svg`
3. Actualiza el path SVG correspondiente en `components/icons/rank-icons.tsx`
4. Los componentes que usan el icono (`leaderboard/page.tsx`, `prediction-card.tsx`, etc.) no necesitan cambios

---

## 8. PRIORIDAD DE ENTREGA

```
CRÍTICO (antes del 8 de mayo):
  ✦ Logos de equipos — 20 PNGs
  ✦ og-image.png — para compartir en redes
  ✦ favicon.ico

IMPORTANTE (antes del 8 de mayo):
  ✦ Photos de jugadores — 100 fotos
  (necesarias para la sección Fantasy)
  ✦ Iconos UI versión final (opcional — ya hay prototipos en components/icons/)

NICE-TO-HAVE (durante el evento):
  ✦ Sonidos UI
  ✦ Branding del evento (banner, logos)
```

---

*Generado automáticamente · Fantasix · BLAST R6 Major SLC 2026*
