# COMPLEXITY LAB

## Laboratorio de Complejidad de Sistemas

**Actividad / Juego 4** de la colección digital de la materia **Optimización I**.

Material académico: **Gimnasio 1 — Introducción a la Teoría de Sistemas**, sección **1.4 Complejidad**.

> Experimenta visualmente cómo crece la complejidad de un sistema cuando aumentan sus elementos y, sobre todo, sus relaciones.

---

## Propósito

Complexity Lab es un **laboratorio interactivo de redes** donde el estudiante construye sistemas nodo por nodo y relación por relación. En lugar de memorizar una fórmula, la descubre físicamente: cada elemento nuevo puede conectarse con todos los que ya existían, y las líneas empiezan a dominar la red.

El objetivo pedagógico central:

> **Agregar un elemento puede generar varias relaciones nuevas.**

y la conclusión:

> La complejidad de un sistema no depende únicamente de la cantidad de elementos, sino también de las relaciones existentes entre ellos.

---

## Contenido académico

Se trabaja la terminología de la sección 1.4 del Gimnasio 1:

- **Elementos** — los componentes del sistema (nodos).
- **Relaciones** — conexiones entre pares de elementos (aristas).
- **Orden de complejidad** — C = n + R (elementos + relaciones).
- **Sistema simple** — pocos elementos y pocas relaciones.
- **Sistema complejo** — más elementos y/o muchas relaciones.
- **Sinergia** — el comportamiento del conjunto surge de la interacción entre sus partes.

### Fórmulas del material

Número máximo de relaciones entre `n` elementos distintos:

```
R = n(n−1)/2
```

Orden de complejidad:

```
C = n + R
```

Con todas las relaciones posibles:

```
C = n + n(n−1)/2
```

Ejemplo del Gimnasio (n = 12):

```
R = 12(11)/2 = 66
C = 12 + 66 = 78
```

---

## Contenido del juego

| # | Estación | Qué hace |
|---|----------|----------|
| — | Inicio | Landing, continuar, tutorial, mapa, sonido, reinicio |
| — | Intro animada | Nodos separados → se conectan: 2→1, 5→10, 10→45, y *¿Por qué crece tan rápido?* |
| — | Tutorial | 4 pasos interactivos guiados |
| 01 | Elementos | Agregar/quitar/reiniciar elementos; transición *Activar relaciones* |
| 02 | Relaciones | Slider 1–20, modos *parciales/máximas*, analizador matemático, gráfica, *Ver crecimiento* |
| 03 | Orden de complejidad | Bloques animados de elementos y relaciones, C = n + R, proporción R/C |
| 04 | Simple vs. Complejo | Dos sistemas manipulables, desafío de comparación y escenario "mismos elementos" |
| 05 | Sinergia | Equipo de trabajo (análisis, diseño, desarrollo, pruebas): partes + relaciones → comportamiento del conjunto |
| 06 | Cámara de desafíos | 7 retos: C=10, red completa de 5, reparar 6→15, faltantes 8→28, n=12→C=78, inverso C=21, ejemplo C=20 |
| 07 | Protocolo Caos | Experimento final por etapas con predicción antes de simular |
| 08 | Resultados | Análisis completado, precisión de predicciones, desafíos, pistas |
| — | Logros | 8 logros con iconografía propia |
| — | Modo Libre | Sandbox sin puntuación: 1–20 elementos, layouts, congelar, etiquetas, gráfica, fórmulas |

---

## Cómo ejecutar

No requiere servidor ni compilación. Abre `index.html` en el navegador (también funciona con `file://`):

```bash
open index.html
```

O sírvelo localmente si prefieres:

```bash
python3 -m http.server 8080
# abre http://localhost:8080
```

### Publicar en GitHub Pages

El sitio se publica automáticamente con **GitHub Actions** en cada push a `main`:

```
push a main → GitHub Actions → GitHub Pages
```

URL pública:

**https://israeltiburcio-ai.github.io/complexity-lab/**

Repositorio:

**https://github.com/IsraelTiburcio-ai/complexity-lab**

El flujo vive en `.github/workflows/pages.yml` (`actions/checkout` → `configure-pages` → `upload-pages-artifact` → `deploy-pages`). También puede dispararse manualmente desde *Actions → Deploy GitHub Pages → Run workflow*.

Todas las rutas del juego son **relativas** (`css/…`, `js/…`, `data/…`), por lo que funciona correctamente bajo el subdirectorio `/complexity-lab/` sin configuración adicional. La navegación es por estado interno (no usa rutas URL), así que recargar la página no genera 404.

No hay backend ni dependencias externas; solo las fuentes de Google Fonts (con respaldo local si no hay red).

---

## Arquitectura

