const overlay = document.getElementById("overlay");
const signatureModal = document.getElementById("signatureModal");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let currentButton = null;
let hasSignature = false;
let drawing = false;

function openModal(){
  overlay.style.display = "flex";
}

overlay.addEventListener("click",(event)=>{
  if(event.target === overlay){
    overlay.style.display = "none";
  }
});

function addOrder(){
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();

  if(!name || !phone || !address){
    alert("Preencha todos os campos.");
    return;
  }

  const id = Math.floor(Math.random()*9000)+1000;
  const order = {
    name:escapeHTML(name),
    phone:escapeHTML(phone),
    address:escapeHTML(address)
  };
  const card = document.createElement("article");

  card.className = "card";
  card.draggable = true;
  card.innerHTML = `
    <div class="top">
      <div class="client">
        <h2>${order.name}</h2>
        <span>#PED-${id}</span>
      </div>

      <div class="badge pending">Pendente</div>
    </div>

    <div class="info">
      <div class="row">
        <i class="ti ti-phone"></i>
        ${order.phone}
      </div>

      <div class="row">
        <i class="ti ti-map-pin"></i>
        ${order.address}
      </div>
    </div>

    <div class="actions">
      <button class="btn call" onclick="window.location.href='tel:${order.phone}'">
        Ligar
      </button>

      <button class="btn done-btn" onclick="openSignature(this)">
        Entregue
      </button>
    </div>

    <div class="signature">
      <i class="ti ti-writing"></i>
      <span>Assinatura recolhida</span>
    </div>
  `;

  document.getElementById("cards").prepend(card);
  addDnD(card);
  resetOrderForm();
  updateStats();
  refreshLists();
  openDeliveriesView();
}

function escapeHTML(value){
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

function resetOrderForm(){
  document.getElementById("name").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("address").value = "";
  overlay.style.display = "none";
}

function showView(view, item){
  document
    .querySelectorAll(".nav-item")
    .forEach(navItem => navItem.classList.remove("active"));

  item.classList.add("active");

  document
    .querySelectorAll(".view")
    .forEach(viewElement => viewElement.classList.remove("active"));

  document
    .getElementById(`${view}View`)
    .classList.add("active");

  refreshLists();
}

function refreshLists(){
  const deliveryCards = document.getElementById("cards");
  const completedCards = document.getElementById("completedCards");

  document
    .querySelectorAll(".card")
    .forEach(card => {
      if(card.classList.contains("done")){
        completedCards.appendChild(card);
      }else{
        deliveryCards.appendChild(card);
      }
    });

  document.getElementById("emptyDeliveries").style.display =
    deliveryCards.children.length ? "none" : "block";

  document.getElementById("emptyCompleted").style.display =
    completedCards.children.length ? "none" : "block";
}

function openDeliveriesView(){
  const deliveriesButton = document.querySelector('[data-view="deliveries"]');
  showView("deliveries", deliveriesButton);
}

function openSignature(btn){
  currentButton = btn;
  signatureModal.style.display = "flex";

  requestAnimationFrame(()=>{
    resizeCanvas();
    clearCanvas();
  });
}

function saveSignature(){
  if(!hasSignature){
    alert("Peça a assinatura do cliente antes de confirmar.");
    return;
  }

  const card = currentButton.closest(".card");
  const badge = card.querySelector(".badge");

  card.classList.add("done");
  card.draggable = false;
  badge.innerHTML = "Concluído";
  badge.classList.remove("pending");
  badge.classList.add("finished");
  currentButton.innerHTML = "Finalizado";
  currentButton.disabled = true;

  renderSignature(card, canvas.toDataURL("image/png"));
  signatureModal.style.display = "none";
  clearCanvas();
  updateStats();
  refreshLists();
  showView("completed", document.querySelector('[data-view="completed"]'));
}

function renderSignature(card, imageUrl){
  const signature = card.querySelector(".signature");
  const deliveredAt = new Date().toLocaleString("pt-MZ", {
    day:"2-digit",
    month:"2-digit",
    year:"numeric",
    hour:"2-digit",
    minute:"2-digit"
  });

  signature.innerHTML = `
    <div class="signature-head">
      <div class="signature-title">
        <i class="ti ti-writing-sign"></i>
        <span>Comprovativo assinado</span>
      </div>
      <span class="signature-time">${deliveredAt}</span>
    </div>

    <div class="signature-preview">
      <img src="${imageUrl}" alt="Assinatura do cliente">
      <div class="signature-line"></div>
      <div class="signature-caption">Assinatura do cliente</div>
    </div>
  `;

  signature.style.display = "flex";
}

function resizeCanvas(){
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;

  canvas.width = rect.width * scale;
  canvas.height = rect.height * scale;
  ctx.setTransform(scale,0,0,scale,0,0);
}

function clearCanvas(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  hasSignature = false;
}

function start(event){
  drawing = true;
  draw(event);
}

function end(){
  drawing = false;
  ctx.beginPath();
}

function draw(event){
  if(!drawing) return;

  event.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const pointer = event.touches ? event.touches[0] : event;
  const x = pointer.clientX - rect.left;
  const y = pointer.clientY - rect.top;

  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";
  ctx.lineTo(x,y);
  ctx.stroke();
  hasSignature = true;
  ctx.beginPath();
  ctx.moveTo(x,y);
}

canvas.addEventListener("mousedown",start);
canvas.addEventListener("mouseup",end);
canvas.addEventListener("mouseleave",end);
canvas.addEventListener("mousemove",draw);
canvas.addEventListener("touchstart",start);
canvas.addEventListener("touchend",end);
canvas.addEventListener("touchmove",draw);

window.addEventListener("resize",()=>{
  if(signatureModal.style.display === "flex"){
    resizeCanvas();
    clearCanvas();
  }
});

function updateStats(){
  const pending = document.querySelectorAll(".card:not(.done)").length;
  const done = document.querySelectorAll(".card.done").length;
  const total = document.querySelectorAll(".card").length;

  document.getElementById("pendingCount").innerHTML = pending;
  document.getElementById("doneCount").innerHTML = done;
  document.getElementById("homeDone").innerHTML = done;
  document.getElementById("homePending").innerHTML = pending;
  document.getElementById("profileDone").innerHTML = done;
  document.getElementById("profilePending").innerHTML = pending;
  document.getElementById("profileTotal").innerHTML = total;
}

let dragged = null;

function addDnD(card){
  card.addEventListener("dragstart",()=>{
    dragged = card;

    setTimeout(()=>{
      card.style.opacity = ".4";
    },0);
  });

  card.addEventListener("dragend",()=>{
    card.style.opacity = "1";
  });

  card.addEventListener("dragover",(event)=>{
    event.preventDefault();

    const container = document.getElementById("cards");
    const after = getDragAfterElement(container,event.clientY);

    if(after == null){
      container.appendChild(dragged);
    }else{
      container.insertBefore(dragged,after);
    }
  });
}

function getDragAfterElement(container,y){
  const els = [...container.querySelectorAll(".card:not(.dragging)")];

  return els.reduce((closest,child)=>{
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height/2;

    if(offset < 0 && offset > closest.offset){
      return {
        offset:offset,
        element:child
      };
    }

    return closest;
  },{offset:Number.NEGATIVE_INFINITY}).element;
}

document.querySelectorAll(".card").forEach(addDnD);
updateStats();
refreshLists();
