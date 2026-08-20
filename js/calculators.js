/**
 * Registo de todas as calculadoras (metadados para UI, pesquisa e favoritos).
 */
const CALCULATORS = [
  { id:"salary",           emoji:"💶", name:"Salário líquido",      cat:"Pessoal",     screen:"screen-salary" },
  { id:"iva",              emoji:"🧾", name:"IVA",                  cat:"Empresas",    screen:"screen-iva" },
  { id:"discount",         emoji:"📉", name:"Descontos",            cat:"Pessoal",     screen:"screen-discount" },
  { id:"margin",           emoji:"📊", name:"Margem & Lucro",       cat:"Empresas",    screen:"screen-margin" },
  { id:"percent",          emoji:"➗", name:"Percentagens",         cat:"Pessoal",     screen:"screen-percent" },
  { id:"simple-interest",  emoji:"💹", name:"Juros simples",        cat:"Investimento",screen:"screen-simple-interest" },
  { id:"compound-interest",emoji:"📈", name:"Juros compostos",      cat:"Investimento",screen:"screen-compound-interest" },
  { id:"credit",           emoji:"🏦", name:"Crédito",              cat:"Crédito",     screen:"screen-credit" },
  { id:"mortgage",         emoji:"🏠", name:"Crédito habitação",    cat:"Habitação",   screen:"screen-mortgage" },
  { id:"effort-rate",      emoji:"📐", name:"Taxa de esforço",      cat:"Habitação",   screen:"screen-effort-rate" },
  { id:"investment",       emoji:"💰", name:"Investimento",         cat:"Investimento",screen:"screen-investment" },
  { id:"rule-of-three",    emoji:"🔢", name:"Regra de três",        cat:"Pessoal",     screen:"screen-rule-of-three" },
  { id:"calculator-general",emoji:"🧮",name:"Calculadora geral",    cat:"Utilitários", screen:"screen-calculator-general" }
];

/**
 * Parser matemático seguro (sem eval).
 * Implementação baseada em Shunting-yard (Dijkstra).
 */
const MathParser = (() => {
  const OPS = { "+":2, "-":2, "*":3, "/":3, "%":3, "^":4, "u-":4 };
  const RIGHT = new Set(["^","u-"]);

  function tokenize(expr){
    const tokens = [];
    let i = 0;
    while (i < expr.length){
      const ch = expr[i];
      if (/\s/.test(ch)){ i++; continue; }
      if (/[0-9.,]/.test(ch)){
        let num = "";
        while (i < expr.length && /[0-9.,]/.test(expr[i])){
          // PT: vírgula como decimal
          num += expr[i] === "," ? "." : expr[i];
          i++;
        }
        tokens.push({ type:"num", value: parseFloat(num) });
        continue;
      }
      if ("+-*/%^()".includes(ch)){
        // menos unário
        if (ch === "-" && (tokens.length === 0 || tokens[tokens.length-1].type === "op" || tokens[tokens.length-1].value === "(")){
          tokens.push({ type:"op", value:"u-" });
        } else {
          tokens.push({ type:"op", value:ch });
        }
        i++; continue;
      }
      throw new Error("Caráter inválido: " + ch);
    }
    return tokens;
  }

  function toRPN(tokens){
    const out = [], stack = [];
    for (let idx = 0; idx < tokens.length; idx++){
      const t = tokens[idx];
      if (t.type === "num"){ out.push(t); continue; }
      if (t.value === "("){ stack.push(t); continue; }
      if (t.value === ")"){
        while (stack.length && stack[stack.length-1].value !== "("){
          out.push(stack.pop());
        }
        if (!stack.length) throw new Error("Parênteses desequilibrados");
        stack.pop();
        continue;
      }
      // operador
      const p1 = OPS[t.value];
      while (stack.length){
        const top = stack[stack.length-1];
        if (top.value === "(") break;
        const p2 = OPS[top.value] || 0;
        if (p2 > p1 || (p2 === p1 && !RIGHT.has(t.value))){
          out.push(stack.pop());
        } else break;
      }
      stack.push(t);
    }
    while (stack.length){
      const t = stack.pop();
      if (t.value === "(" || t.value === ")") throw new Error("Parênteses desequilibrados");
      out.push(t);
    }
    return out;
  }

  function evalRPN(rpn){
    const st = [];
    for (const t of rpn){
      if (t.type === "num"){ st.push(t.value); continue; }
      if (t.value === "u-"){ st.push(-st.pop()); continue; }
      const b = st.pop(), a = st.pop();
      switch (t.value){
        case "+": st.push(a + b); break;
        case "-": st.push(a - b); break;
        case "*": st.push(a * b); break;
        case "/": if (b === 0) throw new Error("Divisão por zero"); st.push(a / b); break;
        case "%": st.push(a % b); break;
        case "^": st.push(Math.pow(a, b)); break;
      }
    }
    if (st.length !== 1) throw new Error("Expressão inválida");
    return st[0];
  }

  function evaluate(expr){
    if (!expr || !expr.trim()) return 0;
    const tokens = tokenize(expr);
    const rpn = toRPN(tokens);
    return evalRPN(rpn);
  }

  return { evaluate };
})();
