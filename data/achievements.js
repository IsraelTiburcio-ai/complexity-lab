/* ============================================================
   COMPLEXITY LAB · data/achievements.js
   Definición de logros (iconografía propia, datos separados)
   ============================================================ */
(function (CL) {
  "use strict";

  CL.Achievements = CL.Achievements || {};
  CL.Achievements.DEFS = [
    {
      id: "first-link",
      name: "PRIMER ENLACE",
      icon: "link",
      description: "Crea tu primera relación entre dos elementos.",
      points: 100,
      check: (s) => s.stats.linksCreated >= 1
    },
    {
      id: "network-complete",
      name: "RED COMPLETA",
      icon: "mesh",
      description: "Completa todas las relaciones posibles de un sistema.",
      points: 150,
      check: (s) => s.stats.fullNetworks >= 1
    },
    {
      id: "architect",
      name: "ARQUITECTO DE REDES",
      icon: "grid",
      description: "Construye una red con al menos 10 elementos.",
      points: 120,
      check: (s) => s.stats.maxNodesBuilt >= 10
    },
    {
      id: "precision",
      name: "PRECISIÓN MATEMÁTICA",
      icon: "target",
      description: "Realiza 5 predicciones exactas.",
      points: 200,
      check: (s) => s.stats.exactPredictions >= 5
    },
    {
      id: "c78",
      name: "C = 78",
      icon: "reaction",
      description: "Resuelve correctamente el caso de 12 elementos.",
      points: 250,
      check: (s) => s.stats.case78Solved === true
    },
    {
      id: "chaos-tamer",
      name: "DOMADOR DEL CAOS",
      icon: "bolt",
      description: "Completa el experimento final, Protocolo Caos.",
      points: 300,
      check: (s) => s.stats.finalCompleted === true
    },
    {
      id: "master",
      name: "MAESTRO DE LA COMPLEJIDAD",
      icon: "crown",
      description: "Completa todos los desafíos de la cámara.",
      points: 400,
      check: (s) => {
        const ids = Object.keys(s.progress.challenges || {});
        const done = ids.filter((id) => s.progress.challenges[id] && s.progress.challenges[id].done).length;
        return done >= 7;
      }
    },
    {
      id: "ten",
      name: "DIEZ Y MÁS",
      icon: "nodes",
      description: "Desliza hasta 10 elementos y observa las 45 relaciones.",
      points: 130,
      check: (s) => s.stats.reachedTen === true
    }
  ];

  CL.Achievements.get = function (id) {
    return CL.Achievements.DEFS.find((a) => a.id === id);
  };
})(window.ComplexityLab = window.ComplexityLab || {});
