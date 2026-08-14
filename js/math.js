/* ============================================================
   COMPLEXITY LAB · js/math.js
   Motor matemático — ÚNICA fuente de verdad de los cálculos.
   Sección 1.4 del Gimnasio 1:
     R = n(n−1)/2      número máximo de relaciones entre n elementos
     C = n + R         orden de complejidad (elementos + relaciones)
   ============================================================ */
(function (CL) {
  "use strict";

  /**
   * Número máximo de relaciones entre n elementos distintos.
   * Combinaciones de n tomadas de 2 en 2: n·(n−1)/2.
   * @param {number} n elementos (>= 1)
   * @returns {number}
   */
  function maxRelations(n) {
    n = Math.max(0, Math.floor(Number(n) || 0));
    return (n * (n - 1)) / 2;
  }

  /**
   * Orden de complejidad con n elementos y r relaciones efectivas.
   * C = n + r
   */
  function complexity(n, r) {
    return Math.floor(Number(n) || 0) + Math.floor(Number(r) || 0);
  }

  /**
   * Orden de complejidad máxima posible con n elementos.
   * C = n + n(n−1)/2
   */
  function maxComplexity(n) {
    return complexity(n, maxRelations(n));
  }

  /** Normaliza una arista a un par canónico {a, b} con a < b. */
  function canonicalPair(a, b) {
    return { a: Math.min(a, b), b: Math.max(a, b) };
  }

  /** Clave canónica única de una arista entre nodos distintos. */
  function edgeKey(a, b) {
    if (a === b) return null;
    return a < b ? a + "|" + b : b + "|" + a;
  }

  /** Clave canónica a partir de un par {a, b}. */
  function keyOf(edge) {
    return edgeKey(edge.a, edge.b);
  }

  CL.Math = {
    maxRelations: maxRelations,
    complexity: complexity,
    maxComplexity: maxComplexity,
    canonicalPair: canonicalPair,
    edgeKey: edgeKey,
    keyOf: keyOf
  };
})(window.ComplexityLab = window.ComplexityLab || {});
