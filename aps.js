let logRolagens = [];
let habilidades = [];

function registrarLog(tipo, detalhe, total){
  const nome = document.getElementById("jogador").value || "Anônimo";

  const log = {
    nome,
    tipo,
    detalhe,
    total,
    hora: new Date().toLocaleString('pt-BR')
  };

  database.ref('rolagens').push(log)
    .then(() => {
      console.log("Log de rolagem enviado para o Firebase!");
    })
    .catch((error) => {
      console.error("Erro ao enviar log para o Firebase: ", error);
    });
}
  
function exportarFicha(){
  const slot = document.getElementById("slot").value;
  const chave = "fichaRPG_" + slot;

  const bruto = localStorage.getItem(chave);

  if(!bruto){
    alert("Nenhuma ficha salva nesse slot!");
    return;
  }

  const dados = JSON.parse(bruto);

  dados.imagem = "";

  const codigo = btoa(JSON.stringify(dados));

  document.getElementById("codigoFicha").value = codigo;

  alert("Ficha exportada!");
}

function importarFicha(){
  const codigo = document.getElementById("codigoFicha").value;

  if(!codigo){
    alert("Cole um código válido!");
    return;
  }

  try{
    const dados = JSON.parse(atob(codigo));

    const slot = document.getElementById("slot").value;
    const chave = "fichaRPG_" + slot;

    localStorage.setItem(chave, JSON.stringify(dados));

    carregarFicha();

    alert("Ficha importada com sucesso!");
  }catch(e){
    console.error(e);
    alert("Código inválido!");
  }
}
  
const somDado = new Audio("dado.mp3");
  
const atributos = [
{sigla:"FOR", nome:"Força"},
{sigla:"CON", nome:"Constituição"},
{sigla:"AGI", nome:"Agilidade"},
{sigla:"INT", nome:"Intelecto"},
{sigla:"POD", nome:"Poder"}
];

const pericias = [
["FOR","Atletismo"],["FOR","Luta"],
["CON","Fortitude"],
["AGI","Reflexos"],["AGI","Furtividade"],["AGI","Acrobacia"],
["AGI","Iniciativa"],["AGI","Pontaria"],["AGI","Pilotagem"],
["INT","Ciências"],["INT","Tática"],["INT","Investigação"],
["INT","Medicina"],["INT","Tecnologia"],["INT","Sobrevivência"],
["INT","Enganação"],["INT","Diplomacia"],["POD","Intimidação"],
["INT","Artes"],["POD","Intuição"],["INT","Percepção"],
["INT","Adestramento"],["POD","Charme"],["POD","Vontade"],["POD","Energia"]
];

let ultimoTesteFortitude = 0;

/* =============== INTERFACE =============== */
function criarPericias(){
  const pBox = document.getElementById("pericias");
  pBox.innerHTML = "";
  
  pericias.forEach((p,i)=>{
    const id = "per_"+i;

    pBox.innerHTML += `
    <div class="pericia">
      <div>
        <select id="atrKey_${id}">
          ${atributos.map(a=>`<option value="${a.sigla}" ${a.sigla===p[0]?"selected":""}>[${a.sigla}]</option>`).join("")}
        </select>
        ${p[1]}
      </div>

      <select id="${id}">
        ${[...Array(10).keys()].map(v=>`<option value="${v+1}">${v+1}</option>`).join("")}
      </select>

      <input type="number" id="bonus_${id}" value="0" style="width:60px">

      <span class="dice" onclick="rolarPericia('${id}')">🎲</span>
      <span id="res_${id}" class="resultado"></span>
    </div>`;
  });
}

/* =============== ROLAGENS =============== */
  
function d20(){

  somDado.currentTime = 0;
  somDado.play();

  return Math.floor(Math.random()*20)+1;

}

function limparDepois(id,ms=8000){
  setTimeout(()=>{
    const el=document.getElementById(id);
    if(el) el.innerText="";
  },ms);
}

function rolarAtributo(sigla){
  
  const v=Number(document.getElementById("atr_"+sigla).value);
  const resId="resAtr_"+sigla;
  const d=d20();
  const total = d + v;
  document.getElementById(resId).innerText =
`1d20 (${d}) + ${v} = ${total}`;

  mostrarPopup(
    sigla,
    `1d20 (${d}) + ${v}`,
    total
    );

  registrarLog(sigla, `1d20 (${d}) + ${v}`, total);
  
  limparDepois(resId);
}

