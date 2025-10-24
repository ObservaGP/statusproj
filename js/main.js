// ===============================
// STATUSPROJ v2 — Cache por página + Criptografia + Utilidades
// ===============================

// ---------- Identificador de página ----------
// Use <body data-page="organizacoes"> para definir manualmente.
// Se não houver, usa o nome do arquivo (index.html -> "index").
function getPageKey() {
  const attr = document.body?.dataset?.page;
  if (attr && attr.trim()) return attr.trim();
  const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  return file.replace(/\.html?$/i, "") || "index";
}

// ---------- Acesso central ao cache ----------
const CACHE_KEY = "statusproj_cache_v2";

function getFullCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    if (!obj.pages) obj.pages = {};
    if (!obj.versions) obj.versions = {};
    return obj;
  } catch {
    return { pages: {}, versions: {} };
  }
}
function setFullCache(obj) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
}

// ---------- Versões (ler/aplicar) ----------
function readVersionInputs() {
  const left  = document.getElementById("versaoEsquerda");
  const right = document.getElementById("versaoDireita");
  return {
    versao_esquerda: left  ? left.value  : undefined,
    versao_direita:  right ? right.value : undefined,
    statusproj_version: right ? right.value : (localStorage.getItem("statusproj_version") || "")
  };
}
function applyVersionInputs(versions) {
  const left  = document.getElementById("versaoEsquerda");
  const right = document.getElementById("versaoDireita");
  if (left  && typeof versions.versao_esquerda    === "string") left.value  = versions.versao_esquerda;
  if (right && typeof versions.versao_direita     === "string") right.value = versions.versao_direita;
  if (typeof versions.statusproj_version === "string") {
    localStorage.setItem("statusproj_version", versions.statusproj_version);
  }
}

// ---------- Snapshot dos formulários da página ----------
function buildPageSnapshot() {
  const data = {};
  document.querySelectorAll("form").forEach(form => {
    if (!form.id) return;
    const formData = {};
    form.querySelectorAll("input, textarea, select").forEach(el => {
      if (!el.name) return;
      formData[el.name] = el.value;
    });
    data[form.id] = formData;
  });
  return data;
}

// ---------- Status visual "salvo às ..." ----------
function formatDateTimeBR(d = new Date()) {
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2,"0");
  const mi = String(d.getMinutes()).padStart(2,"0");
  const ss = String(d.getSeconds()).padStart(2,"0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
}
function setSaveStatus(ts) {
  const el = document.getElementById("saveStatus");
  if (!el) return;
  el.textContent = `As alterações foram salvas localmente às ${ts}.`;
}

// === Botão "Salvar" no bloco 2 ===
function savePageNow(){
  updateLocalCache();                       // persiste a página atual no cache por página
  const ts = formatDateTimeBR(new Date());  // carimbo BR
  localStorage.setItem("statusproj_last_saved", ts);
  localStorage.setItem(`statusproj_last_saved_${getPageKey()}`, ts);
  setSaveStatus(ts);                        // mostra em vermelho no rodapé
}

// ---------- Gravar/Carregar cache POR PÁGINA ----------
function updateLocalCache() {
  const key  = getPageKey();
  const full = getFullCache();

  full.pages[key] = buildPageSnapshot();

  // também persiste versões (quando existirem na página)
  const versions = readVersionInputs();
  Object.assign(full.versions, {
    versao_esquerda:   versions.versao_esquerda   ?? full.versions.versao_esquerda,
    versao_direita:    versions.versao_direita    ?? full.versions.versao_direita,
    statusproj_version:versions.statusproj_version?? full.versions.statusproj_version
  });

  setFullCache(full);

  // carimbo de salvamento (global e por página)
  const ts = formatDateTimeBR(new Date());
  localStorage.setItem("statusproj_last_saved", ts);
  localStorage.setItem(`statusproj_last_saved_${key}`, ts);
  setSaveStatus(ts);
}
function loadLocalCache() {
  const key  = getPageKey();
  const full = getFullCache();
  const pageData = full.pages[key] || {};

  // restaura campos da página
  Object.keys(pageData).forEach(formId => {
    const form = document.getElementById(formId);
    if (!form) return;
    const fields = pageData[formId] || {};
    Object.keys(fields).forEach(name => {
      const el = form.querySelector(`[name="${name}"]`);
      if (el) el.value = fields[name];
    });
  });

  // restaura versões (se houver)
  applyVersionInputs(full.versions || {});

  // restaura carimbo "salvo às ..."
  const pageTs = localStorage.getItem(`statusproj_last_saved_${key}`) ||
                 localStorage.getItem("statusproj_last_saved");
  if (pageTs) setSaveStatus(pageTs);
}

// liga salvamento automático
document.addEventListener("input", e => {
  if (e.target.closest("form")) updateLocalCache();
});
window.addEventListener("DOMContentLoaded", loadLocalCache);

