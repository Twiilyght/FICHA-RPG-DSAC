function atualizarLog(){
  const box = document.getElementById("logRolagens");
  box.innerHTML = "";

  logRolagens.slice().reverse().forEach(l => {
    box.innerHTML += `
      <div class="log-item">
        <span class="log-nome">${l.nome}</span>
        → ${l.tipo} <br>
        ${l.detalhe} = <span class="log-valor">${l.total}</span>
        <div style="font-size:11px; opacity:0.6">${l.hora}</div>
      </div>
    `;
  });
}

function mostrarPopup(titulo, detalhe, total){

  const popup = document.getElementById("dicePopup");

  document.getElementById("popupTitulo").innerText = titulo;
  document.getElementById("popupDetalhe").innerText = detalhe;
  document.getElementById("popupTotal").innerText = total;

  popup.style.display = "block";
}

function fecharPopup(){
  document.getElementById("dicePopup").style.display = "none";
}

function criarInterface(){
  const aBox = document.getElementById("atributos");
  aBox.innerHTML = "";

  atributos.forEach(a=>{
    aBox.innerHTML += `
    <div class="atributo">
      <div>[${a.sigla}] ${a.nome}</div>
      <select id="atr_${a.sigla}" onchange="recalcularVidaSanidade(); atualizarBloqueio(); atualizarDT();">
        ${[...Array(21).keys()].map(v=>`<option value="${v}">${v}</option>`).join("")}
      </select>
      <span class="dice" onclick="rolarAtributo('${a.sigla}')">🎲</span>
      <span id="resAtr_${a.sigla}" class="resultado"></span>
    </div>`;
  });
}

function renderHabilidades(){
  const box=document.getElementById("habilidades");
  box.innerHTML="";

  habilidades.forEach((h,i)=>{
    box.innerHTML+=`
    <div class="habilidade">
      <input placeholder="Nome" value="${h.nome}" 
        oninput="habilidades[${i}].nome=this.value">
      <input placeholder="Dado (ex: 2d6+3)" value="${h.dado}"
        oninput="habilidades[${i}].dado=this.value">
      <span class="dice" onclick="rolarHabilidade(${i})">🎲</span>
      <span id="resHab_${i}" class="resultado"></span>
      <textarea placeholder="Descrição"
        oninput="habilidades[${i}].desc=this.value">${h.desc}</textarea>
      <button onclick="removerHabilidade(${i})">❌</button>
    </div>`;
  });
}

const abas = document.querySelectorAll(".tab-button");
const conteudos = document.querySelectorAll(".tab-content");

abas.forEach(btn => {
  btn.addEventListener("click", () => {
    // Remove ativo das abas
    abas.forEach(b => b.classList.remove("active"));
    // Oculta todos os conteúdos
    conteudos.forEach(c => c.classList.remove("active"));

    // Ativa aba clicada
    btn.classList.add("active");
    // Mostra conteúdo correspondente
    const tab = btn.dataset.tab;
    document.getElementById(tab).classList.add("active");
  });
});
