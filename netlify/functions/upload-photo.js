// /.netlify/functions/upload-photo.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { Allow: 'POST' }, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const photos = Array.isArray(body) ? body : [body]; // Permite envío masivo o individual

    if (!photos.length) {
      return { statusCode: 400, body: 'No se recibieron fotos' };
    }

    // Variables GitHub
    const TOKEN = process.env.GITHUB_TOKEN;
    const OWNER = process.env.GITHUB_OWNER;
    const REPO = process.env.GITHUB_REPO;
    const BRANCH = process.env.GITHUB_BRANCH || 'main';
    const FILE_PATH = 'photos.json';

    if (!TOKEN || !OWNER || !REPO) {
      return { statusCode: 500, body: 'Faltan variables GitHub' };
    }

    // 1️⃣ Leer contenido actual de photos.json
    let existing = [];
    let sha = null;

    const getRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`, {
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/vnd.github+json' }
    });

    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
      try {
        existing = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
        if (!Array.isArray(existing)) existing = [];
      } catch {
        existing = [];
      }
    } else if (getRes.status === 404) {
      existing = [];
    } else {
      const txt = await getRes.text();
      console.error('GitHub GET error:', txt);
      return { statusCode: 502, body: 'Error leyendo photos.json en GitHub' };
    }

    // 2️⃣ Agregar nuevas fotos
    photos.forEach(photo => {
      if (!photo.filename || !photo.cloudinaryUrl) return;
      existing.push({ filename: photo.filename, url: photo.cloudinaryUrl, uploaded_at: new Date().toISOString() });
    });

    // 3️⃣ Subir JSON actualizado
    const putRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/vnd.github+json' },
      body: JSON.stringify({
        message: `Agregar ${photos.length} foto(s) (${new Date().toISOString()})`,
        content: Buffer.from(JSON.stringify(existing, null, 2)).toString('base64'),
        branch: BRANCH,
        sha
      })
    });

    if (!putRes.ok) {
      const txt = await putRes.text();
      console.error('GitHub PUT error:', txt);
      return { statusCode: 502, body: 'Error guardando photos.json en GitHub' };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, uploaded: photos.length }) };

  } catch (err) {
    console.error('Error interno:', err);
    return { statusCode: 500, body: 'Error interno' };
  }
};
