// ===============================
// Restricción por # de acompañantes
// ===============================
const urlParams = new URLSearchParams(window.location.search);
const maxGuestsParam = urlParams.get("max");
const maxGuests = maxGuestsParam !== null ? parseInt(maxGuestsParam) : null;
const hasValidInvite = Number.isInteger(maxGuests) && maxGuests >= 0;
const canHaveGuests = maxGuests > 0;

const rsvpSection = document.getElementById("rsvp");

// ===============================
// Si el enlace NO es válido → ocultar formulario
// ===============================
if (!hasValidInvite && rsvpSection) {
  rsvpSection.innerHTML = `
    <div class="container" style="text-align:center;padding:40px 0">
      <h2>Invitación no válida</h2>
      <p>Usa el enlace personalizado enviado para confirmar asistencia.</p>
    </div>
  `;
}

// ===============================
// Captura de acompañantes (solo si hay formulario)
// ===============================
const guestFields = document.getElementById("guest-fields");
const addGuestBtn = document.getElementById("addGuestBtn");
const guestsWrapper = document.getElementById("guests-wrapper");
const attendanceSelect = document.querySelector("select[name='attendance']");

let guestCount = 0;

// Solo ejecuta lógica del formulario si el enlace es válido
if (hasValidInvite) {

// ===============================
attendanceSelect?.addEventListener("change", () => {
  const attends = attendanceSelect.value === "Sí";

  // ======================
  // ACOMPAÑANTES
  // ======================
  if (attends && canHaveGuests) {
    guestsWrapper.style.display = "flex";
  } else {
    guestsWrapper.style.display = "none";
    guestFields.innerHTML = "";
    guestCount = 0;
  }

  // ======================
  // RESTRICCIÓN ALIMENTICIA
  // ======================
  const dietaryBlock = document.getElementById("dietary-block");

  if (attends) {
    dietaryBlock.style.display = "block";
  } else {
    dietaryBlock.style.display = "none";
    dietarySelect.value = "";
    dietaryWrapper.style.display = "none";
    dietaryWrapper.querySelector("input")?.removeAttribute("required");
  }
});



  // Agregar acompañantes
  addGuestBtn?.addEventListener("click", () => {
    if (guestCount >= maxGuests) {
      alert(`Solo puedes agregar hasta ${maxGuests} acompañantes`);
      return;
    }

    guestCount++;

    const div = document.createElement("div");
    div.className = "guest-input";
    div.innerHTML = `
      <input name="guest_${guestCount}" required placeholder="Nombre y Apellido del acompañante ${guestCount}" />
      <button type="button" class="removeGuestBtn">✕</button>
    `;
    guestFields.appendChild(div);

    // Eliminar acompañante
    div.querySelector(".removeGuestBtn").addEventListener("click", () => {
      div.remove();
      guestCount--;
    });
  });
}

// ===============================
// Restricciones alimenticias
// ===============================
const dietarySelect = document.getElementById("dietary-select");
const dietaryWrapper = document.getElementById("dietary-details-wrapper");

dietarySelect?.addEventListener("change", () => {
  if (dietarySelect.value === "Sí") {
    dietaryWrapper.style.display = "block";
    dietaryWrapper.querySelector("input")?.setAttribute("required", "true");
  } else {
    dietaryWrapper.style.display = "none";
    dietaryWrapper.querySelector("input")?.removeAttribute("required");
  }
});

// ===============================
// Animaciones con IntersectionObserver
// ===============================
const io = new IntersectionObserver((entries)=>{
  entries.forEach(el=>{
    if(el.isIntersecting){
      el.target.classList.add('revealed');
      io.unobserve(el.target);
    }
  });
},{threshold:.12});

document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right')
  .forEach(el=>io.observe(el));

// ===============================
// CONFIG
// ===============================
const CONFIG = {
  CLOUDINARY_CLOUD_NAME: 'drssjjayn',
  CLOUDINARY_UPLOAD_PRESET: 'netlify_upload',
  API_RSVP: '/.netlify/functions/rsvp'
};

