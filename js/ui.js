/**
 * Utilitários de UI: formatação PT, toasts, gráficos, render de cards.
 */
const UI = (() => {

  // Formatação PT: 1 250,50 €
  function eur(n){
    if (!isFinite(n)) return "—";
    const rounded = Math.round(n * 100) / 100;
    const parts = rounded.toFixed(2).split(".");
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return intPart + "," + parts[1] + " €";
  }
  function pct(n, digits = 2){
    if (!isFinite(n)) return "—";
    return (Math.round(n * Math.pow(10,digits)) / Math.pow(10,digits)).toFixed(digits).replace(".", ",") + " %";
  }
  function num(n, digits = 2){
    if (!isFinite(n)) return "—";
    const parts = n.toFixed(digits).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return parts.join(",");
  }

  function toast(msg){
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.add("hidden"), 2000);
  }

  // Render de cards de calculadoras
  function renderCard(calc){
    const favs = Storage.getFavorites();
    const isFav = favs.includes(calc.id);
    const btn = document.createElement("button");
    btn.className = "card";
    btn.dataset.id = calc.id;
    btn.innerHTML = `
      <span class="emoji">${calc.emoji}</span>
      <span class="name">${calc.name}</span>
      <span class="cat">${calc.cat}</span>
      <span class="fav ${isFav ? "on" : ""}" data-fav="${calc.id}" title="Favorito">${isFav ? "⭐" : "☆"}</span>
    `;
    btn.addEventListener("click", (e) => {
      const favEl = e.target.closest("[data-fav]");
      if (favEl){
        e.stopPropagation();
        Storage.toggleFavorite(calc.id);
        App.refreshFavorites();
        return;
      }
      App.openCalc(calc);
    });
    return btn;
  }

  function renderGrid(container, list){
    container.innerHTML = "";
    list.forEach(c => container.appendChild(renderCard(c)));
  }

  // Gráfico simples (linhas) em Canvas
  function lineChart(canvas, series, opts = {}){
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || canvas.width;
    const cssH = canvas.clientHeight || canvas.height;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0,0,cssW,cssH);

    const pad = { l: 46, r: 12, t: 12, b: 26 };
    const w = cssW - pad.l - pad.r;
    const h = cssH - pad.t - pad.b;

    if (!series || series.length === 0){
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--muted");
      ctx.font = "12px system-ui";
      ctx.fillText("Sem dados", pad.l, pad.t + 10);
      return;
    }

    const xs = series.map(s => s.year ?? s.x);
    const yKeys = opts.keys || ["invested","value"];
    const colors = opts.colors || ["#64748b","#0f766e"];
    const labels = opts.labels || ["Investido","Valor"];

    let max = 0;
    series.forEach(s => yKeys.forEach(k => { if (s[k] > max) max = s[k]; }));
    if (max === 0) max = 1;

    // Eixos
    const textColor = getComputedStyle(document.body).getPropertyValue("--muted");
    const gridColor = getComputedStyle(document.body).getPropertyValue("--border");
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + h); ctx.lineTo(pad.l + w, pad.t + h);
    ctx.stroke();

    // Grid horizontal + labels Y
    ctx.font = "10px system-ui";
    ctx.fillStyle = textColor;
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++){
      const y = pad.t + (h * i / 4);
      const val = max * (1 - i/4);
      ctx.strokeStyle = gridColor;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + w, y); ctx.stroke();
      ctx.fillText(shortEur(val), pad.l - 6, y + 3);
    }

    // Labels X
    ctx.textAlign = "center";
    const step = Math.max(1, Math.floor(xs.length / 6));
    xs.forEach((x, i) => {
      if (i % step === 0 || i === xs.length - 1){
        const px = pad.l + (w * i / (xs.length - 1 || 1));
        ctx.fillText("A" + x, px, pad.t + h + 16);
      }
    });

    // Linhas
    yKeys.forEach((key, ki) => {
      ctx.strokeStyle = colors[ki];
      ctx.lineWidth = 2;
      ctx.beginPath();
      series.forEach((s, i) => {
        const px = pad.l + (w * i / (series.length - 1 || 1));
        const py = pad.t + h - (h * (s[key] / max));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
    });

    // Legenda
    ctx.font = "11px system-ui";
    let lx = pad.l;
    labels.forEach((lab, i) => {
      ctx.fillStyle = colors[i];
      ctx.fillRect(lx, 4, 10, 10);
      ctx.fillStyle = textColor;
      ctx.textAlign = "left";
      ctx.fillText(lab, lx + 14, 13);
      lx += ctx.measureText(lab).width + 34;
    });
  }

  function shortEur(v){
    if (v >= 1e6) return (v/1e6).toFixed(1).replace(".",",") + "M€";
    if (v >= 1e3) return (v/1e3).toFixed(1).replace(".",",") + "k€";
    return v.toFixed(0) + "€";
  }

  return { eur, pct, num, toast, renderCard, renderGrid, lineChart };
})();
