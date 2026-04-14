# TFT Composition Overlay

Base inicial para una app de Overwolf orientada a Teamfight Tactics con overlay in-game.

## Qué incluye

- Ventana `overlay` transparente y pensada para vivir encima del juego.
- Ventana `desktop` para control, debug y pruebas.
- Ventana `background` que orquesta Overwolf, hotkeys y suscripción a eventos.
- Normalización básica de datos de TFT para `me`, `match_info`, `store`, `board` y `bench`.
- Modo mock para iterar UI sin arrancar el juego.

## Estructura

```text
manifest.json
app/
  background.html
  background.js
  desktop.html
  desktop.css
  desktop.js
  overlay.html
  overlay.css
  overlay.js
common/
  tft-state.js
```

## Cómo probarlo

1. Abre Overwolf.
2. Carga esta carpeta como app unpacked.
3. Lanza la ventana `desktop`.
4. Usa `Cargar datos mock` para validar el layout del overlay.
5. En partida real, revisa si llegan datos de `shop`, `bench`, `board` y `xp`.

## Limitaciones actuales

- No hay assets ni splash art de campeones todavía.
- El mapeo de ids a nombres es heurístico y hay que sustituirlo por datos reales del set.
- No se incluyen `augments` visibles al jugador para evitar incumplimientos con Riot/Overwolf.
- La persistencia de preferencias del overlay todavía no está implementada.

## Siguiente implementación recomendada

1. Añadir catálogo estático de campeones, costes, rasgos e iconos.
2. Guardar posición, tamaño y secciones visibles del overlay.
3. Añadir filtros visuales por coste, rol o rasgo.
4. Endurecer el parsing de eventos y registrar errores en una vista de debug.
