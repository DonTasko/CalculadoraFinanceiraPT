/**
 * Camada de persistência local (localStorage).
 */
const Storage = (() => {
  const KEY = {
    theme: "cfpt.theme",
    onboard: "cfpt.onboard.done",
    history: "cfpt.history",
    favorites: "cfpt.favorites"
  };

  function safeGet(key, fallback){
    try{
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    }catch(e){ return fallback; }
  }
  function safeSet(key, value){
    try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){}
  }

  return {
    // Tema
    getTheme(){ return safeGet(KEY.theme, "light"); },
    setTheme(t){ safeSet(KEY.theme, t); },

    // Onboarding
    isOnboardingDone(){ return safeGet(KEY.onboard, false); },
    setOnboardingDone(v){ safeSet(KEY.onboard, v); },

    // Histórico
    getHistory(){ return safeGet(KEY.history, []); },
    setHistory(h){ safeSet(KEY.history, h); },
    addHistory(entry){
      const h = this.getHistory();
      h.unshift({ id: Date.now() + "-" + Math.random().toString(36).slice(2,6), ...entry });
      this.setHistory(h.slice(0, 200)); // limite
    },
    removeHistory(id){
      const h = this.getHistory().filter(x => x.id !== id);
      this.setHistory(h);
    },
    clearHistory(){ this.setHistory([]); },

    // Favoritos
    getFavorites(){ return safeGet(KEY.favorites, []); },
    setFavorites(f){ safeSet(KEY.favorites, f); },
    toggleFavorite(id){
      const f = this.getFavorites();
      const i = f.indexOf(id);
      if (i >= 0) f.splice(i, 1); else f.push(id);
      this.setFavorites(f);
      return f;
    }
  };
})();
