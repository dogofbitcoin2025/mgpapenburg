(() => {
  const MANIFEST_URL = 'news/beitraege/index.json';
  const LEGACY_URL = 'news/news.json';
  const PLACEHOLDER_SVG = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><rect width="1600" height="1000" fill="#003149"/><circle cx="1270" cy="220" r="220" fill="#feea00" opacity=".18"/><text x="120" y="520" fill="#feea00" font-family="Arial" font-size="84" font-weight="700">Aktuelles</text><text x="120" y="620" fill="#fff" font-family="Arial" font-size="42">Mariengymnasium Papenburg</text></svg>`);

  let newsData = [];
  let activeCategory = 'all';
  let searchQuery = '';

  const escapeHtml = (str = '') => String(str).replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
  const dateValue = (item) => new Date(item.datum || item.date || 0).getTime() || 0;
  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const sortedNews = () => [...newsData].sort((a,b) => dateValue(b) - dateValue(a));
  const imgTag = (item, attrs = '') => `<img src="${escapeHtml(item.bild || PLACEHOLDER_SVG)}" alt="${escapeHtml(item.titel || 'Aktuelles')}" onerror="this.onerror=null;this.src='${PLACEHOLDER_SVG}'" ${attrs}>`;

  function normalizeManifest(manifest) {
    if (!Array.isArray(manifest)) return [];
    return manifest.map(entry => {
      if (typeof entry === 'string') return entry;
      if (entry && typeof entry === 'object') return entry.datei || entry.file || entry.filename || '';
      return '';
    }).filter(Boolean);
  }

  async function loadNewsFromSingleFiles() {
    const manifestRes = await fetch(MANIFEST_URL, { cache: 'no-store' });
    if (!manifestRes.ok) throw new Error('index.json konnte nicht geladen werden');
    const manifest = await manifestRes.json();
    const files = normalizeManifest(manifest);
    const items = await Promise.all(files.map(async file => {
      const clean = String(file).replace(/^\/+/, '');
      const url = clean.startsWith('news/beitraege/') ? clean : `news/beitraege/${clean}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`${url} konnte nicht geladen werden`);
      return res.json();
    }));
    return items.filter(Boolean);
  }

  async function loadLegacyNews() {
    const res = await fetch(LEGACY_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('news.json konnte nicht geladen werden');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async function loadNews() {
    try {
      newsData = await loadNewsFromSingleFiles();
      if (!newsData.length) throw new Error('Keine Einzelbeiträge gefunden');
    } catch (singleErr) {
      try {
        newsData = await loadLegacyNews();
      } catch (legacyErr) {
        console.warn(singleErr, legacyErr);
        newsData = [];
        document.querySelectorAll('#homepage-news, #news-grid, #featured-container').forEach(el => {
          el.innerHTML = `<div class="empty-state-news"><h3>Aktuelles konnte nicht geladen werden</h3><p>Bitte prüfen: Liegt <code>news/beitraege/index.json</code> auf dem Server und stehen dort die Beitragsdateien?</p></div>`;
        });
      }
    }
  }

  function renderHome() {
    const home = document.getElementById('homepage-news');
    if (!home) return;
    const limit = Number(home.dataset.newsHome || 3);
    const items = sortedNews().slice(0, limit);
    if (!items.length) {
      home.innerHTML = `<div class="news-loading">Noch keine Beiträge vorhanden.</div>`;
      return;
    }
    home.innerHTML = items.map(n => `
      <a href="aktuelles.html" class="news-card">
        <div class="news-card-img">
          <span class="news-card-cat">${escapeHtml(n.kategorieLabel || n.kategorie || 'Aktuelles')}</span>
          ${imgTag(n, 'loading="lazy"')}
        </div>
        <div class="news-card-body">
          <span class="news-card-date">${formatDate(n.datum)}${n.autor ? ' · ' + escapeHtml(n.autor) : ''}</span>
          <h3>${escapeHtml(n.titel)}</h3>
          <p>${escapeHtml(n.vorschau || '')}</p>
          <span class="news-card-link">Weiterlesen <i data-lucide="arrow-right" style="width:14px;height:14px"></i></span>
        </div>
      </a>`).join('');
  }

  function getFiltered() {
    const q = searchQuery.toLowerCase().trim();
    return sortedNews().filter(n => {
      const matchCat = activeCategory === 'all' || n.kategorie === activeCategory || n.kategorieLabel === activeCategory;
      const hay = `${n.titel || ''} ${n.vorschau || ''} ${n.kategorieLabel || ''} ${n.autor || ''}`.toLowerCase();
      return matchCat && (!q || hay.includes(q));
    });
  }

  function renderFeatured(items) {
    const container = document.getElementById('featured-container');
    const section = document.getElementById('featured-section');
    if (!container || !section) return;
    if (!items.length || activeCategory !== 'all' || searchQuery) { section.style.display = 'none'; return; }
    section.style.display = '';
    const f = items[0];
    container.innerHTML = `
      <article class="featured-card" data-id="${escapeHtml(f.id)}">
        <div class="featured-card-image">${imgTag(f)}</div>
        <div class="featured-card-body">
          <div class="featured-card-meta">${escapeHtml(f.kategorieLabel || f.kategorie || 'Aktuelles')} · <span>${formatDate(f.datum)}${f.autor ? ' · ' + escapeHtml(f.autor) : ''}</span></div>
          <h2>${escapeHtml(f.titel)}</h2>
          <p>${escapeHtml(f.vorschau || '')}</p>
          <span class="news-card-archive-link">Beitrag lesen <i data-lucide="arrow-right"></i></span>
        </div>
      </article>`;
  }

  function renderGrid(items) {
    const grid = document.getElementById('news-grid');
    if (!grid) return;
    const list = (activeCategory === 'all' && !searchQuery) ? items.slice(1) : items;
    if (!list.length) {
      grid.innerHTML = `<div class="empty-state-news"><i data-lucide="search-x"></i><h3>Keine Beiträge gefunden</h3><p>Bitte Suche oder Filter anpassen.</p></div>`;
      return;
    }
    grid.innerHTML = list.map(n => `
      <article class="news-card-archive" data-id="${escapeHtml(n.id)}">
        <div class="news-card-archive-img">
          <span class="news-card-archive-cat ${escapeHtml(n.kategorie || '')}">${escapeHtml(n.kategorieLabel || n.kategorie || 'Aktuelles')}</span>
          ${imgTag(n, 'loading="lazy"')}
        </div>
        <div class="news-card-archive-body">
          <div class="news-card-archive-meta">${formatDate(n.datum)}${n.autor ? ' · ' + escapeHtml(n.autor) : ''}</div>
          <h3>${escapeHtml(n.titel)}</h3>
          <p>${escapeHtml(n.vorschau || '')}</p>
          <span class="news-card-archive-link">Weiterlesen <i data-lucide="arrow-right"></i></span>
        </div>
      </article>`).join('');
  }

  function openModal(id) {
    const item = newsData.find(n => String(n.id) === String(id));
    const modal = document.getElementById('newsModal');
    if (!item || !modal) return;
    document.getElementById('modalImg').src = item.bild || PLACEHOLDER_SVG;
    document.getElementById('modalImg').alt = item.titel || 'Aktuelles';
    document.getElementById('modalMeta').textContent = `${item.kategorieLabel || item.kategorie || 'Aktuelles'} · ${formatDate(item.datum)}${item.autor ? ' · ' + item.autor : ''}`;
    document.getElementById('modalTitle').textContent = item.titel || '';
    document.getElementById('modalContent').innerHTML = item.inhalt || `<p>${escapeHtml(item.vorschau || '')}</p>`;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const modal = document.getElementById('newsModal');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderArchive() {
    const items = getFiltered();
    renderFeatured(items);
    renderGrid(items);
  }

  function bindArchiveEvents() {
    document.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.dataset.cat || 'all';
        renderArchive();
        if (window.lucide) lucide.createIcons();
      });
    });
    const input = document.getElementById('searchInput');
    if (input) input.addEventListener('input', (e) => { searchQuery = e.target.value || ''; renderArchive(); if (window.lucide) lucide.createIcons(); });
    document.addEventListener('click', e => {
      const card = e.target.closest('.news-card-archive, .featured-card');
      if (card && card.dataset.id) openModal(card.dataset.id);
      if (e.target.closest('#modalClose') || e.target.id === 'newsModal') closeModal();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await loadNews();
    renderHome();
    renderArchive();
    bindArchiveEvents();
    if (window.lucide) lucide.createIcons();
  });
})();
