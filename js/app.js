/**
 * App: orquestração, navegação, onboarding, handlers de cálculo, AdMob stub.
 */
const App = (() => {

  let currentScreen = "screen-home";
  const historyStack = [];

  // ---------- NAVEGAÇÃO ----------
  function show(id, pushHistory = true){
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("active");
    if (pushHistory && currentScreen !== id) historyStack.push(currentScreen);
    currentScreen = id;

    const titleMap = {
      "screen-home":"Calculadora Financeira PT",
      "screen-calculators":"Calculadoras",
      "screen-history":"Histórico",
      "screen-favorites":"Favoritos",
      "screen-settings":"Definições",
      "screen-privacy":"Política de Privacidade",
      "screen-about":"Sobre",
      "screen-contact":"Contacto"
    };
    const calc = CALCULATORS.find(c => c.screen === id);
    document.getElementById("page-title").textContent = titleMap[id] || (calc ? calc.name : "");

    const btnBack = document.getElementById("btn-back");
    const isTop = ["screen-home","screen-calculators","screen-history","screen-favorites","screen-settings"].includes(id);
    btnBack.classList.toggle("hidden", isTop);

    // atualiza nav ativa
    document.querySelectorAll(".nav-btn").forEach(b => {
      const nav = b.dataset.nav;
      const map = { home:"screen-home", calculators:"screen-calculators", history:"screen-history", favorites:"screen-favorites", settings:"screen-settings" };
      b.classList.toggle("active", map[nav] === id);
    });

    if (id === "screen-history") renderHistory();
    if (id === "screen-favorites") renderFavoritesFull();

    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function back(){
    const prev = historyStack.pop();
    if (prev) show(prev, false); else show("screen-home", false);
  }

  function openCalc(calc){
    show(calc.screen);
  }

  // ---------- HOME ----------
  function renderHome(){
    const grid = document.getElementById("home-grid");
    UI.renderGrid(grid, CALCULATORS);
  }

  function renderAll(){
    const grid = document.getElementById("all-grid");
    UI.renderGrid(grid, CALCULATORS);
  }

  function renderFavoritesFull(){
    const grid = document.getElementById("fav-full-grid");
    const favs = Storage.getFavorites();
    const list = CALCULATORS.filter(c => favs.includes(c.id));
    grid.innerHTML = "";
    document.getElementById("fav-empty").classList.toggle("hidden", list.length > 0);
    list.forEach(c => grid.appendChild(UI.renderCard(c)));
  }

  function refreshFavorites(){
    const favs = Storage.getFavorites();
    const wrap = document.getElementById("favorites-home");
    const grid = document.getElementById("fav-grid");
    const list = CALCULATORS.filter(c => favs.includes(c.id));
    wrap.classList.toggle("hidden", list.length === 0);
    grid.innerHTML = "";
    list.forEach(c => grid.appendChild(UI.renderCard(c)));

    // atualiza estrelas em todos os cards
    document.querySelectorAll("[data-fav]").forEach(el => {
      const id = el.dataset.fav;
      const on = favs.includes(id);
      el.classList.toggle("on", on);
      el.textContent = on ? "⭐" : "☆";
    });
  }

  // ---------- PESQUISA ----------
  function bindSearch(inputId, gridId){
    const input = document.getElementById(inputId);
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      const grid = document.getElementById(gridId);
      const filtered = CALCULATORS.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.cat.toLowerCase().includes(q)
      );
      UI.renderGrid(grid, filtered);
    });
  }

  // ---------- HISTÓRICO ----------
  function renderHistory(){
    const list = document.getElementById("history-list");
    const empty = document.getElementById("history-empty");
    const items = Storage.getHistory();
    list.innerHTML = "";
    empty.classList.toggle("hidden", items.length > 0);
    items.forEach(h => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="meta">
          <span class="t">${escapeHtml(h.title)}</span>
          <span class="d">${escapeHtml(h.date)} · ${escapeHtml(h.summary || "")}</span>
        </div>
        <span class="val">${escapeHtml(h.value || "")}</span>
        <button class="del" data-del="${h.id}" aria-label="Apagar">✕</button>
      `;
      list.appendChild(li);
    });
    list.querySelectorAll("[data-del]").forEach(b => {
      b.addEventListener("click", () => {
        Storage.removeHistory(b.dataset.del);
        renderHistory();
      });
    });
  }

  function escapeHtml(s){
    return String(s ?? "").replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[m]));
  }

  function saveHistory(entry){
    Storage.addHistory({
      date: new Date().toLocaleDateString("pt-PT"),
      ...entry
    });
  }

  // ---------- TEMA ----------
  function applyTheme(t){
    document.body.classList.toggle("dark", t === "dark");
    document.getElementById("btn-theme").textContent = t === "dark" ? "☀️" : "🌙";
    Storage.setTheme(t);
  }
  function toggleTheme(){
    applyTheme(document.body.classList.contains("dark") ? "light" : "dark");
  }

  // ---------- ONBOARDING ----------
  function initOnboarding(){
    if (Storage.isOnboardingDone()){
      document.getElementById("screen-onboarding").remove();
      document.getElementById("app").classList.remove("hidden");
      return;
    }
    const slides = document.querySelectorAll(".onb-slide");
    const dots = document.querySelectorAll(".onb-dots .dot");
    const btn = document.getElementById("btn-onb-next");
    let step = 0;
    function go(i){
      step = i;
      slides.forEach((s, idx) => s.classList.toggle("active", idx === i));
      dots.forEach((d, idx) => d.classList.toggle("active", idx === i));
      btn.textContent = (i === slides.length - 1) ? "COMEÇAR" : "Seguinte";
    }
    btn.addEventListener("click", () => {
      if (step < slides.length - 1) go(step + 1);
      else {
        Storage.setOnboardingDone(true);
        document.getElementById("screen-onboarding").remove();
        document.getElementById("app").classList.remove("hidden");
      }
    });
    go(0);
  }

  // ---------- HANDLERS DE CÁLCULO ----------
  function val(id){
    const el = document.getElementById(id);
    if (!el) return 0;
    const v = el.value;
    if (v === "" || v == null) return NaN;
    // aceitar vírgula decimal
    return parseFloat(String(v).replace(",", "."));
  }
  function txt(id){ return (document.getElementById(id)?.value || "").trim(); }

  function bindCalcButtons(){
    document.querySelectorAll("[data-calc]").forEach(btn => {
      btn.addEventListener("click", () => runCalc(btn.dataset.calc));
    });
  }

  function runCalc(type){
    try {
      switch (type){
        case "salary": return calcSalary();
        case "iva": return calcIva();
        case "discount": return calcDiscount();
        case "margin": return calcMargin();
        case "percent": return calcPercent();
        case "simple-interest": return calcSimpleInterest();
        case "compound-interest": return calcCompoundInterest();
        case "credit": return calcCredit();
        case "mortgage": return calcMortgage();
        case "effort-rate": return calcEffort();
        case "investment": return calcInvestment();
        case "rule-of-three": return calcRuleOfThree();
      }
    } catch (e){
      UI.toast("Verifique os valores introduzidos");
      console.error(e);
    }
  }

  // ---- SALÁRIO ----
  function calcSalary(){
    const gross = val("sal-gross");
    if (!(gross > 0)) throw 0;
    const res = Tax.netSalary({
      grossMonthly: gross,
      payments: +document.getElementById("sal-payments").value,
      region: document.getElementById("sal-region").value,
      marital: document.getElementById("sal-marital").value,
      dependents: +document.getElementById("sal-deps").value || 0,
      mealPerDay: val("sal-meal") || 0,
      mealType: document.getElementById("sal-meal-type").value,
      workDays: +document.getElementById("sal-days").value || 0,
      otherAnnual: val("sal-other") || 0
    });
    setText("r-sal-gross", UI.eur(res.grossMonthly));
    setText("r-sal-ss", UI.eur(res.ssMonthly));
    setText("r-sal-irs", UI.eur(res.irsMonthly));
    setText("r-sal-meal", UI.eur(res.mealMonthly));
    setText("r-sal-net", UI.eur(res.netMonthly));
    setText("r-sal-irs-rate", UI.pct(res.effectiveRate * 100));
    setText("r-sal-disc", UI.eur(res.totalDiscountsMonthly));
    show("salary-result");
    saveHistory({
      title:"Salário líquido",
      summary:`Bruto ${UI.eur(gross)}`,
      value:`Líquido ${UI.eur(res.netMonthly)}`
    });
  }

  // ---- IVA ----
  function calcIva(){
    const mode = document.getElementById("iva-mode").value;
    const rateSel = document.getElementById("iva-rate").value;
    const rate = rateSel === "custom" ? val("iva-custom") : +rateSel;
    const v = val("iva-value");
    if (!(v >= 0) || !(rate >= 0)) throw 0;
    const res = mode === "add" ? Finance.ivaAdd(v, rate) : Finance.ivaRemove(v, rate);
    setText("r-iva-base", UI.eur(res.base));
    setText("r-iva-vat", UI.eur(res.vat));
    setText("r-iva-total", UI.eur(res.total));
    show("iva-result");
    saveHistory({ title:"IVA", summary:`${UI.eur(v)} @ ${rate}%`, value:`Total ${UI.eur(res.total)}` });
  }

  // ---- DESCONTO ----
  function calcDiscount(){
    const price = val("disc-price");
    const raw = txt("disc-values");
    const percents = raw.split(/[;,]/).map(s => parseFloat(s.replace(",", "."))).filter(n => !isNaN(n));
    if (!(price > 0) || percents.length === 0) throw 0;
    const res = Finance.applyDiscounts(price, percents);
    setText("r-disc-orig", UI.eur(res.original));
    setText("r-disc-save", UI.eur(res.savedTotal));
    setText("r-disc-final", UI.eur(res.final));
    setText("r-disc-pct", UI.pct(res.effectivePct));
    const ol = document.getElementById("r-disc-steps");
    ol.innerHTML = "";
    res.steps.forEach((s, i) => {
      const li = document.createElement("li");
      li.textContent = `-${s.percent}% → ${UI.eur(s.after)} (poupança ${UI.eur(s.save)})`;
      ol.appendChild(li);
    });
    show("disc-result");
    saveHistory({ title:"Desconto", summary:`${UI.eur(price)} - ${percents.join("%, ")}%`, value:`Final ${UI.eur(res.final)}` });
  }

  // ---- MARGEM ----
  function calcMargin(){
    const mode = document.getElementById("mrg-mode").value;
    let res;
    if (mode === "a"){
      const buy = val("mrg-buy"), sell = val("mrg-sell");
      if (!(buy > 0) || !(sell > 0)) throw 0;
      res = Finance.marginFromBuySell(buy, sell);
    } else if (mode === "b"){
      const buy = val("mrg-buy"), pct = val("mrg-pct");
      if (!(buy > 0) || !(pct >= 0) || pct >= 100) throw 0;
      res = Finance.sellFromBuyMargin(buy, pct);
    } else {
      const sell = val("mrg-sell"), pct = val("mrg-pct");
      if (!(sell > 0) || !(pct >= 0) || pct >= 100) throw 0;
      res = Finance.buyFromSellMargin(sell, pct);
    }
    if (!res) throw 0;
    setText("r-mrg-buy", UI.eur(res.buy));
    setText("r-mrg-sell", UI.eur(res.sell));
    setText("r-mrg-profit", UI.eur(res.profit));
    setText("r-mrg-margin", UI.pct(res.margin));
    setText("r-mrg-markup", UI.pct(res.markup));
    setText("r-mrg-mult", num(res.multiplier, 3));
    show("mrg-result");
    saveHistory({ title:"Margem & Lucro", summary:`Compra ${UI.eur(res.buy)} · Venda ${UI.eur(res.sell)}`, value:`Margem ${UI.pct(res.margin)}` });
  }

  // ---- PERCENTAGENS ----
  function calcPercent(){
    const mode = document.getElementById("pct-mode").value;
    let out = "", expl = "";
    if (mode === "of"){
      const x = val("pct-x"), y = val("pct-y");
      if (isNaN(x) || isNaN(y)) throw 0;
      const r = Finance.percentOf(x, y);
      out = UI.num(r);
      expl = `${UI.pct(x)} de ${UI.num(y)} = ${UI.num(r)}`;
    } else if (mode === "is"){
      const x = val("pct-x"), y = val("pct-y");
      if (isNaN(x) || isNaN(y)) throw 0;
      const r = Finance.percentIs(x, y);
      out = r === null ? "—" : UI.pct(r);
      expl = `${UI.num(x)} é ${out} de ${UI.num(y)}`;
    } else if (mode === "up" || mode === "down"){
      const a = val("pct-a"), b = val("pct-b");
      if (isNaN(a) || isNaN(b)) throw 0;
      const r = Finance.percentChange(a, b);
      out = r === null ? "—" : ((r >= 0 ? "+" : "") + UI.pct(r));
      expl = `De ${UI.num(a)} para ${UI.num(b)}: ${out}`;
    } else {
      const a = val("pct-a"), b = val("pct-b");
      if (isNaN(a) || isNaN(b)) throw 0;
      const r = Finance.percentDiff(a, b);
      out = UI.pct(r);
      expl = `Diferença entre ${UI.num(a)} e ${UI.num(b)}: ${out}`;
    }
    setText("r-pct-val", out);
    setText("r-pct-expl", expl);
    show("pct-result");
    saveHistory({ title:"Percentagem", summary:expl, value:out });
  }

  // ---- JUROS SIMPLES ----
  function calcSimpleInterest(){
    const c = val("si-c"), i = val("si-i"), t = val("si-t");
    const u = document.getElementById("si-u").value;
    if (!(c > 0) || isNaN(i) || !(t > 0)) throw 0;
    const r = Finance.simpleInterest({ capital:c, rate:i, period:t, unit:u });
    setText("r-si-j", UI.eur(r.interest));
    setText("r-si-f", UI.eur(r.final));
    show("si-result");
    saveHistory({ title:"Juros simples", summary:`${UI.eur(c)} · ${i}% · ${t} ${u}`, value:`Final ${UI.eur(r.final)}` });
  }

  // ---- JUROS COMPOSTOS ----
  function calcCompoundInterest(){
    const p = {
      c0: val("ci-c0") || 0,
      pmt: val("ci-pmt") || 0,
      annualRate: val("ci-r"),
      term: val("ci-t"),
      termUnit: document.getElementById("ci-u").value,
      compoundFreq: +document.getElementById("ci-f").value,
      pmtFreq: document.getElementById("ci-pmt-freq").value
    };
    if (!(p.term > 0) || isNaN(p.annualRate)) throw 0;
    const r = Finance.compoundInterest(p);
    setText("r-ci-invested", UI.eur(r.invested));
    setText("r-ci-interest", UI.eur(r.interest));
    setText("r-ci-final", UI.eur(r.final));
    const canvas = document.getElementById("ci-chart");
    UI.lineChart(canvas, r.series, { keys:["invested","value"], labels:["Investido","Valor"], colors:["#64748b","#0f766e"] });
    show("ci-result");
    saveHistory({ title:"Juros compostos", summary:`${UI.eur(p.c0)} + ${UI.eur(p.pmt)}/m · ${p.annualRate}% · ${p.term} ${p.termUnit}`, value:`Final ${UI.eur(r.final)}` });
  }

  // ---- CRÉDITO ----
  function calcCredit(){
    const amt = val("cr-amt"), n = val("cr-n"), r = val("cr-r");
    const u = document.getElementById("cr-n-u").value;
    if (!(amt > 0) || !(n > 0) || isNaN(r)) throw 0;
    const res = Finance.loanPayment({ amount:amt, n, nUnit:u, annualRate:r });
    setText("r-cr-pmt", UI.eur(res.payment));
    setText("r-cr-total", UI.eur(res.total));
    setText("r-cr-int", UI.eur(res.totalInterest));
    const tbody = document.querySelector("#cr-amort-table tbody");
    tbody.innerHTML = "";
    res.schedule.forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.n}</td>
        <td>${UI.eur(row.payment)}</td>
        <td>${UI.eur(row.capital)}</td>
        <td>${UI.eur(row.interest)}</td>
        <td>${UI.eur(row.balance)}</td>
      `;
      tbody.appendChild(tr);
    });
    show("cr-result");
    document.getElementById("cr-amort-wrap").classList.add("hidden");
    saveHistory({ title:"Crédito", summary:`${UI.eur(amt)} · ${n} ${u} · ${r}%`, value:`Prestação ${UI.eur(res.payment)}` });
  }

  // ---- CRÉDITO HABITAÇÃO ----
  function calcMortgage(){
    const price = val("mt-price");
    const down = val("mt-down") || 0;
    const years = val("mt-years");
    const rate = val("mt-rate");
    if (!(price > 0) || !(years > 0) || isNaN(rate) || down >= price) throw 0;
    const fin = price - down;
    const res = Finance.loanPayment({ amount:fin, n:years, nUnit:"anos", annualRate:rate });
    setText("r-mt-fin", UI.eur(fin));
    setText("r-mt-pmt", UI.eur(res.payment));
    setText("r-mt-int", UI.eur(res.totalInterest));
    setText("r-mt-total", UI.eur(res.total));
    show("mt-result");
    saveHistory({ title:"Crédito habitação", summary:`Imóvel ${UI.eur(price)} · Entrada ${UI.eur(down)}`, value:`Prestação ${UI.eur(res.payment)}` });
  }

  // ---- TAXA DE ESFORÇO ----
  function calcEffort(){
    const inc = val("er-income"), pmt = val("er-pmt");
    if (!(inc > 0) || isNaN(pmt)) throw 0;
    const r = Finance.effortRate(inc, pmt);
    setText("r-er-pct", UI.pct(r.pct));
    setText("r-er-label", r.label);
    show("er-result");
    saveHistory({ title:"Taxa de esforço", summary:`Rend. ${UI.eur(inc)} · Prest. ${UI.eur(pmt)}`, value:UI.pct(r.pct) });
  }

  // ---- INVESTIMENTO ----
  function calcInvestment(){
    const mode = document.getElementById("inv-mode").value;
    const c0 = val("inv-c0") || 0;
    const rRate = val("inv-r");
    const years = val("inv-y");
    if (isNaN(rRate) || !(years > 0)) throw 0;

    if (mode === "grow"){
      const pmt = val("inv-pmt") || 0;
      const res = Finance.investmentGrow({ c0, pmt, annualRate:rRate, years });
      setText("r-inv-in", UI.eur(res.invested));
      setText("r-inv-gain", UI.eur(res.interest));
      setText("r-inv-final-label", "Valor final");
      setText("r-inv-final", UI.eur(res.final));
      UI.lineChart(document.getElementById("inv-chart"), res.series,
        { keys:["invested","value"], labels:["Investido","Valor"], colors:["#64748b","#0f766e"] });
      saveHistory({ title:"Investimento", summary:`${UI.eur(c0)} + ${UI.eur(pmt)}/m · ${rRate}% · ${years}a`, value:`Final ${UI.eur(res.final)}` });
    } else {
      const target = val("inv-target");
      if (!(target > 0)) throw 0;
      const res = Finance.investmentTarget({ c0, target, annualRate:rRate, years });
      setText("r-inv-in", UI.eur(res.invested));
      setText("r-inv-gain", UI.eur(res.interest));
      setText("r-inv-final-label", "Aporte mensal necessário");
      setText("r-inv-final", UI.eur(res.pmt));
      // gráfico simulado com o aporte encontrado
      const sim = Finance.investmentGrow({ c0, pmt:res.pmt, annualRate:rRate, years });
      UI.lineChart(document.getElementById("inv-chart"), sim.series,
        { keys:["invested","value"], labels:["Investido","Valor"], colors:["#64748b","#0f766e"] });
      saveHistory({ title:"Investimento (objetivo)", summary:`Objetivo ${UI.eur(target)} · ${years}a · ${rRate}%`, value:`Mensal ${UI.eur(res.pmt)}` });
    }
    show("inv-result");
  }

  // ---- REGRA DE TRÊS ----
  function calcRuleOfThree(){
    const a = val("r3-a"), b = val("r3-b"), c = val("r3-c");
    if (isNaN(a) || isNaN(b) || isNaN(c)) throw 0;
    const x = Finance.ruleOfThree(a, b, c);
    if (x === null) throw 0;
    setText("r-r3-x", UI.num(x));
    setText("r-r3-expl", `${UI.num(a)} : ${UI.num(b)} = ${UI.num(c)} : ${UI.num(x)}`);
    show("r3-result");
    saveHistory({ title:"Regra de três", summary:`${UI.num(a)} : ${UI.num(b)} = ${UI.num(c)} : X`, value:`X = ${UI.num(x)}` });
  }

  // ---- CALCULADORA GERAL ----
  function initGeneralCalc(){
    const display = document.getElementById("calc-display");
    let expr = "";
    function render(){ display.textContent = expr ? formatExpr(expr) : "0"; }
    function formatExpr(e){ return e.replace(/\*/g,"×").replace(/\//g,"÷").replace(/\./g,","); }

    document.querySelectorAll("#screen-calculator-general .k").forEach(btn => {
      btn.addEventListener("click", () => {
        const k = btn.dataset.k;
        if (k === "clear"){ expr = ""; }
        else if (k === "del"){ expr = expr.slice(0, -1); }
        else if (k === "="){
          try {
            const r = MathParser.evaluate(expr);
            expr = String(Math.round(r * 1e10) / 1e10);
            saveHistory({ title:"Calculadora", summary:formatExpr(btn._lastExpr || expr), value:UI.num(r) });
          } catch(e){
            UI.toast("Expressão inválida");
          }
        }
        else {
          btn._lastExpr = expr;
          expr += k;
        }
        render();
      });
    });
    render();
  }

  // ---------- AD MOB STUB ----------
  function showInterstitial(){
    // Preparado para futura integração com AdMob.
    // Atualmente não executa publicidade.
    // Regras: nunca antes do primeiro cálculo, nunca durante input, nunca sobre resultados.
    if (!App._firstCalcDone) return;
    // noop
  }
  function markFirstCalcDone(){ App._firstCalcDone = true; }

  // ---------- HELPERS ----------
  function setText(id, v){ const el = document.getElementById(id); if (el) el.textContent = v; }
  function show(id){ const el = document.getElementById(id); if (el) el.classList.remove("hidden"); }

  function bindMarginMode(){
    const mode = document.getElementById("mrg-mode");
    function upd(){
      const m = mode.value;
      document.getElementById("mrg-buy-wrap").classList.toggle("hidden", m === "c");
      document.getElementById("mrg-sell-wrap").classList.toggle("hidden", m === "b");
      document.getElementById("mrg-pct-wrap").classList.toggle("hidden", m === "a");
    }
    mode.addEventListener("change", upd); upd();
  }
  function bindIvaCustom(){
    const sel = document.getElementById("iva-rate");
    const wrap = document.getElementById("iva-custom-wrap");
    sel.addEventListener("change", () => wrap.classList.toggle("hidden", sel.value !== "custom"));
  }
  function bindPercentMode(){
    const sel = document.getElementById("pct-mode");
    function upd(){
      const m = sel.value;
      const xy = ["of","is"].includes(m);
      document.getElementById("pct-x-wrap").classList.toggle("hidden", !xy);
      document.getElementById("pct-y-wrap").classList.toggle("hidden", !xy);
      document.getElementById("pct-a-wrap").classList.toggle("hidden", xy);
      document.getElementById("pct-b-wrap").classList.toggle("hidden", xy);
    }
    sel.addEventListener("change", upd); upd();
  }
  function bindInvestMode(){
    const sel = document.getElementById("inv-mode");
    function upd(){
      const grow = sel.value === "grow";
      document.getElementById("inv-pmt-wrap").classList.toggle("hidden", !grow);
      document.getElementById("inv-target-wrap").classList.toggle("hidden", grow);
    }
    sel.addEventListener("change", upd); upd();
  }

  // ---------- INIT ----------
  function init(){
    initOnboarding();
    applyTheme(Storage.getTheme());

    renderHome();
    renderAll();
    refreshFavorites();

    bindSearch("search-home", "home-grid");
    bindSearch("search-all", "all-grid");

    // Nav
    document.querySelectorAll("[data-nav]").forEach(b => {
      b.addEventListener("click", () => {
        const map = { home:"screen-home", calculators:"screen-calculators", history:"screen-history", favorites:"screen-favorites", settings:"screen-settings", privacy:"screen-privacy", about:"screen-about", contact:"screen-contact" };
        show(map[b.dataset.nav]);
      });
    });
    document.getElementById("btn-back").addEventListener("click", back);
    document.getElementById("btn-theme").addEventListener("click", toggleTheme);
    document.getElementById("btn-toggle-theme").addEventListener("click", toggleTheme);
    document.getElementById("btn-clear-history").addEventListener("click", () => {
      Storage.clearHistory(); renderHistory(); UI.toast("Histórico apagado");
    });

    document.getElementById("btn-cr-amort").addEventListener("click", () => {
      document.getElementById("cr-amort-wrap").classList.toggle("hidden");
    });

    bindCalcButtons();
    bindMarginMode();
    bindIvaCustom();
    bindPercentMode();
    bindInvestMode();
    initGeneralCalc();

    // Marca primeiro cálculo para AdMob
    const origSave = saveHistory;
    window.__saveHistory = saveHistory;
    saveHistory = function(entry){
      origSave(entry);
      markFirstCalcDone();
    };
  }

  document.addEventListener("DOMContentLoaded", init);

  return { openCalc, refreshFavorites };
})();
