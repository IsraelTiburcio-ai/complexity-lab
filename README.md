# NETWORK BOMB

## Desactiva la complejidad

**Microjuego** de la colección digital de la materia **Optimización I**.
Material académico: **Gimnasio 1 — Introducción a la Teoría de Sistemas**, sección **1.4 Complejidad**.

> Una red está a punto de sobrecargarse. Responde rápido para desactivarla antes de que el tiempo termine.

---

## Concepto

NETWORK BOMB es un **arcade educativo de ~60–90 segundos**. Una sola mecánica:
cada ronda muestra una red y una pregunta sobre **relaciones** u **orden de complejidad**;
el jugador toca la respuesta correcta para dibujar las conexiones y estabilizar el dispositivo.

- **Ronda 1 ·** 3 elementos → ¿cuántas relaciones máximas? (**3**)
- **Ronda 2 ·** 4 elementos → ¿cuántas relaciones máximas? (**6**)
- **Ronda 3 ·** 6 elementos → ¿cuántas relaciones máximas? (**15**)
- **Ronda final ·** 12 elementos → ¿orden máximo de complejidad? (**C = 78**)

Al acertar, la red se dibuja ante el jugador: 3, 6, 15 y finalmente **66 relaciones**.
El impacto visual explica por qué la complejidad crece tan rápido.

### Fórmulas del material

```
R = n(n−1)/2        relaciones máximas entre n elementos
C = n + R           orden de complejidad
C = n + n(n−1)/2    complejidad máxima
```

Ejemplo final: `C = 12 + 12(11)/2 = 12 + 66 = 78`.

### Puntuación

- `+100` por acierto × **combo** (racha consecutiva: ×1, ×2, ×3, ×4).
- Respuesta incorrecta o tiempo agotado: se muestra la respuesta correcta y se continúa (sin penalización dura).
- Al terminar, el botón **VER RESPUESTAS** muestra el repaso de las 4 rondas: tu respuesta, la correcta y la fórmula — aunque hayas acertado todas.
- El récord se guarda en `localStorage`.

---

## Duración

- Partida normal: **20–40 segundos**.
- Límite máximo (contando el tiempo completo de cada ronda): **~67 segundos**.
- Siempre menor a 120 segundos.

Flujo:

```
PORTADA → DESACTIVAR RED → 4 rondas → RESULTADO → DESACTIVAR OTRA RED
```

---

## Cómo ejecutar

No requiere servidor ni compilación. Abre `index.html` en el navegador:

```bash
open index.html
```

O sírvelo localmente:

```bash
python3 -m http.server 8090
# http://localhost:8090/
```

---

## Estructura

```
.
├── index.html        # 3 pantallas: portada · juego · resultado
├── css/
│   └── game.css      # todo el estilo del minijuego
├── js/
│   ├── data.js       # rondas, opciones, respuestas, tiempos (contenido)
│   └── game.js       # lógica, red SVG, sonido, puntuación, teclado
├── .github/
│   └── workflows/pages.yml   # autodeploy a GitHub Pages
└── README.md
```

## Editar contenido

Todas las preguntas, opciones y respuestas viven en **`js/data.js`** (objeto `NB_DATA.rounds`).
Para cambiar una ronda basta editar `n`, `question`, `options`, `answer` y `feedback`.
La duración de la cuenta regresiva se ajusta con `NB_DATA.roundTime`.

---

## GitHub Pages

**https://israeltiburcio-ai.github.io/complexity-lab/**

El sitio se publica automáticamente con **GitHub Actions** en cada push a `main`:

```
push a main → GitHub Actions → GitHub Pages
```

Todas las rutas son relativas, por lo que funciona bajo `/complexity-lab/` sin configuración adicional.

---

## Historial

La versión anterior (Complexity Lab, laboratorio completo) está preservada bajo el tag
**`legacy-v1`** y la rama **`archive/legacy-v1`** del mismo repositorio.

**Optimización I — Gimnasio 1 · Introducción a la Teoría de Sistemas**
