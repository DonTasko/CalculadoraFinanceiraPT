/**
 * Funções financeiras puras.
 */
const Finance = (() => {

  // ---------- IVA ----------
  function ivaAdd(base, rate){
    const vat = base * (rate / 100);
    return { base, vat, total: base + vat };
  }
  function ivaRemove(total, rate){
    const base = total / (1 + rate / 100);
    const vat = total - base;
    return { base, vat, total };
  }

  // ---------- Descontos sucessivos ----------
  function applyDiscounts(price, percents){
    const steps = [];
    let current = price;
    for (const p of percents){
      const save = current * (p / 100);
      current -= save;
      steps.push({ percent: p, save, after: current });
    }
    const savedTotal = price - current;
    const effectivePct = price > 0 ? (savedTotal / price) * 100 : 0;
    return { original: price, final: current, savedTotal, effectivePct, steps };
  }

  // ---------- Margem / Markup ----------
  function marginFromBuySell(buy, sell){
    if (buy <= 0 || sell <= 0) return null;
    const profit = sell - buy;
    const margin = (profit / sell) * 100;     // Margem = lucro / venda
    const markup = (profit / buy) * 100;      // Markup = lucro / compra
    const multiplier = sell / buy;
    return { buy, sell, profit, margin, markup, multiplier };
  }
  function sellFromBuyMargin(buy, marginPct){
    if (buy <= 0 || marginPct >= 100) return null;
    const sell = buy / (1 - marginPct / 100);
    return marginFromBuySell(buy, sell);
  }
  function buyFromSellMargin(sell, marginPct){
    if (sell <= 0 || marginPct >= 100) return null;
    const buy = sell * (1 - marginPct / 100);
    return marginFromBuySell(buy, sell);
  }

  // ---------- Percentagens ----------
  function percentOf(x, y){ return (x / 100) * y; }
  function percentIs(x, y){ return y === 0 ? null : (x / y) * 100; }
  function percentChange(a, b){ return a === 0 ? null : ((b - a) / a) * 100; }
  function percentDiff(a, b){
    if (a === 0 && b === 0) return 0;
    const denom = Math.max(Math.abs(a), Math.abs(b));
    return denom === 0 ? 0 : (Math.abs(b - a) / denom) * 100;
  }

  // ---------- Juros simples ----------
  function simpleInterest({ capital, rate, period, unit }){
    const t = unit === "meses" ? period / 12 : period;
    const i = rate / 100;
    const j = capital * i * t;
    return { interest: j, final: capital + j };
  }

  // ---------- Juros compostos ----------
  /**
   * Calcula valor final com capital inicial, aportes periódicos e capitalização.
   * @param {Object} p
   *   c0: capital inicial
   *   pmt: aporte periódico
   *   annualRate: taxa anual em %
   *   term: prazo
   *   termUnit: "anos" | "meses"
   *   compoundFreq: capitalizações por ano (12,4,2,1)
   *   pmtFreq: "mensal"|"trimestral"|"semestral"|"anual"
   */
  function compoundInterest(p){
    const monthsTotal = p.termUnit === "anos" ? p.term * 12 : p.term;
    const r = p.annualRate / 100;
    const periodsPerYear = p.compoundFreq;
    const periodRate = r / periodsPerYear;

    // Converter aporte para equivalente por período de capitalização
    const pmtPerYearMap = { mensal:12, trimestral:4, semestral:2, anual:1 };
    const pmtPerYear = pmtPerYearMap[p.pmtFreq] || 12;
    const pmtPerPeriod = p.pmt * (pmtPerYear / periodsPerYear);

    const totalPeriods = Math.round((monthsTotal / 12) * periodsPerYear);

    // Fórmula: FV = C0*(1+i)^n + PMT*[ ((1+i)^n - 1) / i ]
    let fv;
    if (periodRate === 0){
      fv = p.c0 + pmtPerPeriod * totalPeriods;
    } else {
      const pow = Math.pow(1 + periodRate, totalPeriods);
      fv = p.c0 * pow + pmtPerPeriod * ((pow - 1) / periodRate);
    }

    const invested = p.c0 + p.pmt * monthsTotal;
    const interest = fv - invested;

    // Série para gráfico (anual)
    const years = Math.ceil(monthsTotal / 12);
    const series = [];
    let acc = p.c0;
    let investedAcc = p.c0;
    for (let y = 1; y <= years; y++){
      const monthsThisYear = (y * 12 <= monthsTotal) ? 12 : (monthsTotal - (y-1)*12);
      const periodsThisYear = Math.round((monthsThisYear / 12) * periodsPerYear);
      for (let k = 0; k < periodsThisYear; k++){
        acc = acc * (1 + periodRate) + pmtPerPeriod;
      }
      investedAcc += p.pmt * monthsThisYear;
      series.push({ year: y, value: acc, invested: investedAcc });
    }

    return { final: fv, invested, interest, series };
  }

  // ---------- Prestação de crédito (PRICE) ----------
  function loanPayment({ amount, n, nUnit, annualRate }){
    const months = nUnit === "anos" ? n * 12 : n;
    const i = (annualRate / 100) / 12;
    let pmt;
    if (i === 0) pmt = amount / months;
    else pmt = amount * (i * Math.pow(1 + i, months)) / (Math.pow(1 + i, months) - 1);

    let balance = amount;
    const schedule = [];
    let totalInterest = 0;
    for (let k = 1; k <= months; k++){
      const interest = balance * i;
      const capital = pmt - interest;
      balance -= capital;
      if (balance < 0) balance = 0;
      totalInterest += interest;
      schedule.push({ n:k, payment:pmt, capital, interest, balance });
    }
    return { payment: pmt, total: pmt * months, totalInterest, schedule };
  }

  // ---------- Taxa de esforço ----------
  function effortRate(income, payment){
    if (income <= 0) return null;
    const pct = (payment / income) * 100;
    let label;
    if (pct <= 30) label = "Confortável";
    else if (pct <= 40) label = "Atenção";
    else if (pct <= 50) label = "Elevada";
    else label = "Muito elevada";
    return { pct, label };
  }

  // ---------- Investimento (crescimento) ----------
  function investmentGrow({ c0, pmt, annualRate, years }){
    return compoundInterest({
      c0, pmt, annualRate,
      term: years, termUnit: "anos",
      compoundFreq: 12, pmtFreq: "mensal"
    });
  }
  /**
   * Aporte mensal necessário para atingir um objetivo.
   * PMT = (FV - C0*(1+i)^n) * i / ((1+i)^n - 1)
   */
  function investmentTarget({ c0, target, annualRate, years }){
    const i = (annualRate / 100) / 12;
    const n = years * 12;
    if (i === 0) return { pmt: (target - c0) / n };
    const pow = Math.pow(1 + i, n);
    const pmt = (target - c0 * pow) * i / (pow - 1);
    const invested = c0 + pmt * n;
    return { pmt, invested, interest: target - invested, final: target };
  }

  // ---------- Regra de três ----------
  function ruleOfThree(a, b, c){
    if (a === 0) return null;
    return (b * c) / a;
  }

  return {
    ivaAdd, ivaRemove, applyDiscounts,
    marginFromBuySell, sellFromBuyMargin, buyFromSellMargin,
    percentOf, percentIs, percentChange, percentDiff,
    simpleInterest, compoundInterest,
    loanPayment, effortRate,
    investmentGrow, investmentTarget,
    ruleOfThree
  };
})();
