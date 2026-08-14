/* ============================================================
   COMPLEXITY LAB · data/experiments.js
   Definición de los 5 experimentos (metadatos + textos)
   Terminología según la sección 1.4 del Gimnasio:
   elementos, relaciones, orden de complejidad, sinergia,
   sistema simple, sistema complejo.
   ============================================================ */
(function (CL) {
  "use strict";

  CL.Experiments = CL.Experiments || {};

  CL.Experiments.DEFS = [
    {
      id: "elements",
      num: "01",
      title: "ELEMENTOS",
      short: "Elementos",
      icon: "nodes",
      tagline: "Un sistema crece al sumar elementos.",
      goal: "Agrega elementos y observa cómo crece el sistema."
    },
    {
      id: "relations",
      num: "02",
      title: "RELACIONES",
      short: "Relaciones",
      icon: "link",
      tagline: "Cada elemento nuevo abre muchas conexiones posibles.",
      goal: "Experimenta cómo un elemento genera varias relaciones nuevas."
    },
    {
      id: "order",
      num: "03",
      title: "ORDEN DE COMPLEJIDAD",
      short: "Orden de complejidad",
      icon: "reaction",
      tagline: "C = n + R · elementos + relaciones.",
      goal: "Descubre por qué las relaciones pesan tanto en la complejidad."
    },
    {
      id: "compare",
      num: "04",
      title: "SIMPLE VS. COMPLEJO",
      short: "Simple vs. complejo",
      icon: "scale",
      tagline: "Compara sistemas y aprende a juzgar su complejidad.",
      goal: "Aprende a comparar sistemas con distinta cantidad de elementos y relaciones."
    },
    {
      id: "synergy",
      num: "05",
      title: "SINERGIA",
      short: "Sinergia",
      icon: "synergy",
      tagline: "Partes + relaciones → comportamiento del conjunto.",
      goal: "El comportamiento del conjunto surge de la interacción entre sus partes."
    }
  ];

  CL.Experiments.get = function (id) {
    return CL.Experiments.DEFS.find((e) => e.id === id);
  };
  CL.Experiments.byIndex = function (i) {
    return CL.Experiments.DEFS[i] || null;
  };
})(window.ComplexityLab = window.ComplexityLab || {});
