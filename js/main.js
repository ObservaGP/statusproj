// ============================
// STATUSPROJ CORE FUNCTIONS
// ============================

// Chave de validação do arquivo JSON
const VALIDATION_KEY = "OK_STATUSPROJ_FILE_V1";

// ----------------------------
// Função: Armazena campos localmente
// ----------------------------
document.addEventListener("input", (e) => {
  const form = e.target.closest("form");
  if (form) {
    const page = location.pathname.includes("organizacoes")
      ? "organizacoes"
      : location.pathname.includes("relacionamentos")
      ? "relacionamentos"
      : null;

    if (page) saveFormData(page);
  }
});

function saveFormData(page) {
  const data = {};
  document.querySelectorAll("form input, form select, form textarea").forEach((el) => {
    if (el.type === "checkbox") {
      const checked = Array.from(document.querySelectorAll("input[type=checkbox]:checked")).map(c => c.value);
      data[el.name] = checked;
    } else {
      data[el.name] = el.value;
    }
  });
  localStorage.setItem(`statusproj_${page}`, JSON.stringify(data));
}

// ----------------------------
// Função: Carrega campos salvos
// ----------------------------
window.addEventListener("DOMContentLoaded", () => {
  const page = location.pathname.includes("organizacoes")
    ? "organizacoes"
    : location.pathname.includes("relacionamentos")
    ? "relacionamentos"
    : null;

  if (page) loadFormData(page);
});

function loadFormData(page) {
  const data = JSON.parse(localStorage.getItem(`statusproj_${page}`) || "{}");
  for (const [key, value] of Object.entries(data)) {
    const el = document.querySelector(`[name="${key}"]`);
    if (!el) continue;
    if (Array.isArray(value)) {
      value.forEach(v => {
        const cb = document.querySelector(`input[type=checkbox][name="${key}"][value="${v}"]`);
        if (cb) cb.checked = true;
      });
    } else {
      el.value = value;
    }
  }
}

// ----------------------------
// Função: Exportar JSON consolidado
// ----------------------------
function exportJSON() {
  const org = JSON.parse(localStorage.getItem("statusproj_organizacoes") || "{}");
  const rel = JSON.parse(localStorage.getItem("statusproj_relacionamentos") || "{}");

  const allData = {
    statusproj_validation: VALIDATION_KEY,
    organizacoes: org,
    relacionamentos: rel,
  };

  const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "statusproj_dados.json";
  a.click();
  URL.revokeObjectURL(url);
}

// ----------------------------
// Função: Importar JSON
// ----------------------------
function importJSON(fileInput) {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.statusproj_validation !== VALIDATION_KEY) {
        alert("Arquivo inválido! Estrutura não reconhecida.");
        return;
      }
      localStorage.setItem("statusproj_organizacoes", JSON.stringify(data.organizacoes));
      localStorage.setItem("statusproj_relacionamentos", JSON.stringify(data.relacionamentos));
      alert("Dados importados com sucesso!");
    } catch (err) {
      alert("Erro ao ler o arquivo JSON.");
    }
  };
  reader.readAsText(file);
}