```
.
├── index.html              # SPA: pantallas, HUD, modales
├── README.md
├── css/
│   ├── variables.css       # tokens de diseño (paleta cuántica)
│   ├── base.css            # reset, tipografía, fondo
│   ├── layout.css          # HUD, rejilla del laboratorio
│   ├── components.css      # botones, paneles, contadores, fórmula, logros
│   ├── network.css         # el reactor: nodos, aristas, pulsos
│   ├── charts.css          # gráfica de crecimiento
│   ├── animations.css      # keyframes + prefers-reduced-motion
│   └── responsive.css      # desktop / tablet / móvil / touch
├── js/
│   ├── app.js              # arranque, navegación, intro, tutorial, mapa
│   ├── state.js            # estado central
│   ├── storage.js          # localStorage
│   ├── router.js           # pantallas con limpieza de recursos
│   ├── math.js             # MOTOR MATEMÁTICO (única fuente de verdad)
│   ├── networkEngine.js    # red SVG interactiva (el reactor)
│   ├── layoutEngine.js     # circular · orgánica · cuadrícula · radial
│   ├── charts.js           # gráfica SVG ligera
│   ├── labPanel.js         # contadores, analizador, bloques, slider
│   ├── experiments.js      # experimentos 01–05
│   ├── challenges.js       # motores de desafíos + ayudas escalonadas
│   ├── final.js            # Protocolo Caos + resultados
│   ├── sandbox.js          # modo libre
│   ├── scoring.js          # puntos, racha, predicciones, pistas
│   ├── achievements.js     # lógica de logros
│   ├── audio.js            # efectos WebAudio procedurales
│   └── ui.js               # iconos SVG propios, toasts, modales, DOM
└── data/
    ├── achievements.js     # definiciones de logros (datos)
    ├── experiments.js      # metadatos de experimentos (datos)
    └── challenges.js       # desafíos como datos (id, tipo, parámetros, pistas)
```

Se usa **Vanilla JavaScript** (ES6+), **SVG** para la red y los gráficos, y **CSS3**. No hay frameworks.

---

## Motor matemático (única fuente de verdad)

Todos los cálculos viven en `js/math.js` y no se duplican en el resto del código:

```js
CL.Math.maxRelations(n)    // n(n−1)/2
CL.Math.complexity(n, r)   // n + r
CL.Math.maxComplexity(n)   // n + n(n−1)/2
CL.Math.edgeKey(a, b)      // clave canónica de una arista (a < b)
CL.Math.canonicalPair(a,b) // par ordenado {a, b}
```

Invariantes garantizados por diseño:

- La arista `A-B` es idéntica a `B-A` (clave canónica única).
- No se permiten auto-relaciones `A-A` (`edgeKey` devuelve `null`).
- No se permiten duplicados.
- Al eliminar elementos se eliminan sus relaciones huérfanas.

---

## Desafíos como datos

Cada desafío se define en `data/challenges.js` con un `type` que lo conecta a un motor de `js/challenges.js`:

```js
{
  id: "all-relations-5",
  type: "complete-network",     // motor
  name: "GENERA TODAS LAS RELACIONES",
  desc: "Con 5 elementos, conéctalos todos con todos…",
  points: 150,
  params: { n: 5, targetRelations: 10, initialEdges: [], fullNetwork: true },
  hints: ["Pista 1…", "Pista 2…", "Pista 3…"],
  success: "Feedback educativo…"
}
```

### Añadir un desafío

1. Agrega la entrada en `data/challenges.js` (id único, tipo, parámetros, pistas).
2. Si usas un tipo nuevo, crea el motor correspondiente en `js/challenges.js` y regístralo en el objeto `ENGINES`.
3. La cámara, el desbloqueo secuencial, la puntuación y el logro *Maestro de la Complejidad* lo reconocen automáticamente (el logro exige completar **7**; ajusta el contador si agregas más).

### Modificar contenido

- Textos académicos de los experimentos: `data/experiments.js` y los `coach()` de `js/experiments.js`.
- Pistas y feedback de desafíos: `data/challenges.js`.
- Paleta y estilos: `css/variables.css`.
- Logros: `data/achievements.js` (cada logro recibe el estado global y devuelve `true/false`).

---

## Progreso

El progreso se guarda en `localStorage` bajo la clave `complexityLab.save.v4`:

- avance por experimento y desafío;
- puntuación total y racha;
- logros desbloqueados;
- mejor precisión de predicciones;
- tutorial visto;
- configuración de sonido y etiquetas;
- desbloqueo del Modo Libre.

El botón **CONTINUAR EXPERIMENTO** del inicio reanuda la última sesión. **REINICIAR LABORATORIO** borra todo mediante un modal propio (sin `alert`/`confirm`).

---

## Pruebas

El proyecto se validó con:

- `node --check` de todos los archivos JS.
- Pruebas unitarias del motor matemático (R de 1 a 20, C=78, claves canónicas, auto-relación).
- Pruebas de humo en navegador headless (Chrome) cubriendo: navegación por todas las pantallas, agregar/quitar elementos, conexión y desconexión, duplicados, auto-relación, conectividad máxima, relaciones parciales, fórmula, gráfica, slider, layouts, predicciones, desafíos (incluidos C=78 y C=20), sandbox, logros, puntuación, almacenamiento y continuar.

En la consola del navegador puedes ejecutar:

```js
ComplexityLab.math.maxRelations(12)   // 66
__complexityLab.test()                // auto-prueba rápida
```

---

## Notas académicas

La terminología (elementos, relaciones, orden de complejidad, sinergia, sistema simple/complejo) y las fórmulas siguen la sección **1.4 Complejidad** del material de la cátedra. La actividad de sinergia usa un ejemplo cotidiano (equipo de trabajo) para visualizar que *el comportamiento del conjunto surge de la interacción entre sus partes*, sin afirmar métricas académicas que no estén en el material.

**Optimización I — Gimnasio 1 · Introducción a la Teoría de Sistemas**
