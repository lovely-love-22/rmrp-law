/* ============================================================
   RMRP LAW — логика портала (финальная версия)
   ============================================================ */

(function () {
  'use strict';

  console.log('[RMRP] script.js загружен');

  var LS = {
    bg: 'rmrp_bg',
    music: 'rmrp_music',
    laws: 'rmrp_custom_laws',
    chapters: 'rmrp_custom_chapters'
  };

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ============================================================
     ЖДЁМ ЗАГРУЗКИ DOM
     ============================================================ */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    console.log('[RMRP] DOM готов');

    initAccordion();
    initBurger();
    initExpandCollapse();
    initDocSearch();
    initGlobalSearch();
    initToTop();
    initSliders();
    initBgTabs();
    initModals();
    initEditor();
    initChapterEditor();
    initToolbar();
    initExportImport();
    restoreBg();
    restoreLaws();
    restoreChapters();

    console.log('[RMRP] ✓ инициализация завершена');
  });

  /* ============================================================
     1. АККОРДЕОН — ПРЯМОЕ НАВЕШИВАНИЕ
     ============================================================ */
  function initAccordion() {
    var headers = $$('.acc-header');
    console.log('[RMRP] найдено глав:', headers.length);

    headers.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var item = btn.closest('.acc-item');
        if (!item) return;

        var acc = item.closest('.accordion');
        var isOpen = item.classList.contains('open');

        // Закрываем все в этом аккордеоне
        if (acc) {
          $$('.acc-item.open', acc).forEach(function (i) {
            i.classList.remove('open');
          });
        }

        // Открываем текущий, если был закрыт
        if (!isOpen) {
          item.classList.add('open');
        }
      });
    });
  }

  /* ============================================================
     2. БУРГЕР
     ============================================================ */
  function initBurger() {
    var burger = $('#burger');
    var nav = $('#nav');
    if (!burger || !nav) return;

    burger.addEventListener('click', function () {
      nav.classList.toggle('open');
    });

    $$('.nav-link', nav).forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
      });
    });
  }

  /* ============================================================
     3. РАЗВЕРНУТЬ / СВЕРНУТЬ ВСЁ
     ============================================================ */
  function initExpandCollapse() {
    $$('[data-expand]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var doc = btn.getAttribute('data-expand');
        $$('[data-accordion="' + doc + '"] .acc-item').forEach(function (i) {
          i.classList.add('open');
        });
      });
    });

    $$('[data-collapse]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var doc = btn.getAttribute('data-collapse');
        $$('[data-accordion="' + doc + '"] .acc-item').forEach(function (i) {
          i.classList.remove('open');
        });
      });
    });
  }

  /* ============================================================
     4. ПОИСК ВНУТРИ ДОКУМЕНТА
     ============================================================ */
  function initDocSearch() {
    $$('.doc-search').forEach(function (input) {
      input.addEventListener('input', function () {
        var doc = input.getAttribute('data-doc');
        var q = input.value.trim().toLowerCase();
        var items = $$('[data-accordion="' + doc + '"] .acc-item');

        if (!q) {
          items.forEach(function (i) {
            i.style.display = '';
            i.classList.remove('open');
          });
          return;
        }

        items.forEach(function (item) {
          var text = item.textContent.toLowerCase();
          item.style.display = text.indexOf(q) !== -1 ? '' : 'none';
        });
      });
    });
  }

  /* ============================================================
     5. ГЛОБАЛЬНЫЙ ПОИСК
     ============================================================ */
  var globalBox = null;

  function removeGlobalBox() {
    if (globalBox) {
      globalBox.remove();
      globalBox = null;
    }
  }

  function buildGlobalResults(q) {
    var query = q.trim().toLowerCase();
    if (!query) return [];
    var results = [];

    $$('section.section').forEach(function (sec) {
      var secTitleEl = $('.section-title', sec);
      var secTitle = secTitleEl ? secTitleEl.textContent : '';
      var secId = sec.id;

      $$('.acc-item', sec).forEach(function (item, idx) {
        var titleEl = $('.acc-title', item);
        var numEl = $('.acc-num', item);
        var textEl = $('.acc-text', item);
        var title = titleEl ? titleEl.textContent : '';
        var num = numEl ? numEl.textContent : '';
        var text = textEl ? textEl.textContent : '';

        if (text.toLowerCase().indexOf(query) !== -1 ||
            title.toLowerCase().indexOf(query) !== -1) {
          var i = text.toLowerCase().indexOf(query);
          var start = Math.max(0, i - 60);
          var excerpt = (start > 0 ? '…' : '') + text.slice(start, start + 160).replace(/\s+/g, ' ') + '…';
          results.push({
            secId: secId,
            secTitle: secTitle,
            num: num,
            title: title,
            excerpt: excerpt,
            accIdx: idx
          });
        }
      });
    });

    return results.slice(0, 30);
  }

  function renderGlobalResults(results) {
    removeGlobalBox();
    var searchInput = $('#searchInput');
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
        var secId = a.getAttribute('data-sec');
        var idx = parseInt(a.getAttribute('data-idx'), 10);
        var sec = document.getElementById(secId);
        if (!sec) return;

        var items = $$('.acc-item', sec);
        items.forEach(function (i) { i.classList.remove('open'); });
        if (items[idx]) items[idx].classList.add('open');

        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        removeGlobalBox();
        searchInput.value = '';
        var sc = $('#searchClear');
        if (sc) sc.hidden = true;
      });
    });
  }

  function initGlobalSearch() {
    var searchInput = $('#searchInput');
    var searchClear = $('#searchClear');
    if (!searchInput || !searchClear) return;

    var t;

    searchInput.addEventListener('input', function () {
      var q = searchInput.value;
      searchClear.hidden = !q;
      clearTimeout(t);
      t = setTimeout(function () {
        if (q.trim().length < 2) { removeGlobalBox(); return; }
        renderGlobalResults(buildGlobalResults(q));
      }, 200);
    });

    searchClear.addEventListener('click', function () {
      searchInput.value = '';
      searchClear.hidden = true;
      removeGlobalBox();
    });

    document.addEventListener('click', function (e) {
      if (!searchInput.parentElement.contains(e.target)) removeGlobalBox();
    });
  }

  /* ============================================================
     6. КНОПКА «НАВЕРХ»
     ============================================================ */
  function initToTop() {
    var toTop = $('#toTop');
    if (!toTop) return;

    window.addEventListener('scroll', function () {
      toTop.classList.toggle('show', window.scrollY > 500);
    });

    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============================================================
     7. СЛАЙДЕРЫ
     ============================================================ */
  function initSliders() {
    var bind = function (id, outId, sfx) {
      var el = $('#' + id);
      var o = $('#' + outId);
      if (el && o) {
        el.addEventListener('input', function () {
          o.textContent = el.value + sfx;
        });
      }
    };
    bind('bgOverlay', 'bgOverlayValue', '%');
    bind('bgBlur', 'bgBlurValue', 'px');
    bind('bgVolume', 'bgVolumeValue', '%');
  }

  /* ============================================================
     8. ТАБЫ ФОНА
     ============================================================ */
  function initBgTabs() {
    $$('.bg-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var name = tab.getAttribute('data-bg-tab');
        $$('.bg-tab').forEach(function (t) {
          t.classList.toggle('active', t === tab);
        });
        $$('.bg-panel').forEach(function (p) {
          p.classList.toggle('active', p.getAttribute('data-bg-panel') === name);
        });
      });
    });
  }

  /* ============================================================
     9. МОДАЛКИ — открытие/закрытие
     ============================================================ */
  function openModal(m) { if (m) m.hidden = false; }
  function closeModal(m) { if (m) m.hidden = true; }

  function initModals() {
    var openEditor = $('#openEditor');
    var openBg = $('#openBgPicker');
    var closeEditor = $('#closeEditor');
    var closeBg = $('#closeBgPicker');
    var closeCh = $('#closeChapterEditor');
    var cancelEditor = $('#cancelEditor');
    var editorModal = $('#editorModal');
    var bgModal = $('#bgModal');
    var chapterModal = $('#chapterModal');

    if (openEditor) openEditor.addEventListener('click', function () { openModal(editorModal); });
    if (openBg) openBg.addEventListener('click', function () { openModal(bgModal); });
    if (closeEditor) closeEditor.addEventListener('click', function () { closeModal(editorModal); });
    if (closeBg) closeBg.addEventListener('click', function () { closeModal(bgModal); });
    if (closeCh) closeCh.addEventListener('click', function () { closeModal(chapterModal); });
    if (cancelEditor) cancelEditor.addEventListener('click', function () { closeModal(editorModal); });

    [editorModal, bgModal, chapterModal].forEach(function (m) {
      if (!m) return;
      m.addEventListener('click', function (e) {
        if (e.target === m) m.hidden = true;
      });
    });

    // Применить фон
    var applyBg = $('#applyBg');
    if (applyBg) {
      applyBg.addEventListener('click', function () {
        var activeTabEl = $('.bg-tab.active');
        var activeTab = activeTabEl ? activeTabEl.getAttribute('data-bg-tab') : 'url';
        var overlayEl = $('#bgOverlay');
        var blurEl = $('#bgBlur');
        var overlay = (overlayEl ? overlayEl.value : 60) / 100;
        var blur = blurEl ? blurEl.value : 0;

        if (activeTab === 'url') {
          var url = $('#bgUrlInput').value.trim();
          if (url) applyBackground(url, overlay, blur);
        } else if (activeTab === 'youtube') {
          var ytUrl = $('#bgYoutubeInput').value.trim();
          if (ytUrl) {
            var ytId = extractYouTubeId(ytUrl);
            if (ytId) applyYouTubeBg(ytId, overlay, blur);
          }
        } else if (activeTab === 'file') {
          var file = $('#bgFileInput').files[0];
          if (file) {
            var reader = new FileReader();
            reader.onload = function (ev) {
              applyBackground(ev.target.result, overlay, blur);
            };
            reader.readAsDataURL(file);
          }
        } else if (activeTab === 'music') {
          var mUrl = $('#bgMusicInput').value.trim();
          var volEl = $('#bgVolume');
          var loopEl = $('#bgMusicLoop');
          var vol = (volEl ? volEl.value : 50) / 100;
          var loop = loopEl ? loopEl.checked : true;
          if (mUrl) {
            var mId = extractYouTubeId(mUrl);
            if (mId) {
              localStorage.setItem(LS.music, JSON.stringify({ id: mId, vol: vol, loop: loop }));
              playMusic(mId, vol, loop);
            }
          }
        }
        closeModal(bgModal);
      });
    }

    // Убрать фон
    var removeBg = $('#removeBg');
    if (removeBg) {
      removeBg.addEventListener('click', function () {
        localStorage.removeItem(LS.bg);
        localStorage.removeItem(LS.music);
        var style = $('#dynamic-bg-styles');
        if (style) style.textContent = '';
        $$('.yt-bg-frame').forEach(function (el) { el.remove(); });
        closeModal(bgModal);
      });
    }
  }

  /* ============================================================
     10. ФОН / МУЗЫКА
     ============================================================ */
  function extractYouTubeId(url) {
    var m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/);
    return m ? m[1] : null;
  }

  function applyBackground(url, overlay, blur) {
    localStorage.setItem(LS.bg, JSON.stringify({ url: url, overlay: overlay, blur: blur }));
    var style = $('#dynamic-bg-styles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'dynamic-bg-styles';
      document.head.appendChild(style);
    }
    style.textContent =
      'body::before{content:"";position:fixed;inset:0;z-index:-2;' +
      'background:url("' + url + '") center/cover no-repeat fixed;' +
      'filter:blur(' + blur + 'px);transform:scale(1.06);}' +
      'body::after{content:"";position:fixed;inset:0;z-index:-1;' +
      'background:rgba(10,11,15,' + overlay + ');}';
  }

  function applyYouTubeBg(id, overlay, blur) {
    localStorage.setItem(LS.bg, JSON.stringify({ youtube: id, overlay: overlay, blur: blur }));
    var style = $('#dynamic-bg-styles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'dynamic-bg-styles';
      document.head.appendChild(style);
    }
    style.textContent = 'body::after{content:"";position:fixed;inset:0;z-index:-1;background:rgba(10,11,15,' + overlay + ');}';

    $$('.yt-bg-frame').forEach(function (el) { el.remove(); });

    var wrap = document.createElement('div');
    wrap.className = 'yt-bg-frame';
    wrap.style.cssText = 'position:fixed;inset:0;z-index:-2;pointer-events:none;overflow:hidden;filter:blur(' + blur + 'px);';
    wrap.innerHTML = '<iframe src="https://www.youtube.com/embed/' + id + '?autoplay=1&mute=1&controls=0&loop=1&playlist=' + id + '&showinfo=0&rel=0&iv_load_policy=3" style="position:absolute;top:50%;left:50%;width:177.78vh;height:56.25vw;min-width:100%;min-height:100%;transform:translate(-50%,-50%);border:0;" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
    document.body.appendChild(wrap);
  }

  var ytPlayer = null;

  function playMusic(id, vol, loop) {
    if (ytPlayer) { try { ytPlayer.destroy(); } catch (e) {} }
    if (!window.YT) {
      var tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = function () { createYT(id, vol, loop); };
    } else {
      createYT(id, vol, loop);
    }
  }

  function createYT(id, vol, loop) {
    var holder = document.createElement('div');
    holder.id = 'yt-music-holder';
    holder.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
    document.body.appendChild(holder);

    var div = document.createElement('div');
    div.id = 'yt-music-player';
    holder.appendChild(div);

    ytPlayer = new YT.Player('yt-music-player', {
      videoId: id,
      playerVars: { autoplay: 1, controls: 0, loop: loop ? 1 : 0, playlist: loop ? id : '' },
      events: {
        onReady: function (e) {
          e.target.setVolume(vol * 100);
          e.target.playVideo();
        }
      }
    });
  }

  function restoreBg() {
    try {
      var bg = JSON.parse(localStorage.getItem(LS.bg) || 'null');
      if (bg) {
        if (bg.url) applyBackground(bg.url, bg.overlay, bg.blur);
        else if (bg.youtube) applyYouTubeBg(bg.youtube, bg.overlay, bg.blur);
      }
      var m = JSON.parse(localStorage.getItem(LS.music) || 'null');
      if (m) {
        var startMusic = function () { playMusic(m.id, m.vol, m.loop); };
        document.addEventListener('click', startMusic, { once: true });
      }
    } catch (e) {}
  }

  /* ============================================================
     11. РЕДАКТОР ЗАКОНОВ
     ============================================================ */
  function initEditor() {
    var saveEditor = $('#saveEditor');
    if (!saveEditor) return;

    saveEditor.addEventListener('click', function () {
      var cat = $('#lawCategory').value;
      var tag = $('#lawTag').value.trim();
      var title = $('#lawTitle').value.trim();
      var text = $('#editorArea').innerHTML.trim();

      if (!title || !text) {
        alert('Заполните заголовок и текст закона');
        return;
      }

      var laws = JSON.parse(localStorage.getItem(LS.laws) || '{}');
      if (!laws[cat]) laws[cat] = [];
      laws[cat].push({
        id: Date.now(),
        tag: tag,
        title: title,
        text: text,
        created: new Date().toISOString()
      });
      localStorage.setItem(LS.laws, JSON.stringify(laws));

      renderCustomLaws(cat);
      closeModal($('#editorModal'));

      $('#lawTitle').value = '';
      $('#lawTag').value = '';
      $('#editorArea').innerHTML = '';
    });
  }

  function renderCustomLaws(cat) {
    var container = document.getElementById('custom-' + cat);
    if (!container) return;

    var laws = JSON.parse(localStorage.getItem(LS.laws) || '{}');
    var list = laws[cat] || [];

    if (!list.length) {
      container.innerHTML = '';
      return;
    }

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

    // Перевешиваем обработчики на новые заголовки
    $$('.acc-header', container).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.acc-item');
        var isOpen = item.classList.contains('open');
        if (isOpen) item.classList.remove('open');
        else item.classList.add('open');
      });
    });
  }

  function restoreLaws() {
    ['constitution', 'uk', 'koap', 'process', 'weapons', 'property',
     'raids', 'vzk', 'discipline', 'garrison', 'internal', 'drill', 'custom']
      .forEach(renderCustomLaws);
  }

  /* ============================================================
     12. РЕДАКТОР ГЛАВ
     ============================================================ */
  function initChapterEditor() {
    // Кнопки «📖 Редактор глав»
    $$('[data-chapter-editor]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sec = btn.getAttribute('data-chapter-editor');
        $('#chapterSection').value = sec;
        $('#chapterId').value = 'chapter_' + Date.now();
        renderChapterList();
        openModal($('#chapterModal'));
      });
    });

    // Сохранить главу
    var saveChapter = $('#saveChapter');
    if (saveChapter) {
      saveChapter.addEventListener('click', function () {
        var sec = $('#chapterSection').value;
        var emoji = $('#chapterEmoji').value.trim() || '📖';
        var num = $('#chapterNum').value.trim();
        var title = $('#chapterTitle').value.trim();
        var color = $('#chapterColor').value;
        var id = $('#chapterId').value || ('chapter_' + Date.now());

        if (!title) { alert('Введите название главы'); return; }

        var chapters = JSON.parse(localStorage.getItem(LS.chapters) || '{}');
        if (!chapters[sec]) chapters[sec] = [];
        chapters[sec] = chapters[sec].filter(function (c) { return c.id !== id; });
        chapters[sec].push({
          id: id, emoji: emoji, num: num, title: title,
          color: color, created: new Date().toISOString()
        });
        localStorage.setItem(LS.chapters, JSON.stringify(chapters));

        renderChapterList();
        renderCustomChapters(sec);
        closeModal($('#chapterModal'));
      });
    }

    // Очистить форму
    var resetBtn = $('#resetChapterForm');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        $('#chapterEmoji').value = '📖';
        $('#chapterNum').value = '';
        $('#chapterTitle').value = '';
        $('#chapterColor').value = '#ff4655';
        $('#chapterId').value = 'chapter_' + Date.now();
      });
    }

    // Смена раздела
    var sectionSelect = $('#chapterSection');
    if (sectionSelect) {
      sectionSelect.addEventListener('change', renderChapterList);
    }
  }

  function renderChapterList() {
    var chapterList = $('#chapterList');
    if (!chapterList) return;

    var sec = $('#chapterSection').value || 'constitution';
    var chapters = JSON.parse(localStorage.getItem(LS.chapters) || '{}');
    var list = chapters[sec] || [];

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

    // Удаление глав
    $$('.ch-del', chapterList).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-id');
        var chapters2 = JSON.parse(localStorage.getItem(LS.chapters) || '{}');
        if (chapters2[sec]) {
          chapters2[sec] = chapters2[sec].filter(function (c) { return c.id !== id; });
        }
        localStorage.setItem(LS.chapters, JSON.stringify(chapters2));
        renderChapterList();
        renderCustomChapters(sec);
      });
    });
  }

  function renderCustomChapters(sec) {
    var acc = document.querySelector('[data-accordion="' + sec + '"]');
    if (!acc) return;

    $$('.acc-item.user-chapter', acc).forEach(function (el) { el.remove(); });

    var chapters = JSON.parse(localStorage.getItem(LS.chapters) || '{}');
    var list = chapters[sec] || [];

    list.forEach(function (c) {
      var div = document.createElement('div');
      div.className = 'acc-item user-chapter';
      div.innerHTML =
        '<button class="acc-header" style="border-left:3px solid ' + (c.color || '#ff4655') + '">' +
          '<span class="acc-emoji">' + (c.emoji || '📖') + '</span>' +
          '<span class="acc-num" style="color:' + (c.color || '#ff4655') + '">' + (c.num || '') + '</span>' +
          '<span class="acc-title">' + c.title + '</span>' +
          '<span class="acc-arrow">▾</span>' +
        '</button>' +
        '<div class="acc-body"><div class="acc-text" style="color:var(--txt-3);font-style:italic;">Пользовательская глава.</div></div>';
      acc.appendChild(div);

      // Навешиваем обработчик на новую главу
      var hdr = $('.acc-header', div);
      if (hdr) {
        hdr.addEventListener('click', function () {
          var isOpen = div.classList.contains('open');
          if (isOpen) div.classList.remove('open');
          else div.classList.add('open');
        });
      }
    });
  }

  function restoreChapters() {
    ['constitution', 'uk', 'koap', 'process', 'weapons', 'property',
     'raids', 'vzk', 'discipline', 'garrison', 'internal', 'drill']
      .forEach(renderCustomChapters);
  }

  /* ============================================================
     13. ТУЛБАР РЕДАКТОРА
     ============================================================ */
  function initToolbar() {
    $$('.tool-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cmd = btn.getAttribute('data-cmd');
        var val = btn.getAttribute('data-value');
        var area = $('#editorArea');
        if (!area) return;

        area.focus();
        try {
          if (cmd === 'formatBlock') document.execCommand(cmd, false, val);
          else document.execCommand(cmd, false, null);
        } catch (err) {}

        var prev = $('#previewContent');
        if (prev) prev.innerHTML = area.innerHTML;
      });
    });

    // Предпросмотр при вводе
    var editorArea = $('#editorArea');
    if (editorArea) {
      editorArea.addEventListener('input', function () {
        var prev = $('#previewContent');
        if (prev) prev.innerHTML = editorArea.innerHTML;
      });
    }
  }

  /* ============================================================
     14. ЭКСПОРТ / ИМПОРТ
     ============================================================ */
  function initExportImport() {
    window.RMRP = {
      export: function () {
        var data = {
          laws: JSON.parse(localStorage.getItem(LS.laws) || '{}'),
          chapters: JSON.parse(localStorage.getItem(LS.chapters) || '{}'),
          bg: localStorage.getItem(LS.bg),
          music: localStorage.getItem(LS.music)
        };
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'rmrp-law-backup-' + Date.now() + '.json';
        a.click();
      },
      import: function (file) {
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (e) {
          try {
            var data = JSON.parse(e.target.result);
            if (data.laws) localStorage.setItem(LS.laws, JSON.stringify(data.laws));
            if (data.chapters) localStorage.setItem(LS.chapters, JSON.stringify(data.chapters));
            if (data.bg) localStorage.setItem(LS.bg, data.bg);
            if (data.music) localStorage.setItem(LS.music, data.music);
            alert('Импорт выполнен. Перезагрузите страницу.');
            location.reload();
          } catch (err) {
            alert('Ошибка чтения файла: ' + err.message);
          }
        };
        reader.readAsText(file);
      }
    };
  }

})();