// ===============================
// Countdown
// ===============================
(function initCountdown(){
  const target = new Date('2026-03-22T16:00:00'); 
  const elDays = document.getElementById('cd-days');
  const elHours = document.getElementById('cd-hours');
  const elMins = document.getElementById('cd-mins');
  const elSecs = document.getElementById('cd-secs');

  function tick(){
    const now = new Date();
    let diff = Math.max(0, target - now);
    const days = Math.floor(diff / (1000*60*60*24));
    diff -= days * (1000*60*60*24);
    const hours = Math.floor(diff / (1000*60*60));
    diff -= hours * (1000*60*60);
    const mins = Math.floor(diff / (1000*60));
    diff -= mins * (1000*60);
    const secs = Math.floor(diff / 1000);

    elDays.textContent = String(days);
    elHours.textContent = String(hours).padStart(2,'0');
    elMins.textContent = String(mins).padStart(2,'0');
    elSecs.textContent = String(secs).padStart(2,'0');
  }
  tick();
  setInterval(tick, 1000);
})();

// ===============================
// Galería
// ===============================
document.querySelectorAll('a[href="#galeria"]').forEach(el=>{
  el.setAttribute('href', '/galeria.html');
});

// ===============================
// Uploader Cloudinary
// ===============================
const input = document.getElementById('photoInput');
const preview = document.getElementById('preview');
const uploadBtn = document.getElementById('uploadBtn');
const statusEl = document.getElementById('uploadStatus');

input?.addEventListener('change', ()=>{
  preview.innerHTML='';
  [...input.files].forEach(file=>{
    const url = URL.createObjectURL(file);
    const img = new Image(); 
    img.src=url; 
    preview.appendChild(img);
  });
});

uploadBtn?.addEventListener('click', async ()=>{
  if(!input.files?.length){ 
    statusEl.textContent = 'Selecciona al menos una foto.'; 
    return; 
  }

  statusEl.textContent = 'Subiendo a Cloudinary…';
  try{
    for(const file of input.files){
      const form = new FormData();
      form.append('file', file);
      form.append('upload_preset', CONFIG.CLOUDINARY_UPLOAD_PRESET);

      const url = `https://api.cloudinary.com/v1_1/${CONFIG.CLOUDINARY_CLOUD_NAME}/upload`;
      const res = await fetch(url, { method: 'POST', body: form });
      if(!res.ok) throw new Error(`Cloudinary error ${res.status}`);
      await res.json();
    }
    statusEl.textContent = '¡Listo! Fotos subidas.';
    input.value = ''; 
    preview.innerHTML='';
  }catch(err){
    console.error(err);
    statusEl.textContent = 'Error subiendo fotos. Intenta de nuevo.';
  }
});

// ===============================
// RSVP — envía al backend
// ===============================
const rsvpForm = document.getElementById('rsvpForm');
const rsvpStatus = document.getElementById('rsvpStatus');

const phoneCountry = document.getElementById('phone-country');
const phoneNumber = document.getElementById('phone-number');
const phoneError = document.getElementById('phone-error');

function validatePhone(country, number) {
  const clean = number.replace(/\D/g,''); 
  if(country === '+57') return clean.length === 10;
  if(country === '+1') return clean.length === 10;
  return false;
}

phoneNumber?.addEventListener('input', ()=>{
  if(phoneNumber.value.length > 10){
    phoneNumber.value = phoneNumber.value.slice(0,10);
  }
  const isValid = validatePhone(phoneCountry.value, phoneNumber.value);
  phoneError.style.display = isValid ? 'none' : 'inline';
});

phoneCountry?.addEventListener('change', ()=>{
  const isValid = validatePhone(phoneCountry.value, phoneNumber.value);
  phoneError.style.display = isValid ? 'none' : 'inline';
});

rsvpForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Si no es invitación válida no se envía
  if (!hasValidInvite) {
    rsvpStatus.textContent = 'Este enlace no permite confirmar asistencia.';
    return;
  }

  const country = phoneCountry.value;
  const number = phoneNumber.value.replace(/\D/g,'');
  if(!validatePhone(country, number)){
    phoneError.style.display = 'inline';
    phoneNumber.focus();
    return;
  }

  rsvpStatus.textContent = 'Enviando…';

  const formData = Object.fromEntries(new FormData(rsvpForm).entries());
  formData.phone = `${country}${number}`;

  try {
    const res = await fetch(CONFIG.API_RSVP, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(formData)
    });

    if(!res.ok) throw new Error(await res.text() || 'Error servidor');

    rsvpForm.reset();
    phoneError.style.display = 'none';
    rsvpStatus.textContent = '¡Recibido! Te llegará una confirmación por WhatsApp.';

    guestFields.innerHTML = '';
    guestsWrapper.style.display = 'none';

    dietaryWrapper.style.display = 'none';

  } catch(err) {
    console.error(err);
    rsvpStatus.textContent = 'Error enviando Confirmación. Intenta de nuevo.';
  }
});