function rolarPericia(id){
  
  const qtdDados = parseInt(document.getElementById(id).value);
  const sigla = document.getElementById("atrKey_"+id).value;
  const bonus = parseInt(document.getElementById("bonus_"+id).value) || 0;

  const atributoValor = parseInt(
    document.getElementById("atr_"+sigla).value
  ) || 0;

  let resultados = [];
  let maior = 0;

  for(let i = 0; i < qtdDados; i++){
    const roll = d20();
    resultados.push(roll);
    if(roll > maior) maior = roll;
  }

  const total = maior + atributoValor + bonus;

  const indice = parseInt(id.split("_")[1]);

  mostrarPopup(
    pericias[indice][1],
    `${qtdDados}d20 [${resultados.join(", ")}]`,
    total
  );

  registrarLog(pericias[indice][1], `${qtdDados}d20 [${resultados.join(", ")}] + ${atributoValor} + ${bonus}`, total);

  const resId = "res_" + id;

  document.getElementById(resId).innerText =
  `🎲 ${qtdDados}d20 [${resultados.join(", ")}] → maior: ${maior} + ${atributoValor} + ${bonus} = ${total}`;
  if(pericias[indice][1] === "Fortitude"){
    ultimoTesteFortitude = total;
    atualizarBloqueio();
  }
  
  limparDepois(resId);
}

/* =============== VIDA, SANIDADE & AURA =============== */
function recalcularVidaSanidade(){
  const nivel = Number(document.getElementById("nivel").value) || 1;

  const con = Number(document.getElementById("atr_CON").value) || 0;
  const pod = Number(document.getElementById("atr_POD").value) || 0;
  const intt = Number(document.getElementById("atr_INT").value) || 0;

  const vidaMax = (20 + con * 2) * nivel;

  const sanidadeMax = (20 + intt * 2) * nivel;

  const auraBase = (con + pod) * 3;
  const auraNivel = (con + pod) * (nivel - 1);
  const auraMax = auraBase + auraNivel;

  const vidaInput = document.getElementById("vida");
  const sanidadeInput = document.getElementById("sanidade");
  const auraInput = document.getElementById("aura");

  vidaInput.max = vidaMax;
  sanidadeInput.max = sanidadeMax;
  auraInput.max = auraMax;

  if(!vidaInput.value || vidaInput.value > vidaMax){
    vidaInput.value = vidaMax;
  }

  if(!sanidadeInput.value || sanidadeInput.value > sanidadeMax){
    sanidadeInput.value = sanidadeMax;
  }

  if(!auraInput.value || auraInput.value > auraMax){
    auraInput.value = auraMax;
  }

  document.getElementById("vidaMaxTxt").innerText = "Máx: " + vidaMax;
  document.getElementById("sanidadeMaxTxt").innerText = "Máx: " + sanidadeMax;
  document.getElementById("auraMaxTxt").innerText = "Máx: " + auraMax;
  document.getElementById("deslocamento").value = 5 + Number(document.getElementById("atr_AGI").value || 0);

  atualizarBarra("vida","vida-bar",vidaMax);
  atualizarBarra("sanidade","sanidade-bar",sanidadeMax);
  atualizarAura();
}

function atualizarBarra(inputId,barId,max){
  const v = Number(document.getElementById(inputId).value) || 0;
  document.getElementById(barId).style.width =
    max > 0 ? ((v / max) * 100) + "%" : "0%";
}

function atualizarAura(){
  const auraEl = document.getElementById("aura");
  const max = Number(auraEl.getAttribute("max")) || 0;

  let v = Number(auraEl.value) || 0;

  if(v > max) v = max;
  if(v < 0) v = 0;

  auraEl.value = v;

  document.getElementById("aura-bar").style.width =
    max > 0 ? ((v / max) * 100) + "%" : "0%";
}

function atualizarVida(){
  const max = Number(document.getElementById("vida").max) || 0;
  let v = Number(document.getElementById("vida").value) || 0;

  if(v > max) v = max;
  if(v < 0) v = 0;

  document.getElementById("vida").value = v;
  atualizarBarra("vida","vida-bar",max);
}

function atualizarSanidade(){
  const max = Number(document.getElementById("sanidade").max) || 0;
  let v = Number(document.getElementById("sanidade").value) || 0;

  if(v > max) v = max;
  if(v < 0) v = 0;

  document.getElementById("sanidade").value = v;
  atualizarBarra("sanidade","sanidade-bar",max);
}

function atualizarBloqueio(){

  const con = parseInt(document.getElementById("atr_CON").value) || 0;
  const rd = parseInt(document.getElementById("rdFisica").value) || 0;

  const bloqueioMenor = (2 * con) + rd;

  const bloqueioMaior = ultimoTesteFortitude + (2 * con) + rd;

  document.getElementById("bloqueioMenor").innerText = bloqueioMenor;
  document.getElementById("bloqueioMaior").innerText = bloqueioMaior;
}

