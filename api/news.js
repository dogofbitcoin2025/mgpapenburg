const GH_API = 'https://api.github.com';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Server-Konfiguration fehlt: ${name}`);
  return value;
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function safeBase64Utf8(str) {
  return Buffer.from(str, 'utf8').toString('base64');
}

function decodeBase64Utf8(str) {
  return Buffer.from(str || '', 'base64').toString('utf8');
}

function slugify(str) {
  return String(str || 'beitrag')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'beitrag';
}

function textToHtml(text) {
  const escape = (s) => String(s).replace(/[&<>]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  return String(text || '')
    .split(/\n\s*\n/g)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${escape(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

async function ghFetch(path, options = {}) {
  const token = requiredEnv('GITHUB_TOKEN');
  const res = await fetch(`${GH_API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data && data.message ? data.message : `GitHub API Fehler ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

async function getFile(owner, repo, branch, path) {
  try {
    return await ghFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${encodeURIComponent(branch)}`);
  } catch (err) {
    if (String(err.message).includes('Not Found')) return null;
    throw err;
  }
}

async function putFile({ owner, repo, branch, path, contentBase64, message, sha }) {
  const body = { message, content: contentBase64, branch };
  if (sha) body.sha = sha;
  return ghFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Nur POST erlaubt.' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || body.password !== requiredEnv('ADMIN_PASSWORD')) {
      return json(res, 401, { error: 'Admin-Passwort ist falsch.' });
    }

    const owner = requiredEnv('GITHUB_OWNER');
    const repo = requiredEnv('GITHUB_REPO');
    const branch = process.env.GITHUB_BRANCH || 'main';
    const newsPath = process.env.NEWS_FILE_PATH || 'news/news.json';

    const datum = String(body.datum || '').trim();
    const titel = String(body.titel || '').trim();
    const vorschau = String(body.vorschau || '').trim();
    const inhaltText = String(body.inhalt || '').trim();
    if (!datum || !titel || !vorschau || !inhaltText) {
      return json(res, 400, { error: 'Datum, Titel, Kurztext und Beitragstext sind Pflichtfelder.' });
    }

    const id = slugify(body.id || `${datum}-${titel}`);
    let bild = '';

    if (body.image && body.image.dataUrl) {
      const match = String(body.image.dataUrl).match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
      if (!match) return json(res, 400, { error: 'Bildformat nicht erkannt.' });
      const ext = 'jpg';
      const imagePath = `news/bilder/${id}.${ext}`;
      const existingImage = await getFile(owner, repo, branch, imagePath);
      await putFile({
        owner, repo, branch, path: imagePath,
        contentBase64: match[2],
        sha: existingImage && existingImage.sha,
        message: `Aktuelles: Bild ${id}`
      });
      bild = imagePath;
    }

    const newsFile = await getFile(owner, repo, branch, newsPath);
    let news = [];
    if (newsFile && newsFile.content) {
      const parsed = JSON.parse(decodeBase64Utf8(newsFile.content));
      news = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.beitraege) ? parsed.beitraege : []);
    }

    const item = {
      id,
      datum,
      autor: String(body.autor || '').trim(),
      kategorie: String(body.kategorie || 'allgemein').trim(),
      kategorieLabel: String(body.kategorieLabel || body.kategorie || 'Aktuelles').trim(),
      titel,
      vorschau,
      bild: bild || 'news/bilder/default-news.svg',
      inhalt: textToHtml(inhaltText)
    };

    news = [item, ...news.filter(n => String(n.id) !== id)]
      .sort((a, b) => new Date(b.datum || 0) - new Date(a.datum || 0));

    await putFile({
      owner, repo, branch, path: newsPath,
      contentBase64: safeBase64Utf8(JSON.stringify(news, null, 2) + '\n'),
      sha: newsFile && newsFile.sha,
      message: `Aktuelles: ${titel}`
    });

    return json(res, 200, { ok: true, item });
  } catch (err) {
    return json(res, 500, { error: err.message || 'Unbekannter Serverfehler.' });
  }
};