// ===============================
// Música
// ===============================
const musicBtn = document.getElementById('music-btn');
const musicIcon = document.getElementById('music-icon');
const bgMusic = document.getElementById('bg-music');

musicBtn?.addEventListener('click', () => {
  if (!bgMusic) return;

  if (bgMusic.paused) {
    bgMusic.currentTime = 11;
    bgMusic.play();
    musicIcon.src = "icons/pausa.png";
  } else {
    bgMusic.pause();
    musicIcon.src = "icons/play.png";
  }
});

const nav = document.querySelector('.nav nav');
const hamburger = document.querySelector('.hamburger');

// Abrir/cerrar menú en móvil
hamburger?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('active'); // activa/desactiva clase
  hamburger.setAttribute('aria-expanded', String(isOpen));
});

// Cerrar menú automáticamente al pulsar un link en móvil
document.querySelectorAll('.nav nav a').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 768) { // solo en móvil
      nav.classList.remove('active');
      hamburger.setAttribute('aria-expanded', "false");
    }
  });
});

// Asegurar que el menú esté visible en desktop si se cambia de tamaño
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    nav.classList.remove('active'); // siempre visible en desktop
    hamburger.setAttribute('aria-expanded', "false");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const arrow = document.getElementById("mobile-arrow");

  if (arrow) {
    // Ocultar después de 6 segundos
    setTimeout(() => {
      arrow.style.opacity = "0";
    }, 6000);

    // Click → scroll a la sección contador
    arrow.addEventListener("click", () => {
      document.getElementById("contador")?.scrollIntoView({ behavior: "smooth" });
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const track = document.querySelector(".carousel-track");
  let items = document.querySelectorAll(".carousel-item");

  let position = 0;
  let direction = -1;
  let speed = 1;
  let isSwiping = false;

  // ===========================
  // FUNCIÓN QUE RECICLA ITEMS
  // ===========================
  function normalizePosition() {
    const itemWidth = items[0].offsetWidth + 10;

    // mover hacia la izquierda (position muy negativo)
    while (Math.abs(position) >= itemWidth) {
      track.appendChild(track.firstElementChild);
      position += itemWidth;
      items = document.querySelectorAll(".carousel-item");
    }

    // mover hacia la derecha (position muy positivo)
    while (position > 0) {
      track.prepend(track.lastElementChild);
      position -= itemWidth;
      items = document.querySelectorAll(".carousel-item");
    }

    track.style.transform = `translateX(${position}px)`;
  }

  // ===========================
  // AUTOPLAY
  // ===========================
  function animate() {
    if (!isSwiping) {
      position += direction * speed;
      normalizePosition();
    }
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  // ===========================
  // SWIPE + INERCIA EN MÓVIL
  // ===========================
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    let lastTouchX = 0;
    let lastMoveTime = 0;
    let velocity = 0;

    track.addEventListener("touchstart", (e) => {
      isSwiping = true;
      track.style.transition = "none";

      lastTouchX = e.touches[0].clientX;
      lastMoveTime = Date.now();
      velocity = 0;
    });

    track.addEventListener("touchmove", (e) => {
      const currentX = e.touches[0].clientX;
      const deltaX = currentX - lastTouchX;

      position += deltaX;
      normalizePosition();

      const now = Date.now();
      const dt = now - lastMoveTime;

      if (dt > 0) velocity = deltaX / dt;

      lastTouchX = currentX;
      lastMoveTime = now;
    });

    track.addEventListener("touchend", () => {
      isSwiping = false;

      // ===========================
      // INERCIA CON RECICLAJE
      // ===========================
      const friction = 0.95;

      function inertia() {
        if (Math.abs(velocity) < 0.01) return;

        position += velocity * 40;
        normalizePosition();

        velocity *= friction;
        requestAnimationFrame(inertia);
      }

      inertia();
    });
  }
});