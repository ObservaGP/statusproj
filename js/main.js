// =====================================================
// STATUSPROJ – CACHE LOCAL E EXPORTAÇÃO
// =====================================================

const CACHE_KEY = "statusproj_cache";
const VALIDATION_KEY = "OK_STATUSPROJ_FILE_V1";

// Mostrar aviso inicial apenas uma vez
window.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("statusproj_notice")) {
    alert(
      "Aviso: Este sistema cria um arquivo temporário local (statusproj_cache) no navegador.\n" +
      "Suas alterações são salvas automaticamente e podem ser exportadas manualmente."
    );
    localStorage.setItem("statusproj_notice", "shown");
  }

  // Criar cache se não existir
  if (!localStorage.getItem(CACHE_KEY)) {
    const initialData = {
      statusproj_validation: VALIDATION_KEY,
      organizacoes: {},
      relacionamentos: {}
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(initialData));
  }

  // Carregar automaticamente os dados na página atual
  const page = detectPage();
  if (page) loadPageData(page);
});

// Detectar qual página está aberta
function detectPage() {
  if (location.pathname.includes("organizacoes")) return "organizacoes";
  if (location.pathname.includes("relacionamentos")) return "relacionamentos";
  return null;
}

// ----------------------------
// Salvar automaticamente
// ----------------------------
document.addEventListener("input", (e) => {
  const page = detectPage();
  if (!page) return;

  const form = document.querySelector("form");
  const formData = {};

  form.querySelectorAll("input, select, textarea").forEach((el) => {
    if (el.type === "checkbox") {
      const checkboxes = Array.from(form.querySelectorAll("input[type=checkbox]:checked"))
        .map((c) => c.value);
      formData["campus"] = checkboxes;
    } else {
      formData[el.name] = el.value;
    }
  });

  const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  cache[page] = formData;
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
});

// ----------------------------
// Carregar dados do cache
// ----------------------------
function loadPageData(page) {
  const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  const data = cache[page] || {};
  for (const [key, value] of Object.entries(data)) {
    const el = document.querySelector(`[name="${key}"]`);
    if (!el) continue;
    if (Array.isArray(value)) {
      value.forEach(v => {
        const cb = document.querySelector(`input[type=checkbox][value="${v}"]`);
        if (cb) cb.checked = true;
      });
    } else {
      el.value = value;
    }
  }
}

// ----------------------------
// Exportar cache para JSON
// ----------------------------
function exportCache() {
  const data = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "statusproj_cache.json";
  a.click();
  URL.revokeObjectURL(url);
  alert("Arquivo de cache exportado com sucesso!");
}

// ----------------------------
// Importar cache de JSON
// ----------------------------
function importCache(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.statusproj_validation !== VALIDATION_KEY) {
        alert("Arquivo inválido ou corrompido.");
        return;
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      alert("Cache importado com sucesso!");
    } catch {
      alert("Erro ao ler o arquivo JSON.");
    }
  };
  reader.readAsText(file);
}

// ----------------------------
// Adicionar nova opção nos selects
// ----------------------------
function addCustomOption(selectEl) {
  if (selectEl.value === "nova") {
    const nova = prompt("Digite o novo valor:");
    if (nova) {
      const opt = document.createElement("option");
      opt.textContent = nova;
      opt.value = nova;
      selectEl.insertBefore(opt, selectEl.lastElementChild);
      selectEl.value = nova;
    } else {
      selectEl.value = "";
    }
  }
}