function atualizarDT(){
  const poder = parseInt(document.getElementById("atr_POD").value) || 0;
  const bonus = parseInt(document.getElementById("dtBonus").value) || 0;

  const dt = 15 + poder + bonus;

  document.getElementById("dtTotal").innerText = dt;
}
  
/* =============== HABILIDADES =============== */
function adicionarHabilidade(){
  habilidades.push({nome:"",desc:"",dado:""});
  renderHabilidades();
}

function removerHabilidade(i){
  habilidades.splice(i,1);
  renderHabilidades();
}

function rolarHabilidade(i){

  somDado.currentTime = 0;
  somDado.play();
  
  const h = habilidades[i];
  const resId = "resHab_" + i;

  if(!h || !h.dado){
    document.getElementById(resId).innerText = "Insira um dado válido!";
    limparDepois(resId);
    return;
  }

  const regex = /(\d+d\d+!\d+|\d+d\d+!|\d+d\d+|\+|\-|\d+)/gi;
  const tokens = h.dado.match(regex);

  if(!tokens){
    document.getElementById(resId).innerText = "Formato inválido";
    limparDepois(resId);
    return;
  }

  let total = 0;
  let detalhes = [];
  let operador = "+";

  tokens.forEach(tok=>{
    tok = tok.trim();
    if(tok === "+" || tok === "-"){
      operador = tok;
    }
    else if(tok.toLowerCase().includes("d")){

      let qtd, faces, explosao = null;

      const dado = tok.toLowerCase();

      if(dado.includes("!")){

        const partes = dado.split("!");
        const base = partes[0];
        const crit = partes[1];

        [qtd, faces] = base.split("d").map(Number);

        explosao = crit ? Number(crit) : faces;

        if(qtd > 100 || faces > 1000){
          document.getElementById(resId).innerText = "Dado muito grande!";
          return;
        }

      }else{

        [qtd, faces] = dado.split("d").map(Number);

      }

      for(let j=0; j<qtd; j++){

        let r = Math.floor(Math.random()*faces)+1;

        detalhes.push(r);

        total = operador === "+" ? total+r : total-r;

        if(explosao){

          let limiteExplosao = 100;
          let cont = 0;
          
          while(r >= explosao && cont < limiteExplosao){
            
            cont++;
            r = Math.floor(Math.random()*faces)+1;

            detalhes.push("💥"+r);

            total = operador === "+" ? total+r : total-r;
            
          }

        }

      }

    } else {
      const n = Number(tok);
      total = operador === "+" ? total+n : total-n;
      detalhes.push(tok);
    }
  });

  mostrarPopup(
    h.nome || "Habilidade",
    h.dado + " → [" + detalhes.join(" + ") + "]",
    total
  );

  registrarLog(h.nome || "Habilidade", h.dado + " → [" + detalhes.join(" + ") + "]", total);

  document.getElementById(resId).innerText = 
    `${h.dado} → [${detalhes.join(" + ")}] = ${total}`;

  limparDepois(resId);
}

/* =============== SALVAR =============== */

