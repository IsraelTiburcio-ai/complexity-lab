/* ============================================================
   COMPLEXITY LAB · data/challenges.js
   Desafíos de la Cámara. Datos separados de su lógica.
   ============================================================ */
(function (CL) {
  "use strict";

  CL.Challenges = CL.Challenges || {};

  /* Cada desafío:
     id, type (motor), name, desc, points (primer intento),
     params (según motor), hints (pistas progresivas),
     success (feedback educativo), steps para AYUDAS */
  CL.Challenges.DEFS = [
    {
      id: "build-c10",
      type: "build-complexity",
      name: "CONSTRUYE C = 10",
      icon: "build",
      desc: "Construye una red donde elementos + relaciones sea igual a 10. Hay varias soluciones: el sistema solo exige que n + R = 10.",
      points: 150,
      params: { targetC: 10, minNodes: 1, maxNodes: 8 },
      hints: [
        "Identifica primero cuántos elementos hay.",
        "Para contar todas las relaciones posibles entre n elementos utiliza n(n−1)/2. Para las parciales, basta contar las líneas dibujadas.",
        "Sustituye en C = n + R y suma tus valores actuales."
      ],
      success: "Correcto. Tu red cumple C = n + R = 10. Ese orden de complejidad se puede alcanzar con distintas redes: la fórmula valida lo construido, no una configuración fija."
    },
    {
      id: "all-relations-5",
      type: "complete-network",
      name: "GENERA TODAS LAS RELACIONES",
      icon: "mesh",
      desc: "Con 5 elementos, conéctalos todos con todos. La red quedará completa cuando R = 5(4)/2 = 10.",
      points: 150,
      params: { n: 5, targetRelations: 10, initialEdges: [], fullNetwork: true },
      hints: [
        "Identifica primero cuántos elementos hay.",
        "Para contar todas las relaciones posibles utiliza n(n−1)/2.",
        "Sustituye: R = 5(4)/2 = 10. Conecta cada elemento con los 4 restantes."
      ],
      success: "Red completa. Con 5 elementos existen 10 relaciones distintas entre pares de elementos: R = 5(4)/2 = 10."
    },
    {
      id: "repair-network",
      type: "complete-network",
      name: "REPARA LA RED",
      icon: "wrench",
      desc: "La red debería tener 15 relaciones máximas con 6 elementos, pero faltan conexiones. Encuéntralas y complétala: 15/15.",
      points: 150,
      params: { n: 6, targetRelations: 15, missing: [ [1, 4], [2, 5], [3, 6], [1, 6], [2, 4] ], fullNetwork: true },
      hints: [
        "Identifica primero cuántos elementos hay y cuántas relaciones lleva la red.",
        "Para contar todas las relaciones posibles utiliza n(n−1)/2.",
        "Con 6 elementos el máximo es R = 6(5)/2 = 15. Compara qué pares aún no están conectados."
      ],
      success: "Red reparada: 15/15. Con 6 elementos el máximo de relaciones entre pares distintos es 15."
    },
    {
      id: "missing-8-23",
      type: "complete-network",
      name: "¿CUÁNTAS FALTAN?",
      icon: "search",
      desc: "Un sistema de 8 elementos tiene 23 relaciones. El máximo posible es 28. Añade las faltantes sobre la propia red.",
      points: 150,
      params: { n: 8, targetRelations: 28, initialCount: 23, fullNetwork: true },
      hints: [
        "Identifica primero cuántos elementos hay.",
        "Para contar todas las relaciones posibles utiliza n(n−1)/2.",
        "Con 8 elementos el máximo es R = 8(7)/2 = 28. Como ya hay 23, faltan 28 − 23 = 5."
      ],
      success: "Perfecto: 28/28. Con 8 elementos el máximo es R = 8(7)/2 = 28. Alcanzaste el máximo agregando exactamente las 5 que faltaban."
    },
    {
      id: "case12",
      type: "estimate-reveal",
      name: "n = 12",
      icon: "reaction",
      desc: "El clásico del Gimnasio. Estima cuántas relaciones máximas y luego observa el crecimiento hasta C = 78.",
      points: 200,
      params: { n: 12, revealRel: 66, revealC: 78, steps: [2, 4, 8, 12] },
      hints: [
        "Identifica primero cuántos elementos hay.",
        "Para contar todas las relaciones posibles utiliza n(n−1)/2.",
        "Sustituye: R = 12(11)/2 = 66 y C = 12 + 66 = 78."
      ],
      success: "Excelente. Con 12 elementos las relaciones máximas son R = 12(11)/2 = 66 y el orden de complejidad C = 12 + 66 = 78. Las relaciones representan la mayor parte de esa complejidad."
    },
    {
      id: "inverse-c21",
      type: "inverse-slider",
      name: "C = 21 INVERSO",
      icon: "dial",
      desc: "Este sistema tiene orden de complejidad máxima C = 21. Descúbrelo moviendo el control de elementos: ¿cuántos elementos tiene?",
      points: 150,
      params: { targetC: 21, targetN: 6, maxN: 12 },
      hints: [
        "Identifica primero cuántos elementos hay.",
        "El orden de complejidad máxima es C = n + n(n−1)/2.",
        "Prueba con n = 6: C = 6 + 6(5)/2 = 6 + 15 = 21."
      ],
      success: "Descubierto. Con n = 6 elementos y 15 relaciones máximas, C = 6 + 15 = 21."
    },
    {
      id: "build-c20",
      type: "build-complexity",
      name: "EJEMPLO C = 20",
      icon: "build",
      desc: "El Gimnasio pide elaborar un ejemplo con C = 20. Construye una red válida (no necesariamente máxima) donde n + R = 20.",
      points: 150,
      params: { targetC: 20, minNodes: 4, maxNodes: 10 },
      hints: [
        "Identifica primero cuántos elementos hay.",
        "Compara tu complejidad actual con la máxima posible para esa cantidad de elementos.",
        "Por ejemplo, con 7 elementos y 13 relaciones: C = 7 + 13 = 20. La complejidad actual no siempre es la máxima."
      ],
      success: "Correcto. Tu red alcanza C = 20 sin necesidad de usar todas las relaciones posibles. Esto distingue la complejidad actual de la complejidad máxima."
    }
  ];

  CL.Challenges.get = function (id) {
    return CL.Challenges.DEFS.find((c) => c.id === id);
  };
})(window.ComplexityLab = window.ComplexityLab || {});