// ---------- CHAVE DE CRIPTOGRAFIA (persistente) ----------
function getCryptoKey() {
  const input = document.getElementById("cryptoKey");
  const live  = input ? input.value.trim().toUpperCase() : "";
  const stored = localStorage.getItem("statusproj_crypto_key") || "";
  return (live || stored).toUpperCase();
}
function isValidKey(key) {
  return /^[A-Z0-9]{1,10}$/.test(key);
}
// carrega e grava a chave quando o campo existir (ex.: página inicial)
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("cryptoKey");
  if (!input) return;
  const stored = localStorage.getItem("statusproj_crypto_key") || "";
  if (stored && !input.value) input.value = stored;
  input.addEventListener("input", e => {
    const v = e.target.value.trim().toUpperCase();
    if (/^[A-Z0-9]{0,10}$/.test(v)) {
      localStorage.setItem("statusproj_crypto_key", v);
    }
  });
});

// ---------- Criptografia simples (XOR + Base64) ----------
function simpleEncrypt(text, key) {
  if (!key) return text;
  let out = "";
  for (let i = 0; i < text.length; i++) {
    out += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(out);
}
function simpleDecrypt(payload, key) {
  try {
    const dec = atob(payload);
    let out = "";
    for (let i = 0; i < dec.length; i++) {
      out += String.fromCharCode(dec.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return out;
  } catch {
    return null;
  }
}

// ---------- Exportar (TODAS as páginas) ----------
function exportCache() {
  const key = getCryptoKey();
  const msg = document.getElementById("cryptoMessage");
  if (msg) msg.innerHTML = "";

  if (!key) {
    if (msg) msg.innerHTML =
      '<span class="line1">Arquivo não exportado.</span>' +
      '<span class="line2">Crie uma chave de criptografia na tela inicial.</span>';
    return;
  }
  if (!isValidKey(key)) {
    if (msg) msg.innerHTML =
      '<span class="line1">Chave inválida.</span>' +
      '<span class="line2">Use apenas letras e números (até 10 caracteres).</span>';
    return;
  }

  // garante que a página atual está persistida
  updateLocalCache();

  const full = getFullCache();
  const payload   = { meta: "STATUSPROJ-ENCRYPTED", cache: full };
  const encrypted = simpleEncrypt(JSON.stringify(payload), key);

  const blob = new Blob([encrypted], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = "statusproj_encrypted.json";
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Importar (TODAS as páginas) ----------
function importCache(input) {
  const file = input.files?.[0];
  if (!file) return;

  const key = getCryptoKey();
  const msg = document.getElementById("cryptoMessage");
  if (msg) msg.innerHTML = "";

  if (!key) {
    if (msg) msg.innerHTML =
      '<span class="line1">Informe a chave de criptografia antes de importar.</span>' +
      '<span class="line2">Defina a chave na tela inicial.</span>';
    input.value = "";
    return;
  }
  if (!isValidKey(key)) {
    if (msg) msg.innerHTML =
      '<span class="line1">Chave inválida.</span>' +
      '<span class="line2">Use apenas A–Z e 0–9 (máx. 10).</span>';
    input.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    const encrypted = e.target.result;
    const decrypted = simpleDecrypt(encrypted, key);
    if (!decrypted) {
      if (msg) msg.innerHTML =
        '<span class="line1">CHAVE INVÁLIDA</span>' +
        '<span class="line2">Não foi possível decodificar o arquivo.</span>';
      input.value = "";
      return;
    }
    try {
      const obj = JSON.parse(decrypted);
      if (obj?.meta !== "STATUSPROJ-ENCRYPTED" || !obj.cache) {
        if (msg) msg.innerHTML =
          '<span class="line1">CHAVE INVÁLIDA</span>' +
          '<span class="line2">Arquivo não reconhecido.</span>';
        input.value = "";
        return;
      }
      setFullCache(obj.cache); // substitui todo o cache
      loadLocalCache();        // aplica na página atual
      alert("Importação concluída com sucesso!");
    } catch {
      if (msg) msg.innerHTML =
        '<span class="line1">Erro ao decodificar o arquivo.</span>' +
        '<span class="line2">Verifique a chave e o conteúdo.</span>';
    }
  };
  reader.readAsText(file);
}

// ---------- Copiar / Limpar entre fichas ----------
function copyFormData(sourceId, targetId) {
  const src = document.getElementById(sourceId);
  const tgt = document.getElementById(targetId);
  if (!src || !tgt) return;

  const srcData = new FormData(src);
  srcData.forEach((v, k) => {
    const field = tgt.querySelector(`[name="${k}"]`);
    if (field) field.value = v;
  });
  updateLocalCache();
  alert("➡️ Dados copiados para o segundo bloco!");
}
function clearForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.reset();
  updateLocalCache();
  alert("✖️ Dados do segundo bloco limpos!");
}

// ---------- Versões (esquerda local / direita global) ----------
document.addEventListener("DOMContentLoaded", () => {
  const esquerda = document.getElementById("versaoEsquerda");
  const direita  = document.getElementById("versaoDireita");

  // carrega versões persistidas
  const full = getFullCache();
  applyVersionInputs(full.versions || {});

  // listeners para persistir alterações
  esquerda?.addEventListener("input", e => {
    const f = getFullCache();
    f.versions.versao_esquerda = e.target.value;
    setFullCache(f);
  });
  direita?.addEventListener("input", e => {
    const f = getFullCache();
    f.versions.versao_direita = e.target.value;
    f.versions.statusproj_version = e.target.value; // propaga global
    localStorage.setItem("statusproj_version", e.target.value);
    setFullCache(f);
  });
});
