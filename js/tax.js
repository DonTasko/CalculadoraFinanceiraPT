/**
 * Cálculos fiscais portugueses.
 * Centraliza IRS e Segurança Social.
 */
const Tax = (() => {

  function findBracket(taxable, brackets){
    for (const [limit, rate, parcel] of brackets){
      if (taxable <= limit) return { rate, parcel };
    }
    const last = brackets[brackets.length - 1];
    return { rate: last[1], parcel: last[2] };
  }

  /**
   * IRS anual (simplificado) — aplicação direta da taxa ao escalão.
   * Nota: o modelo real é mais complexo (média, taxas marginais, etc.).
   * Este é um modelo estimativo coerente com as tabelas.
   */
  function irsAnnual(taxable, region = "continente"){
    if (taxable <= 0) return 0;
    const brackets = TAX_TABLES.irs[region] || TAX_TABLES.irs.continente;
    const { rate, parcel } = findBracket(taxable, brackets);
    return Math.max(0, taxable * rate - parcel);
  }

  function socialSecurity(grossMonthly){
    return grossMonthly * TAX_TABLES.socialSecurity.workerRate;
  }

  function mealAllowanceNetPerDay(valuePerDay, type){
    const limit = TAX_TABLES.mealAllowance[type] ?? TAX_TABLES.mealAllowance.dinheiro;
    // O valor acima do limite está sujeito a IRS/SS (simplificado: não entra no líquido)
    return Math.min(valuePerDay, limit);
  }

  /**
   * Cálculo mensal estimado do salário líquido.
   * @param {Object} opts
   */
  function netSalary(opts){
    const {
      grossMonthly,
      payments = 14,
      region = "continente",
      dependents = 0,
      mealPerDay = 0,
      mealType = "cartao",
      workDays = 22,
      otherAnnual = 0,
      marital = "solteiro"
    } = opts;

    // Anualização (12 ou 14 meses)
    const grossAnnual = grossMonthly * payments + otherAnnual;

    // Dedução por dependente
    const dedDep = dependents * TAX_TABLES.deductions.perDependent;

    // Rendimento coletável aproximado
    const taxable = Math.max(0, grossAnnual - dedDep);

    const irsAnnualValue = irsAnnual(taxable, region);
    const ssMonthly = socialSecurity(grossMonthly);
    const ssAnnual = ssMonthly * 12;

    // IRS mensal estimado (distribuído pelos meses de pagamento)
    const irsMonthly = irsAnnualValue / payments;

    // Subsídio de alimentação líquido mensal
    const mealNetDay = mealAllowanceNetPerDay(mealPerDay, mealType);
    const mealMonthly = mealNetDay * workDays;

    // Líquido mensal
    const netMonthly = grossMonthly - ssMonthly - irsMonthly + mealMonthly;

    const effectiveRate = grossAnnual > 0 ? (irsAnnualValue / grossAnnual) : 0;
    const totalDiscountsMonthly = ssMonthly + irsMonthly;

    return {
      grossMonthly,
      grossAnnual,
      ssMonthly,
      irsMonthly,
      irsAnnual: irsAnnualValue,
      mealMonthly,
      netMonthly,
      effectiveRate,
      totalDiscountsMonthly
    };
  }

  return { irsAnnual, socialSecurity, mealAllowanceNetPerDay, netSalary };
})();
