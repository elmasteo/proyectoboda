// Menú móvil simple
document.querySelector('.hamburger')?.addEventListener('click', (e)=>{
  const nav = document.querySelector('.nav nav');
  const btn = e.currentTarget;
  const isOpen = nav.style.display === 'flex';
  nav.style.display = isOpen ? 'none' : 'flex';
  btn.setAttribute('aria-expanded', String(!isOpen));
});

// Animaciones con IntersectionObserver
const io = new IntersectionObserver((entries)=>{
  entries.forEach(el=>{
    if(el.isIntersecting){
      el.target.classList.add('revealed');
      io.unobserve(el.target);
    }
  });
},{threshold:.12});
document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el=>io.observe(el));

// CONFIG
const CONFIG = {
  CLOUDINARY_CLOUD_NAME: 'drssjjayn',
  CLOUDINARY_UPLOAD_PRESET: 'netlify_upload',
  API_RSVP: '/.netlify/functions/rsvp'
};

// Countdown estilizado
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

// **********************
// Redirigir botón Galería
// **********************
document.querySelectorAll('a[href="#galeria"]').forEach(el=>{
  el.setAttribute('href', '/galeria.html');
});

// **********************
// Uploader — Cloudinary
// **********************
const input = document.getElementById('photoInput');
const preview = document.getElementById('preview');
const uploadBtn = document.getElementById('uploadBtn');
const statusEl = document.getElementById('uploadStatus');

input?.addEventListener('change', ()=>{
  preview.innerHTML='';
  [...input.files].forEach(file=>{
    const url = URL.createObjectURL(file);
    const img = new Image(); img.src=url; preview.appendChild(img);
  });
});

uploadBtn?.addEventListener('click', async ()=>{
  if(!input.files?.length){ statusEl.textContent = 'Selecciona al menos una foto.'; return; }

  statusEl.textContent = 'Subiendo a Cloudinary…';
  try{
    for(const file of input.files){
      const form = new FormData();
      form.append('file', file);
      form.append('upload_preset', CONFIG.CLOUDINARY_UPLOAD_PRESET);

      const url = `https://api.cloudinary.com/v1_1/${CONFIG.CLOUDINARY_CLOUD_NAME}/upload`;
      const res = await fetch(url, { method: 'POST', body: form });
      if(!res.ok) throw new Error(`Cloudinary error ${res.status}`);
      const json = await res.json();
      const secure = json.secure_url || json.url;
      if(!secure) throw new Error('No secure_url returned');
    }
    statusEl.textContent = '¡Listo! Fotos subidas.';
    input.value = ''; preview.innerHTML='';
  }catch(err){
    console.error(err);
    statusEl.textContent = 'Error subiendo fotos. Intenta de nuevo.';
  }
});

// **********************
// RSVP — envía al backend
// **********************
const rsvpForm = document.getElementById('rsvpForm');
const rsvpStatus = document.getElementById('rsvpStatus');

const phoneCountry = document.getElementById('phone-country');
const phoneNumber = document.getElementById('phone-number');
const phoneError = document.getElementById('phone-error');

// Validación teléfono
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

rsvpForm?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  
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
  
  try{
    const res = await fetch(CONFIG.API_RSVP, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(formData)
    });
    if(!res.ok) throw new Error(await res.text() || 'Error servidor');
    const body = await res.json();
    if(!body.ok) throw new Error(body.message || 'No OK');
    rsvpForm.reset();
    phoneError.style.display = 'none';
    rsvpStatus.textContent = '¡Recibido! Te llegará una confirmación por WhatsApp.';
  }catch(err){
    console.error(err);
    rsvpStatus.textContent = 'Error enviando Confirmación. Intenta de nuevo.';
  }
});

// Música
const musicBtn = document.getElementById('music-btn');
const musicIcon = document.getElementById('music-icon');
const bgMusic = document.getElementById('bg-music');

musicBtn.addEventListener('click', () => {
  if (bgMusic.paused) {
    bgMusic.play();
    musicIcon.src = "icons/pausa.png";   // cambia a pause
    musicIcon.alt = "Pause";
    musicBtn.setAttribute("aria-label", "Pausar música");
  } else {
    bgMusic.pause();
    musicIcon.src = "icons/play.png";    // cambia a play
    musicIcon.alt = "Play";
    musicBtn.setAttribute("aria-label", "Reproducir música");
  }
});


//Mostra QR pagos
function showQR(src) {
  const modal = document.getElementById('qr-modal');
  const img = document.getElementById('qr-img');
  img.src = src;
  modal.style.display = 'flex';
}

document.querySelectorAll('.nav nav a').forEach(link => {
  link.addEventListener('click', () => {
    const nav = document.querySelector('.nav nav');
    nav.style.display = 'none';
    document.querySelector('.hamburger')?.setAttribute('aria-expanded', "false");
  });
});

