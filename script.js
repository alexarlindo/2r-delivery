const overlay = document.getElementById("overlay");
const signatureModal = document.getElementById("signatureModal");
const signatureViewer = document.getElementById("signatureViewer");
const signaturePreviewImage = document.getElementById("signaturePreviewImage");
const signaturePreviewContainer = signatureViewer.querySelector(".signature-preview");
const orientationButton = document.getElementById("orientationButton");
const verificationModal = document.getElementById("verificationModal");
const deliveryCodeInput = document.getElementById("deliveryCode");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let currentButton = null;
let hasSignature = false;
let drawing = false;
let newOrderPhotoDataUrl = null;

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for(let i=0; i<5; i++){
    code += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i < 4) code += '-';
  }
  return code;
}

function getUniqueCode() {
  let isUnique = false;
  let code = '';
  const activeCodes = Array.from(document.querySelectorAll('#cards .card:not(.done)')).map(card => card.dataset.code);
  
  while(!isUnique) {
    code = generateCode();
    if (!activeCodes.includes(code)) {
      isUnique = true;
    }
  }
  return code;
}

function openModal(){
  overlay.style.display = "flex";
}

overlay.addEventListener("click",(event)=>{
  if(event.target === overlay){
    overlay.style.display = "none";
  }
});

signatureModal.addEventListener("click",(event)=>{
  if(event.target === signatureModal){
    closeSignature();
  }
});

signatureViewer.addEventListener("click",(event)=>{
  if(event.target === signatureViewer){
    closeSignaturePreview();
  }
});

function previewNewOrderPhoto(event){
  const file = event.target.files[0];
  if(file){
    const imageUrl = URL.createObjectURL(file);
    newOrderPhotoDataUrl = imageUrl;
    const preview = document.getElementById('newOrderPhotoPreview');
    preview.src = imageUrl;
    preview.style.display = 'block';
  }
}

