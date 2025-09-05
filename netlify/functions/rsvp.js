// /.netlify/functions/rsvp.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { Allow: 'POST' }, body: 'Method Not Allowed' };
  }

  try {
    // 1️⃣ Leer payload
    const payload = JSON.parse(event.body || '{}');
    const name = (payload.name || '').trim();
    const phone = (payload.phone || '').trim();
    const attendance = (payload.attendance || '').trim();
    const guests = Number(payload.guests) || 0;
    const message = (payload.message || '').trim();

    if (!name || !phone || !attendance) {
      return { statusCode: 400, body: 'Campos requeridos: name, phone, attendance' };
    }

    // 2️⃣ Enviar WhatsApp
    const WHATSAPP_ENDPOINT = process.env.WHATSAPP_ENDPOINT;
    const EVOLUTIONAPI_TOKEN = process.env.EVOLUTIONAPI_TOKEN;

    if (!WHATSAPP_ENDPOINT || !EVOLUTIONAPI_TOKEN) {
      return { statusCode: 500, body: 'Faltan variables de WhatsApp en entorno' };
    }

    const text = `👋 Hola ${name},

    Hemos registrado tu confirmación: "${attendance}".
    Número de acompañantes: ${guests}.
    ${message ? 'Mensaje adicional: ' + message : ''}

    Gracias por informarnos. ¡Nos alegra que formes parte de este día especial, de la manera que sea! 💛`;

    const waRes = await fetch(WHATSAPP_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTIONAPI_TOKEN },
      body: JSON.stringify({ number: phone, text })
    });

    if (!waRes.ok) {
      const txt = await waRes.text();
      console.error('WhatsApp error:', txt);
      return { statusCode: 502, body: 'Error enviando WhatsApp' };
    }

    // 3️⃣ Guardar RSVP en GitHub
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const OWNER = process.env.GITHUB_OWNER;
    const REPO = process.env.GITHUB_REPO;
    const BRANCH = process.env.GITHUB_BRANCH || 'main';
    const FILE_PATH = 'rsvps.json';

    if (!GITHUB_TOKEN || !OWNER || !REPO) {
      return { statusCode: 500, body: 'Faltan variables GitHub' };
    }

    // Obtener contenido actual
    let existing = [];
    let sha = null;
    const getRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`, {
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github+json' }
    });

    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
      try {
        existing = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8')) || [];
      } catch {
        existing = [];
      }
    } else if (getRes.status === 404) {
      // Archivo no existe aún, se creará
      existing = [];
      sha = null;
    } else {
      const txt = await getRes.text();
      console.error('GitHub GET error:', txt);
      return { statusCode: 502, body: 'Error leyendo RSVP en GitHub' };
    }

    // Agregar nuevo RSVP
    existing.push({ name, phone, attendance, guests, message, created_at: new Date().toISOString() });

    // Subir archivo actualizado
    const putRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github+json' },
      body: JSON.stringify({
        message: `RSVP — ${name} (${new Date().toISOString()})`,
        content: Buffer.from(JSON.stringify(existing, null, 2)).toString('base64'),
        branch: BRANCH,
        sha
      })
    });

    if (!putRes.ok) {
      const txt = await putRes.text();
      console.error('GitHub PUT error:', txt);
      return { statusCode: 502, body: 'Error guardando RSVP en GitHub' };
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: err.message + '\n' + err.stack };
  }
};
