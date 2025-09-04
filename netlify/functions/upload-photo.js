// /.netlify/functions/upload-photo.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { Allow: 'POST' }, body: 'Method Not Allowed' };
  }

  try {
    const { filename, contentBase64, cloudinaryUrl } = JSON.parse(event.body || '{}');
    if (!filename || !cloudinaryUrl) {
      return { statusCode: 400, body: 'filename y cloudinaryUrl son requeridos' };
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
      existing = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
    }

    // 2️⃣ Agregar nueva foto
    existing.push({ filename, url: cloudinaryUrl, uploaded_at: new Date().toISOString() });

    // 3️⃣ Subir JSON actualizado
    const putRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/vnd.github+json' },
      body: JSON.stringify({
        message: `Agregar foto: ${filename} (${new Date().toISOString()})`,
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

    return { statusCode: 200, body: JSON.stringify({ ok: true, url: cloudinaryUrl }) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Error interno' };
  }
};
