/* ============================================================
   NETWORK BOMB · js/data.js
   Rondas del microjuego. Única fuente de verdad del contenido.
   Fórmulas del material (Gimnasio 1 · sección 1.4 Complejidad):
     R = n(n−1)/2      relaciones máximas entre n elementos
     C = n + R         orden de complejidad
   ============================================================ */
window.NB_DATA = {
  /* Duración de la cuenta regresiva de cada ronda (segundos). */
  roundTime: 15,

  /* Puntos por respuesta correcta (antes del combo). */
  points: 100,

  rounds: [
    {
      n: 3,
      question: "¿Cuántas relaciones máximas?",
      options: [2, 3, 6],
      answer: 3,
      feedback: "3 elementos → R = 3(2)/2 = 3"
    },
    {
      n: 4,
      question: "¿Cuántas relaciones máximas?",
      options: [4, 6, 8],
      answer: 6,
      feedback: "4 elementos → R = 4(3)/2 = 6"
    },
    {
      n: 6,
      question: "¿Cuántas relaciones máximas?",
      options: [12, 15, 18],
      answer: 15,
      feedback: "6 elementos → R = 6(5)/2 = 15"
    },
    {
      n: 12,
      question: "¿Orden máximo de complejidad?",
      options: [66, 72, 78],
      answer: 78,
      feedback: "C = 12 + 12(11)/2 = 12 + 66 = 78",
      final: true
    }
  ]
};
