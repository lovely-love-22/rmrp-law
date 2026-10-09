/* ============================================================
   RMRP LAW — логика портала
   ============================================================ */

(function () {
  'use strict';

  const LS = {
    bg: 'rmrp_bg',
    music: 'rmrp_music',
    laws: 'rmrp_custom_laws',
    chapters: 'rmrp_custom_chapters'
  };

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  function safe(fn, label) {
    try { fn(); } catch (e) { console.warn('[RMRP]', label || '', e); }
  }

  /* ============================================================
     1. ДЕЛЕГИРОВАНИЕ ВСЕХ КЛИКОВ
     ============================================================ */
  document.addEventListener('click', function (e) {

    // Аккордеон
    const accHeader = e.target.closest('.acc-header');
    if (accHeader) {
      const item = accHeader.closest('.acc-item');
      if (item) {
        const acc = item.closest('.accordion');
        const isOpen = item.classList.contains('open');
        if (acc) {
          $$('.acc-item.open', acc).forEach(function (i) { i.classList.remove('open'); });
        }
        if (!isOpen) item.classList.add('open');
      }
      e.preventDefault();
      return;
    }

    // Бургер
    if (e.target.closest('#burger')) {
      const nav = $('#nav');
      if (nav) nav.classList.toggle('open');
      return;
    }

    // Ссылки навигации — закрыть мобильное меню
    if (e.target.closest('.nav-link')) {
      const nav = $('#nav');
      if (nav) nav.classList.remove('open');
    }

    // Развернуть всё
    const expandBtn = e.target.closest('[data-expand]');
    if (expandBtn) {
      const doc = expandBtn.getAttribute('data-expand');
      $$('[data-accordion="' + doc + '"] .acc-item').forEach(function (i) { i.classList.add('open'); });
      return;
    }

    // Свернуть всё
    const collapseBtn = e.target.closest('[data-collapse]');
    if (collapseBtn) {
      const doc = collapseBtn.getAttribute('data-collapse');
      $$('[data-accordion="' + doc + '"] .acc-item').forEach(function (i) { i.classList.remove('open'); });
      return;
    }

    // Открыть редактор глав
    const chapterBtn = e.target.closest('[data-chapter-editor]');
    if (chapterBtn) {
      const sec = chapterBtn.getAttribute('data-chapter-editor');
      const chSection = $('#chapterSection');
      const chId = $('#chapterId');
      if (chSection) chSection.value = sec;
      if (chId) chId.value = 'chapter_' + Date.now();
      renderChapterList();
      const modal = $('#chapterModal');
      if (modal) modal.hidden = false;
      return;
    }

    // Открыть редактор законов
    if (e.target.closest('#openEditor')) {
      const modal = $('#editorModal');
      if (modal) modal.hidden = false;
      return;
    }

    // Открыть настройки фона
    if (e.target.closest('#openBgPicker')) {
      const modal = $('#bgModal');
      if (modal) modal.hidden = false;
      return;
    }

    // Закрытие модалок
    if (e.target.closest('#closeBgPicker')) { var m1 = $('#bgModal'); if (m1) m1.hidden = true; return; }
    if (e.target.closest('#closeEditor'))   { var m2 = $('#editorModal'); if (m2) m2.hidden = true; return; }
    if (e.target.closest('#cancelEditor'))  { var m3 = $('#editorModal'); if (m3) m3.hidden = true; return; }
    if (e.target.closest('#closeChapterEditor')) { var m4 = $('#chapterModal'); if (m4) m4.hidden = true; return; }

    // Клик по оверлею — закрыть
    if (e.target.classList.contains('modal-overlay')) {
      e.target.hidden = true;
      return;
    }

    // Табы фона
    const bgTab = e.target.closest('.bg-tab');
    if (bgTab) {
      const name = bgTab.getAttribute('data-bg-tab');
      $$('.bg-tab').forEach(function (t) { t.classList.toggle('active', t === bgTab); });
      $$('.bg-panel').forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-bg-panel') === name); });
      return;
    }

    // Тулбар редактора
    const toolBtn = e.target.closest('.tool-btn');
    if (toolBtn) {
      const cmd = toolBtn.getAttribute('data-cmd');
      const val = toolBtn.getAttribute('data-value');
      const area = $('#editorArea');
      if (area) {
        area.focus();
        try {
          if (cmd === 'formatBlock') document.execCommand(cmd, false, val);
          else document.execCommand(cmd, false, null);
        } catch (err) {}
        const prev = $('#previewContent');
        if (prev) prev.innerHTML = area.innerHTML;
      }
      return;
    }

    // Кнопка «наверх»
    if (e.target.closest('#toTop')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Удалить главу
    const chDel = e.target.closest('.ch-del');
    if (chDel) {
      const id = chDel.getAttribute('data-id');
      const sec = ($('#chapterSection') || {}).value;
      if (!sec) return;
      const chapters = JSON.parse(localStorage.getItem(LS.chapters) || '{}');
      if (chapters[sec]) chapters[sec] = chapters[sec].filter(function (c) { return c.id !== id; });
      localStorage.setItem(LS.chapters, JSON.stringify(chapters));
      renderChapterList();
      renderCustomChapters(sec);
      return;
    }

    // Сохранить закон
    if (e.target.closest('#saveEditor')) {
      const cat = $('#lawCategory').value;
      const tag = $('#lawTag').value.trim();
      const title = $('#lawTitle').value.trim();
      const text = $('#editorArea').innerHTML.trim();
      if (!title || !text) { alert('Заполните заголовок и текст закона'); return; }
      const laws = JSON.parse(localStorage.getItem(LS.laws) || '{}');
      if (!laws[cat]) laws[cat] = [];
      laws[cat].push({ id: Date.now(), tag: tag, title: title, text: text, created: new Date().toISOString() });
      localStorage.setItem(LS.laws, JSON.stringify(laws));
      renderCustomLaws(cat);
      var em = $('#editorModal'); if (em) em.hidden = true;
      $('#lawTitle').value = ''; $('#lawTag').value = ''; $('#editorArea').innerHTML = '';
      return;
    }

    // Сохранить главу
    if (e.target.closest('#saveChapter')) {
      const sec = $('#chapterSection').value;
      const emoji = $('#chapterEmoji').value.trim() || '📖';
      const num = $('#chapterNum').value.trim();
      const title = $('#chapterTitle').value.trim();
      const color = $('#chapterColor').value;
      const id = $('#chapterId').value || ('chapter_' + Date.now());
      if (!title) { alert('Введите название главы'); return; }
      const chapters = JSON.parse(localStorage.getItem(LS.chapters) || '{}');
      if (!chapters[sec]) chapters[sec] = [];
      chapters[sec] = chapters[sec].filter(function (c) { return c.id !== id; });
      chapters[sec].push({ id: id, emoji: emoji, num: num, title: title, color: color, created: new Date().toISOString() });
      localStorage.setItem(LS.chapters, JSON.stringify(chapters));
      renderChapterList();
      renderCustomChapters(sec);
      var cm = $('#chapterModal'); if (cm) cm.hidden = true;
      return;
    }

    // Очистить форму главы
    if (e.target.closest('#resetChapterForm')) {
      $('#chapterEmoji').value = '📖';
      $('#chapterNum').value = '';
      $('#chapterTitle').value = '';
      $('#chapterColor').value = '#ff4655';
      $('#chapterId').value = 'chapter_' + Date.now();
      return;
    }

    // Применить фон
    if (e.target.closest('#applyBg')) {
      const activeTab = ($('.bg-tab.active') || {}).getAttribute ? $('.bg-tab.active').getAttribute('data-bg-tab') : 'url';
      const overlay = (($('#bgOverlay') || {}).value || 60) / 100;
      const blur = (($('#bgBlur') || {}).value || 0);

      if (activeTab === 'url') {
        const url = $('#bgUrlInput').value.trim();
        if (url) applyBackground(url, overlay, blur);
      } else if (activeTab === 'youtube') {
        const url = $('#bgYoutubeInput').value.trim();
        if (url) { const id = extractYouTubeId(url); if (id) applyYouTubeBg(id, overlay, blur); }
      } else if (activeTab === 'file') {
        const file = $('#bgFileInput').files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (ev) { applyBackground(ev.target.result, overlay, blur); };
          reader.readAsDataURL(file);
        }
      } else if (activeTab === 'music') {
        const url = $('#bgMusicInput').value.trim();
        const vol = (($('#bgVolume') || {}).value || 50) / 100;
        const loop = ($('#bgMusicLoop') || {}).checked;
        if (url) {
          const id = extractYouTubeId(url);
          if (id) {
            localStorage.setItem(LS.music, JSON.stringify({ id: id, vol: vol, loop: loop }));
            playMusic(id, vol, loop);
          }
        }
      }
      var bm = $('#bgModal'); if (bm) bm.hidden = true;
      return;
    }

    // Убрать фон
    if (e.target.closest('#removeBg')) {
      localStorage.removeItem(LS.bg);
      localStorage.removeItem(LS.music);
      var st = $('#dynamic-bg-styles'); if (st) st.textContent = '';
      $$('.yt-bg-frame').forEach(function (el) { el.remove(); });
      var bm2 = $('#bgModal'); if (bm2) bm2.hidden = true;
      return;
    }
  });

  /* ============================================================
     2. ПОИСК ПО ДОКУМЕНТУ
     ============================================================ */
  document.addEventListener('input', function (e) {
    const input = e.target.closest('.doc-search');
    if (input) {
      const doc = input.getAttribute('data-doc');
      const q = input.value.trim().toLowerCase();
      const items = $$('[data-accordion="' + doc + '"] .acc-item');
      if (!q) {
        items.forEach(function (i) { i.style.display = ''; i.classList.remove('open'); });
        return;
      }
      items.forEach(function (item) {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? '' : 'none';
      });
      return;
    }

    // Глобальный поиск
    if (e.target.id === 'searchInput') {
      const q = e.target.value;
      const sc = $('#searchClear');
      if (sc) sc.hidden = !q;
      clearTimeout(window.__rmrpSearchT);
      window.__rmrpSearchT = setTimeout(function () {
        if (q.trim().length < 2) { removeGlobalBox(); return; }
        renderGlobalResults(buildGlobalResults(q));
      }, 200);
      return;
    }

    // Предпросмотр в редакторе
    if (e.target.id === 'editorArea') {
      const prev = $('#previewContent');
      if (prev) prev.innerHTML = e.target.innerHTML;
    }
  });

  /* ============================================================
     3. СЛАЙДЕРЫ
     ============================================================ */
  document.addEventListener('input', function (e) {
    if (e.target.id === 'bgOverlay') { var o = $('#bgOverlayValue'); if (o) o.textContent = e.target.value + '%'; }
    if (e.target.id === 'bgBlur')    { var b = $('#bgBlurValue');    if (b) b.textContent = e.target.value + 'px'; }
    if (e.target.id === 'bgVolume')  { var v = $('#bgVolumeValue');  if (v) v.textContent = e.target.value + '%'; }
  });

  /* ============================================================
     4. СМЕНА РАЗДЕЛА В РЕДАКТОРЕ ГЛАВ
     ============================================================ */
  document.addEventListener('change', function (e) {
    if (e.target.id === 'chapterSection') renderChapterList();
  });

  /* ============================================================
     5. КНОПКА «НАВЕРХ»
     ============================================================ */
  window.addEventListener('scroll', function () {
    const t = $('#toTop');
    if (t) t.classList.toggle('show', window.scrollY > 500);
  });

  /* ============================================================
     6. ГЛОБАЛЬНЫЙ ПОИСК
     ============================================================ */
  let globalBox = null;

  function removeGlobalBox() {
    if (globalBox) { globalBox.remove(); globalBox = null; }
  }

  function buildGlobalResults(q) {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const results = [];
    $$('section.section').forEach(function (sec) {
      const secTitleEl = $('.section-title', sec);
      const secTitle = secTitleEl ? secTitleEl.textContent : '';
      const secId = sec.id;
      $$('.acc-item', sec).forEach(function (item, idx) {
        const titleEl = $('.acc-title', item);
        const numEl = $('.acc-num', item);
        const textEl = $('.acc-text', item);
        const title = titleEl ? titleEl.textContent : '';
        const num = numEl ? numEl.textContent : '';
        const text = textEl ? textEl.textContent : '';
        if (text.toLowerCase().indexOf(query) !== -1 || title.toLowerCase().indexOf(query) !== -1) {
          const i = text.toLowerCase().indexOf(query);
          const start = Math.max(0, i - 60);
          const excerpt = (start > 0 ? '…' : '') + text.slice(start, start + 160).replace(/\s+/g, ' ') + '…';
          results.push({ secId: secId, secTitle: secTitle, num: num, title: title, excerpt: excerpt, accIdx: idx });
        }
      });
    });
    return results.slice(0, 30);
  }

  function renderGlobalResults(results) {
    removeGlobalBox();
    const searchInput = $('#searchInput');
    if (!searchInput) return;
    globalBox = document.createElement('div');
    globalBox.id = 'globalSearchResults';
    if (!results.length) {
      globalBox.innerHTML = '<div class="gsr-empty">Ничего не найдено</div>';
    } else {
      globalBox.innerHTML = results.map(function (r) {
        return '<a href="#' + r.secId + '" class="gsr-item" data-sec="' + r.secId + '" data-idx="' + r.accIdx + '">' +
          '<div class="gsr-section">' + r.secTitle + '</div>' +
          '<div class="gsr-title">' + (r.num ? r.num + ' — ' : '') + r.title + '</div>' +
          '<div class="gsr-excerpt">' + r.excerpt + '</div>' +
        '</a>';
      }).join('');
    }
    searchInput.parentElement.appendChild(globalBox);

    $$('.gsr-item', globalBox).forEach(function (a) {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        const secId = a.getAttribute('data-sec');
        const idx = parseInt(a.getAttribute('data-idx'), 10);
        const sec = document.getElementById(secId);
        if (!sec) return;
        const items = $$('.acc-item', sec);
        items.forEach(function (i) { i.classList.remove('open'); });
        if (items[idx]) items[idx].classList.add('open');
        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        removeGlobalBox();
        searchInput.value = '';
        const sc = $('#searchClear'); if (sc) sc.hidden = true;
      });
    });
  }

  // Кнопка очистки поиска
  document.addEventListener('click', function (e) {
    if (e.target.closest('#searchClear')) {
      const si = $('#searchInput');
      if (si) si.value = '';
      e.target.hidden = true;
      removeGlobalBox();
    }
    // Клик вне поиска — закрыть результаты
    const si = $('#searchInput');
    if (si && !si.parentElement.contains(e.target)) removeGlobalBox();
  });

  /* ============================================================
     7. ФОН / МУЗЫКА
     ============================================================ */
  function extractYouTubeId(url) {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/);
    return m ? m[1] : null;
  }

  function applyBackground(url, overlay, blur) {
    localStorage.setItem(LS.bg, JSON.stringify({ url: url, overlay: overlay, blur: blur }));
    let style = $('#dynamic-bg-styles');
    if (!style) { style = document.createElement('style'); style.id = 'dynamic-bg-styles'; document.head.appendChild(style); }
    style.textContent =
      'body::before{content:"";position:fixed;inset:0;z-index:-2;' +
      'background:url("' + url + '") center/cover no-repeat fixed;' +
      'filter:blur(' + blur + 'px);transform:scale(1.06);}' +
      'body::after{content:"";position:fixed;inset:0;z-index:-1;' +
      'background:rgba(10,11,15,' + overlay + ');}';
  }

  function applyYouTubeBg(id, overlay, blur) {
    localStorage.setItem(LS.bg, JSON.stringify({ youtube: id, overlay: overlay, blur: blur }));
    let style = $('#dynamic-bg-styles');
    if (!style) { style = document.createElement('style'); style.id = 'dynamic-bg-styles'; document.head.appendChild(style); }
    style.textContent = 'body::after{content:"";position:fixed;inset:0;z-index:-1;background:rgba(10,11,15,' + overlay + ');}';
    $$('.yt-bg-frame').forEach(function (el) { el.remove(); });
    const wrap = document.createElement('div');
    wrap.className = 'yt-bg-frame';
    wrap.style.cssText = 'position:fixed;inset:0;z-index:-2;pointer-events:none;overflow:hidden;filter:blur(' + blur + 'px);';
    wrap.innerHTML = '<iframe src="https://www.youtube.com/embed/' + id + '?autoplay=1&mute=1&controls=0&loop=1&playlist=' + id + '&showinfo=0&rel=0&iv_load_policy=3" style="position:absolute;top:50%;left:50%;width:177.78vh;height:56.25vw;min-width:100%;min-height:100%;transform:translate(-50%,-50%);border:0;" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
    document.body.appendChild(wrap);
  }

  let ytPlayer = null;
  function playMusic(id, vol, loop) {
    if (ytPlayer) { try { ytPlayer.destroy(); } catch (e) {} }
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = function () { createYT(id, vol, loop); };
    } else {
      createYT(id, vol, loop);
    }
  }
  function createYT(id, vol, loop) {
    const holder = document.createElement('div');
    holder.id = 'yt-music-holder';
    holder.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
    document.body.appendChild(holder);
    const div = document.createElement('div'); div.id = 'yt-music-player'; holder.appendChild(div);
    ytPlayer = new YT.Player('yt-music-player', {
      videoId: id,
      playerVars: { autoplay: 1, controls: 0, loop: loop ? 1 : 0, playlist: loop ? id : '' },
      events: { onReady: function (e) { e.target.setVolume(vol * 100); e.target.playVideo(); } }
    });
  }

  function restoreBg() {
    try {
      const bg = JSON.parse(localStorage.getItem(LS.bg) || 'null');
      if (bg) {
        if (bg.url) applyBackground(bg.url, bg.overlay, bg.blur);
        else if (bg.youtube) applyYouTubeBg(bg.youtube, bg.overlay, bg.blur);
      }
      const m = JSON.parse(localStorage.getItem(LS.music) || 'null');
      if (m) {
        const startMusic = function () { playMusic(m.id, m.vol, m.loop); };
        document.addEventListener('click', startMusic, { once: true });
      }
    } catch (e) {}
  }

  /* ============================================================
     8. ПОЛЬЗОВАТЕЛЬСКИЕ ЗАКОНЫ
     ============================================================ */
  function renderCustomLaws(cat) {
    const container = document.getElementById('custom-' + cat);
    if (!container) return;
    const laws = JSON.parse(localStorage.getItem(LS.laws) || '{}');
    const list = laws[cat] || [];
    if (!list.length) { container.innerHTML = ''; return; }
    container.innerHTML = list.map(function (l) {
      return '<div class="acc-item open">' +
        '<button class="acc-header">' +
          '<span class="acc-emoji">📌</span>' +
          '<span class="acc-num">' + (l.tag || 'Закон') + '</span>' +
          '<span class="acc-title">' + l.title + '</span>' +
          '<span class="acc-arrow">▾</span>' +
        '</button>' +
        '<div class="acc-body"><div class="acc-text">' + l.text + '</div></div>' +
      '</div>';
    }).join('');
  }

  function restoreLaws() {
    ['constitution', 'uk', 'koap', 'process', 'weapons', 'property', 'raids', 'vzk', 'discipline', 'garrison', 'internal', 'drill', 'custom'].forEach(renderCustomLaws);
  }

  /* ============================================================
     9. РЕДАКТОР ГЛАВ
     ============================================================ */
  function renderChapterList() {
    const chapterList = $('#chapterList');
    if (!chapterList) return;
    const sec = ($('#chapterSection') || {}).value || 'constitution';
    const chapters = JSON.parse(localStorage.getItem(LS.chapters) || '{}');
    const list = chapters[sec] || [];
    if (!list.length) {
      chapterList.innerHTML = '<div style="color:var(--txt-3);font-size:13px;padding:14px;text-align:center;">Пока нет добавленных глав для этого раздела</div>';
      return;
    }
    chapterList.innerHTML = list.map(function (c) {
      return '<div class="chapter-item">' +
        '<span class="ch-emoji">' + (c.emoji || '📖') + '</span>' +
        '<span class="ch-num">' + (c.num || '') + '</span>' +
        '<span class="ch-title">' + c.title + '</span>' +
        '<button class="ch-del" data-id="' + c.id + '">✕</button>' +
      '</div>';
    }).join('');
  }

  function renderCustomChapters(sec) {
    const acc = document.querySelector('[data-accordion="' + sec + '"]');
    if (!acc) return;
    $$('.acc-item.user-chapter', acc).forEach(function (el) { el.remove(); });
    const chapters = JSON.parse(localStorage.getItem(LS.chapters) || '{}');
    const list = chapters[sec] || [];
    list.forEach(function (c) {
      const div = document.createElement('div');
      div.className = 'acc-item user-chapter';
      div.innerHTML =
        '<button class="acc-header" style="border-left:3px solid ' + (c.color || '#ff4655') + '">' +
          '<span class="acc-emoji">' + (c.emoji || '📖') + '</span>' +
          '<span class="acc-num" style="color:' + (c.color || '#ff4655') + '">' + (c.num || '') + '</span>' +
          '<span class="acc-title">' + c.title + '</span>' +
          '<span class="acc-arrow">▾</span>' +
        '</button>' +
        '<div class="acc-body"><div class="acc-text" style="color:var(--txt-3);font-style:italic;">Пользовательская глава. Отредактируйте содержимое через редактор законов.</div></div>';
      acc.appendChild(div);
    });
  }

  function restoreChapters() {
    ['constitution', 'uk', 'koap', 'process', 'weapons', 'property', 'raids', 'vzk', 'discipline', 'garrison', 'internal', 'drill'].forEach(renderCustomChapters);
  }

  /* ============================================================
     10. ЭКСПОРТ / ИМПОРТ
     ============================================================ */
  window.RMRP = {
    export: function () {
      const data = {
        laws: JSON.parse(localStorage.getItem(LS.laws) || '{}'),
        chapters: JSON.parse(localStorage.getItem(LS.chapters) || '{}'),
        bg: localStorage.getItem(LS.bg),
        music: localStorage.getItem(LS.music)
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'rmrp-law-backup-' + Date.now() + '.json';
      a.click();
    },
    import: function (file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const data = JSON.parse(e.target.result);
          if (data.laws) localStorage.setItem(LS.laws, JSON.stringify(data.laws));
          if (data.chapters) localStorage.setItem(LS.chapters, JSON.stringify(data.chapters));
          if (data.bg) localStorage.setItem(LS.bg, data.bg);
          if (data.music) localStorage.setItem(LS.music, data.music);
          alert('Импорт выполнен. Перезагрузите страницу.');
          location.reload();
        } catch (err) { alert('Ошибка чтения файла: ' + err.message); }
      };
      reader.readAsText(file);
    }
  };

  /* ============================================================
     11. АКТИВНАЯ ССЫЛКА ПРИ СКРОЛЛЕ
     ============================================================ */
  safe(function () {
    if (!('IntersectionObserver' in window)) return;
    const navLinks = $$('.nav-link');
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          const id = e.target.id;
          navLinks.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === '#' + id); });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    $$('section[id]').forEach(function (s) { observer.observe(s); });
  }, 'scroll-spy');

  /* ============================================================
     12. ИНИЦИАЛИЗАЦИЯ
     ============================================================ */
  safe(restoreBg, 'restoreBg');
  safe(restoreLaws, 'restoreLaws');
  safe(restoreChapters, 'restoreChapters');

})();