function carregarImagem(event){
  const file = event.target.files[0];
  if(!file) return;

  if(file.size > 1024 * 1024){
    alert("Imagem muito grande! Use uma imagem menor que 1MB.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e){
    const img = document.getElementById("previewImg");
    img.src = e.target.result;
    img.style.display = "block";
    img.dataset.base64 = e.target.result;
  };
  reader.readAsDataURL(file);
}
  
function salvarFicha(){
  const slot=document.getElementById("slot").value;
  const chave="fichaRPG_"+slot;

  const dados={
    imagem: document.getElementById("previewImg").dataset.base64 || "",
    nome:document.getElementById("nome").value,
    idade:document.getElementById("idade").value,
    antecedencia:document.getElementById("antecedencia").value,
    descricao:document.getElementById("descricao").value,
    historia:document.getElementById("historia").value,
    nivel:document.getElementById("nivel").value,
    vida:document.getElementById("vida").value,
    sanidade:document.getElementById("sanidade").value,
    aura:document.getElementById("aura").value,
    habilidades:habilidades,
    atributos:{},
    pericias:{},
    rdFisica: document.getElementById("rdFisica").value,
    rdMental: document.getElementById("rdMental").value,
    dtBonus: document.getElementById("dtBonus").value,
  };

  atributos.forEach(a=>{
    dados.atributos[a.sigla]=document.getElementById("atr_"+a.sigla).value;
  });

  pericias.forEach((p,i)=>{
    dados.pericias["per_"+i] = {
      valor: document.getElementById("per_"+i).value,
      bonus: document.getElementById("bonus_per_"+i).value,
      atributo: document.getElementById("atrKey_per_"+i).value
  };
});

  localStorage.setItem(chave,JSON.stringify(dados));

  const alerta=document.getElementById("alerta");
  alerta.style.display="block";
  setTimeout(()=>alerta.style.display="none",2500);
}

function salvarFichaManual(chave){

  const dados={
    imagem: document.getElementById("previewImg").dataset.base64 || "",
    nome:document.getElementById("nome").value,
    idade:document.getElementById("idade").value,
    antecedencia:document.getElementById("antecedencia").value,
    descricao:document.getElementById("descricao").value,
    historia:document.getElementById("historia").value,
    nivel:document.getElementById("nivel").value,
    vida:document.getElementById("vida").value,
    sanidade:document.getElementById("sanidade").value,
    aura:document.getElementById("aura").value,
    habilidades:habilidades,
    atributos:{},
    pericias:{},
    rdFisica: document.getElementById("rdFisica").value,
    rdMental: document.getElementById("rdMental").value,
  };

  atributos.forEach(a=>{
    dados.atributos[a.sigla]=document.getElementById("atr_"+a.sigla).value;
  });

  pericias.forEach((p,i)=>{
    dados.pericias["per_"+i]=document.getElementById("per_"+i).value;
  });

  localStorage.setItem(chave,JSON.stringify(dados));
}
  
function limparFicha(){
  document.querySelectorAll("input, textarea").forEach(el=>{
    if(el.type !== "file"){
      el.value = "";
    }
  });

  document.getElementById("rdFisica").value = 0;
  document.getElementById("rdMental").value = 0;
  
  document.getElementById("nivel").value = 1;

  atributos.forEach(a=>{
    const el = document.getElementById("atr_"+a.sigla);
    if(el) el.value = 0;
  });

  pericias.forEach((p,i)=>{
    const el = document.getElementById("per_"+i);
    if(el) el.value = 1;
  });

  habilidades = [];
  renderHabilidades();

  const img = document.getElementById("previewImg");
  img.style.display="none";
  img.dataset.base64="";
  img.src="";

  recalcularVidaSanidade();
  atualizarBloqueio();
  atualizarDT();
}
  
/* =============== CARREGAR =============== */
function carregarFicha(){
  const slot=document.getElementById("slot").value;
  const chave="fichaRPG_"+slot;
  const salvo=localStorage.getItem(chave);

  if(!salvo){
    limparFicha();
    return;
  }

  const d=JSON.parse(salvo);

  document.getElementById("nome").value=d.nome||"";
  document.getElementById("idade").value=d.idade||"";
  document.getElementById("antecedencia").value=d.antecedencia||"";
  document.getElementById("descricao").value=d.descricao||"";
  document.getElementById("historia").value=d.historia||"";
  document.getElementById("nivel").value=d.nivel||1;
  document.getElementById("vida").value = d.vida || 0;
  document.getElementById("sanidade").value = d.sanidade || 0;
  document.getElementById("aura").value = d.aura || 0;
  document.getElementById("rdFisica").value = d.rdFisica || 0;
  document.getElementById("rdMental").value = d.rdMental || 0;
  document.getElementById("dtBonus").value = d.dtBonus || 0;
  
  const img = document.getElementById("previewImg");
  if(d.imagem){
    img.src = d.imagem;
    img.style.display = "block";
    img.dataset.base64 = d.imagem;
  }else{
    img.style.display = "none";
    img.dataset.base64 = "";
  }

  for(const s in d.atributos){
    const el=document.getElementById("atr_"+s);
    if(el) el.value=d.atributos[s];
  }

  for(const p in d.pericias){
    const data = d.pericias[p];

    if(typeof data === "object"){
      document.getElementById(p).value = data.valor || 1;
      document.getElementById("bonus_"+p).value = data.bonus || 0;
      document.getElementById("atrKey_"+p).value = data.atributo || "FOR";
    } else {
      document.getElementById(p).value = data;
    }
  }
  habilidades=d.habilidades||[];
  console.log("Conteúdo de habilidades antes de renderizar:", habilidades);
  renderHabilidades();

  atualizarDT();

  recalcularVidaSanidade();
  atualizarBloqueio();
}

document.addEventListener("DOMContentLoaded", () => {

  let slotAtual = document.getElementById("slot").value;

  document.getElementById("slot").addEventListener("change", function(){

    const chaveAntiga = "fichaRPG_" + slotAtual;
    salvarFichaManual(chaveAntiga);

    slotAtual = this.value;

    carregarFicha();
  });

  criarPericias();
  carregarFicha();

});

  const rolagensRef = database.ref('rolagens');
  rolagensRef.on('child_added', (snapshot) => {
    const novaRolagem = snapshot.val();
    logRolagens.push(novaRolagem);
    if(logRolagens.length > 20) {
      logRolagens.shift();
    }
    atualizarLog();
  });

/* =============== INICIALIZAÇÃO =============== */
criarPericias();
carregarFicha();