function addOrder(){
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();

  if(!name || !phone || !address){
    alert("Preencha todos os campos.");
    return;
  }

  const id = Math.floor(Math.random()*9000)+1000;
  const orderCode = getUniqueCode();
  const order = {
    name:escapeHTML(name),
    phone:escapeHTML(phone),
    address:escapeHTML(address)
  };
  const card = document.createElement("article");

  card.className = "card";
  card.draggable = true;
  card.dataset.code = orderCode;
  if(newOrderPhotoDataUrl) {
    card.dataset.photoUrl = newOrderPhotoDataUrl;
  }
  
  card.innerHTML = `
    <div class="top">
      <div class="client">
        <h2>${order.name}</h2>
        <span style="font-size: 10px; color: #666;">(Cód: ${orderCode})</span>
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

    ${newOrderPhotoDataUrl ? `
    <div class="package-photo-preview" style="margin-bottom: 12px; position: relative;">
      <img src="${newOrderPhotoDataUrl}" class="captured-photo-img" style="width: 100%; height: 160px; object-fit: cover; border-radius: 12px; border: 1px solid #2a2a2a;" />
      <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: #fff; padding: 4px 8px; border-radius: 8px; font-size: 11px; backdrop-filter: blur(4px);">
        <i class="ti ti-check"></i> Foto Registada
      </div>
    </div>` : ''}

    <div class="actions">
      <button class="btn call" onclick="window.location.href='tel:${order.phone}'">
        <i class="ti ti-phone"></i> Ligar
      </button>
      <button class="btn done-btn" onclick="openVerification(this)">
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
  document.getElementById("newOrderPhoto").value = "";
  document.getElementById("newOrderPhotoPreview").src = "";
  document.getElementById("newOrderPhotoPreview").style.display = "none";
  newOrderPhotoDataUrl = null;
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

function openVerification(btn){
  currentButton = btn;
  verificationModal.style.display = "flex";
  deliveryCodeInput.value = "";
}

function closeVerification(){
  verificationModal.style.display = "none";
  currentButton = null;
}

if(deliveryCodeInput){
  deliveryCodeInput.addEventListener("input", function(e) {
    let val = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    let formatted = '';
    for (let i = 0; i < val.length; i++) {
      formatted += val[i];
      if (i < 4 && i < val.length - 1) formatted += '-';
    }
    e.target.value = formatted;
  });
}

function verifyDelivery(){
  if(!currentButton) return;
  const card = currentButton.closest(".card");
  const expectedCode = card.dataset.code;
  const enteredCode = deliveryCodeInput.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const rawExpected = expectedCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  if(enteredCode !== rawExpected){
    alert("Código de entrega inválido! Verifique e tente novamente.");
    return;
  }

  verificationModal.style.display = "none";
  openSignature(currentButton);
}

function openSignature(btn){
  currentButton = btn;
  signatureModal.style.display = "flex";
  signatureModal.classList.add("landscape");

  requestAnimationFrame(()=>{
    resizeCanvas();
    clearCanvas();
  });
}

function closeSignature(){
  signatureModal.style.display = "none";
  signatureModal.classList.remove("landscape");
  currentButton = null;
  clearCanvas();
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

  renderSignature(card, createReceiptSignatureImage(), "landscape");
  
  signatureModal.style.display = "none";
  signatureModal.classList.remove("landscape");
  clearCanvas();
  updateStats();
  refreshLists();
  showView("completed", document.querySelector('[data-view="completed"]'));
}

function renderSignature(card, imageUrl, orientation = "landscape"){
  const signature = card.querySelector(".signature");
  const deliveredAt = new Date().toLocaleString("pt-MZ", {
    day:"2-digit",
    month:"2-digit",
    year:"numeric",
    hour:"2-digit",
    minute:"2-digit"
  });

  signature.dataset.image = imageUrl;
  signature.dataset.orientation = orientation;
  signature.innerHTML = `
    <button class="signature-button" type="button" onclick="openSignaturePreview(this)">
      <div class="signature-title">
        <i class="ti ti-writing-sign"></i>
        <span>Ver assinatura</span>
      </div>
      <span class="signature-time">${deliveredAt}</span>
    </button>

    <button class="signature-thumb landscape" type="button" onclick="openSignaturePreview(this)">
      <div class="signature-preview thumb landscape">
        <img src="${imageUrl}" alt="Miniatura da assinatura do cliente">
      </div>
    </button>
  `;

  signature.style.display = "flex";
}

function openSignaturePreview(button){
  const signature = button.closest(".signature");

  signaturePreviewImage.src = signature.dataset.image;
  signatureViewer.classList.add("landscape");
  signaturePreviewContainer.classList.add("landscape");
  signatureViewer.style.display = "flex";
}

function closeSignaturePreview(){
  signatureViewer.style.display = "none";
  signaturePreviewImage.src = "";
  signatureViewer.classList.remove("landscape");
  signaturePreviewContainer.classList.remove("landscape");
}

function createReceiptSignatureImage(){
  const receiptCanvas = document.createElement("canvas");
  const receiptCtx = receiptCanvas.getContext("2d");
  
  receiptCanvas.width = canvas.width;
  receiptCanvas.height = canvas.height;
  
  receiptCtx.fillStyle = "#fff";
  receiptCtx.fillRect(0, 0, canvas.width, canvas.height);
  receiptCtx.drawImage(canvas, 0, 0);

  return receiptCanvas.toDataURL("image/png");
}

function resizeCanvas(snapshot = null){
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;

  canvas.width = rect.width * scale;
  canvas.height = rect.height * scale;
  ctx.setTransform(scale,0,0,scale,0,0);

  if(snapshot){
    const image = new Image();
    image.onload = ()=>{
      ctx.drawImage(image,0,0,rect.width,rect.height);
      hasSignature = true;
    };
    image.src = snapshot;
  }else{
    clearCanvas();
  }
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
    const keepSignature = hasSignature ? canvas.toDataURL("image/png") : null;
    resizeCanvas(keepSignature);
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
