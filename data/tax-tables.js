/**
 * Tabelas fiscais portuguesas centralizadas.
 * Atualize aqui quando houver alterações legislativas.
 * Valores aproximados baseados em 2024. São ESTIMATIVAS.
 */
const TAX_TABLES = {
  year: 2024,
  currency: "EUR",

  // Segurança Social — trabalhador por conta de outrem
  socialSecurity: {
    workerRate: 0.11 // 11%
  },

  // Subsídio de alimentação — limites diários isentos
  mealAllowance: {
    dinheiro: 6.00,
    cartao: 9.60
  },

  // Escalões IRS — Continente (anuais, para o rendimento coletável)
  // Cada escalão: [limiteSuperior, taxaNormal, parcelaAbater]
  irs: {
    continente: [
      [7479,     0.1325, 0      ],
      [11284,    0.2100, 583.87 ],
      [15992,    0.2650, 1204.58],
      [20700,    0.2850, 1524.19],
      [26355,    0.3500, 2874.69],
      [38632,    0.3700, 3402.39],
      [Infinity, 0.4800, 7645.61]
    ],
    // Açores — reduções de 30% sobre as taxas do continente (aprox.)
    acores: [
      [7479,     0.0928, 0      ],
      [11284,    0.1470, 408.71 ],
      [15992,    0.1855, 843.21 ],
      [20700,    0.1995, 1066.93],
      [26355,    0.2450, 2012.28],
      [38632,    0.2590, 2381.67],
      [Infinity, 0.3360, 5351.93]
    ],
    // Madeira — reduções de 20% sobre as taxas do continente (aprox.)
    madeira: [
      [7479,     0.1060, 0      ],
      [11284,    0.1680, 467.10 ],
      [15992,    0.2120, 963.67 ],
      [20700,    0.2280, 1219.35],
      [26355,    0.2800, 2299.75],
      [38632,    0.2960, 2721.91],
      [Infinity, 0.3840, 6116.49]
    ]
  },

  // Deduções específicas por dependente (simplificado)
  deductions: {
    perDependent: 900,     // € por dependente
    perAscendant: 600      // € por ascendente (não usado aqui, mas preparado)
  },

  // Notas
  notes: {
    disclaimer:
      "As regras e tabelas fiscais podem sofrer alterações. Confirme os valores oficiais antes de tomar decisões financeiras."
  }
};

// Disponibiliza globalmente para os módulos
window.TAX_TABLES = TAX_TABLES;
