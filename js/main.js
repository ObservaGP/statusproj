// Adiciona opção personalizada nos menus select
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

// Formata moeda (R$)
document.addEventListener("input", (e) => {
  if (e.target.classList.contains("currency")) {
    let valor = e.target.value.replace(/[^\d,]/g, "").replace(",", ".");
    if (!isNaN(valor) && valor !== "") {
      e.target.value = parseFloat(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      });
    }
  }
});

// Calcula diferença de meses entre duas datas
function calcularDuracao() {
  const inicio = document.querySelector('input[name="inicio"]').value;
  const fim = document.querySelector('input[name="fim"]').value;
  if (inicio && fim) {
    const d1 = new Date(inicio);
    const d2 = new Date(fim);
    const diffMeses = Math.round((d2 - d1) / (1000 * 60 * 60 * 24 * 30.44));
    document.querySelector("#duracaoCalc span").textContent = `${diffMeses} meses`;
  }
}

