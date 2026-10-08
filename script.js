/* ============================================================
   RMRP LAW — логика портала
   ============================================================ */

(function(){
  'use strict';

  const LS = {
    bg:'rmrp_bg',
    music:'rmrp_music',
    laws:'rmrp_custom_laws',
    chapters:'rmrp_custom_chapters',
    overlay:'rmrp_overlay',
    blur:'rmrp_blur'
  };

  const $  = (s,c=document)=>c.querySelector(s);
  const $$ = (s,c=document)=>Array.from(c.querySelectorAll(s));

  /* ==================== БУРГЕР ==================== */
  const burger = $('#burger');
  const nav = $('#nav');
  if(burger && nav){
    burger.addEventListener('click',()=>{
      nav.classList.toggle('open');
    });
    $$('.nav-link',nav).forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
  }

  /* ==================== АКТИВНАЯ ССЫЛКА ПРИ СКРОЛЛЕ ==================== */
  const sections = $$('section[id]');
  const navLinks = $$('.nav-link');
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const id = e.target.id;
        navLinks.forEach(l=>l.classList.toggle('active', l.getAttribute('href') === '#'+id));
      }
    });
  },{rootMargin:'-40% 0px -55% 0px'});
  sections.forEach(s=>observer.observe(s));

  /* ==================== АККОРДЕОН ==================== */
  $$('.acc-header').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const item = btn.closest('.acc-item');
      const acc = item.closest('.accordion');
      const isOpen = item.classList.contains('open');
      // закрываем все в этом аккордеоне
      $$('.acc-item.open',acc).forEach(i=>i.classList.remove('open'));
      if(!isOpen) item.classList.add('open');
    });
  });

  /* ==================== РАЗВЕРНУТЬ/СВЕРНУТЬ ВСЁ ==================== */
  $$('[data-expand]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const doc = btn.getAttribute('data-expand');
      $$(`[data-accordion="${doc}"] .acc-item`).forEach(i=>i.classList.add('open'));
    });
  });
  $$('[data-collapse]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const doc = btn.getAttribute('data-collapse');
      $$(`[data-accordion="${doc}"] .acc-item`).forEach(i=>i.classList.remove('open'));
    });
  });

  /* ==================== ПОИСК ВНУТРИ ДОКУМЕНТА ==================== */
  $$('.doc-search').forEach(input=>{
    input.addEventListener('input',()=>{
      const doc = input.getAttribute('data-doc');
      const q = input.value.trim().toLowerCase();
      const items = $$(`[data-accordion="${doc}"] .acc-item`);
      if(!q){
        items.forEach(i=>{i.style.display='';i.classList.remove('open')});
        return;
      }
      items.forEach(item=>{
        const text = item.textContent.toLowerCase();
        if(text.includes(q)){
          item.style.display='';
        }else{
          item.style.display='none';
        }
      });
    });
  });

  /* ==================== ГЛОБАЛЬНЫЙ ПОИСК ==================== */
  const searchInput = $('#searchInput');
  const searchClear = $('#searchClear');
  let globalBox = null;

  function removeGlobalBox(){
    if(globalBox){globalBox.remove();globalBox=null;}
  }

  function buildGlobalResults(q){
    const query = q.trim().toLowerCase();
    if(!query) return [];
    const results = [];
    $$('section.section').forEach(sec=>{
      const secTitle = $('.section-title',sec)?.textContent || '';
      const secId = sec.id;
      $$('.acc-item',sec).forEach(item=>{
        const title = $('.acc-title',item)?.textContent || '';
        const num = $('.acc-num',item)?.textContent || '';
        const text = $('.acc-text',item)?.textContent || '';
        if(text.toLowerCase().includes(query) || title.toLowerCase().includes(query)){
          const idx = text.toLowerCase().indexOf(query);
          const start = Math.max(0,idx-60);
          const excerpt = (start>0?'…':'')+text.slice(start,start+160).replace(/\s+/g,' ')+'…';
          results.push({secId,secTitle,num,title,excerpt,accIdx:$$('.acc-item',sec).indexOf(item)});
        }
      });
    });
    return results.slice(0,30);
  }

  function renderGlobalResults(results){
    removeGlobalBox();
    globalBox = document.createElement('div');
    globalBox.id = 'globalSearchResults';
    if(!results.length){
      globalBox.innerHTML = '<div class="gsr-empty">Ничего не найдено</div>';
    }else{
      globalBox.innerHTML = results.map((r,i)=>`
        <a href="#${r.secId}" class="gsr-item" data-sec="${r.secId}" data-idx="${r.accIdx}">
          <div class="gsr-section">${r.secTitle}</div>
          <div class="gsr-title">${r.num ? r.num+' — ' : ''}${r.title}</div>
          <div class="gsr-excerpt">${r.excerpt}</div>
        </a>
      `).join('');
    }
    searchInput.parentElement.appendChild(globalBox);
    $$('.gsr-item',globalBox).forEach(a=>{
      a.addEventListener('click',(e)=>{
        e.preventDefault();
        const secId = a.getAttribute('data-sec');
        const idx = parseInt(a.getAttribute('data-idx'),10);
        const sec = document.getElementById(secId);
        if(!sec) return;
        const items = $$('.acc-item',sec);
        items.forEach(i=>i.classList.remove('open'));
        if(items[idx]) items[idx].classList.add('open');
        sec.scrollIntoView({behavior:'smooth',block:'start'});
        removeGlobalBox();
        searchInput.value = '';
        searchClear.hidden = true;
      });
    });
  }

  if(searchInput){
    let t;
    searchInput.addEventListener('input',()=>{
      const q = searchInput.value;
      searchClear.hidden = !q;
      clearTimeout(t);
      t = setTimeout(()=>{
        if(q.trim().length<2){removeGlobalBox();return;}
        renderGlobalResults(buildGlobalResults(q));
      },200);
    });
    searchClear.addEventListener('click',()=>{
      searchInput.value='';
      searchClear.hidden=true;
      removeGlobalBox();
    });
    document.addEventListener('click',(e)=>{
      if(!searchInput.parentElement.contains(e.target)) removeGlobalBox();
    });
  }

  /* ==================== TO TOP ==================== */
  const toTop = $('#toTop');
  if(toTop){
    window.addEventListener('scroll',()=>{
      toTop.classList.toggle('show', window.scrollY>500);
    });
    toTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  }

  /* ==================== МОДАЛКА: ФОН/МУЗЫКА ==================== */
  const bgModal = $('#bgModal');
  const openBg = $('#openBgPicker');
  const closeBg = $('#closeBgPicker');
  const applyBg = $('#applyBg');
  const removeBg = $('#removeBg');

  function openModal(m){m.hidden=false;}
  function closeModal(m){m.hidden=true;}

  if(openBg) openBg.addEventListener('click',()=>openModal(bgModal));
  if(closeBg) closeBg.addEventListener('click',()=>closeModal(bgModal));
  if(bgModal) bgModal.addEventListener('click',(e)=>{if(e.target===bgModal) closeModal(bgModal);});

  // Табы
  $$('.bg-tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      const name = tab.getAttribute('data-bg-tab');
      $$('.bg-tab').forEach(t=>t.classList.toggle('active',t===tab));
      $$('.bg-panel').forEach(p=>p.classList.toggle('active',p.getAttribute('data-bg-panel')===name));
    });
  });

  // Слайдеры
  const bgOverlay = $('#bgOverlay'), bgOverlayValue = $('#bgOverlayValue');
  const bgBlur = $('#bgBlur'), bgBlurValue = $('#bgBlurValue');
  const bgVolume = $('#bgVolume'), bgVolumeValue = $('#bgVolumeValue');
  if(bgOverlay) bgOverlay.addEventListener('input',()=>bgOverlayValue.textContent=bgOverlay.value+'%');
  if(bgBlur)    bgBlur.addEventListener('input',()=>bgBlurValue.textContent=bgBlur.value+'px');
  if(bgVolume)  bgVolume.addEventListener('input',()=>bgVolumeValue.textContent=bgVolume.value+'%');

  // Применить фон
  if(applyBg){
    applyBg.addEventListener('click',()=>{
      const activeTab = $('.bg-tab.active')?.getAttribute('data-bg-tab');
      const overlay = (bgOverlay?.value||60)/100;
      const blur = (bgBlur?.value||0);
      localStorage.setItem(LS.overlay,overlay);
      localStorage.setItem(LS.blur,blur);

      if(activeTab==='url'){
        const url = $('#bgUrlInput').value.trim();
        if(url) applyBackground(url,overlay,blur);
      }else if(activeTab==='youtube'){
        const url = $('#bgYoutubeInput').value.trim();
        if(url){ const id = extractYouTubeId(url); if(id) applyYouTubeBg(id,overlay,blur); }
      }else if(activeTab==='file'){
        const file = $('#bgFileInput').files[0];
        if(file){
          const reader = new FileReader();
          reader.onload = e=>applyBackground(e.target.result,overlay,blur);
          reader.readAsDataURL(file);
        }
      }else if(activeTab==='music'){
        const url = $('#bgMusicInput').value.trim();
        const vol = (bgVolume?.value||50)/100;
        const loop = $('#bgMusicLoop')?.checked;
        if(url){
          const id = extractYouTubeId(url);
          if(id){
            localStorage.setItem(LS.music,JSON.stringify({id,vol,loop}));
            playMusic(id,vol,loop);
          }
        }
      }
      closeModal(bgModal);
    });
  }

  if(removeBg){
    removeBg.addEventListener('click',()=>{
      localStorage.removeItem(LS.bg);
      localStorage.removeItem(LS.music);
      document.body.style.background='';
      $$('#dynamic-bg-styles').forEach(s=>s.remove());
      $$('.yt-bg-frame,.yt-bg-iframe,.bg-video-el').forEach(e=>e.remove());
      closeModal(bgModal);
    });
  }

  function applyBackground(url,overlay,blur){
    localStorage.setItem(LS.bg,JSON.stringify({url,overlay,blur}));
    let style = $('#dynamic-bg-styles');
    if(!style){style=document.createElement('style');style.id='dynamic-bg-styles';document.head.appendChild(style);}
    style.textContent = `
      body::before{
        content:"";position:fixed;inset:0;z-index:-2;
        background:url('${url}') center/cover no-repeat fixed;
        filter:blur(${blur}px);
        transform:scale(1.06);
      }
      body::after{
        content:"";position:fixed;inset:0;z-index:-1;
        background:rgba(10,11,15,${overlay});
      }
    `;
  }

  function extractYouTubeId(url){
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/);
    return m ? m[1] : null;
  }

  function applyYouTubeBg(id,overlay,blur){
    localStorage.setItem(LS.bg,JSON.stringify({youtube:id,overlay,blur}));
    let style = $('#dynamic-bg-styles');
    if(!style){style=document.createElement('style');style.id='dynamic-bg-styles';document.head.appendChild(style);}
    style.textContent = `
      body::after{
        content:"";position:fixed;inset:0;z-index:-1;
        background:rgba(10,11,15,${overlay});
      }
    `;
    $$('.yt-bg-frame').forEach(e=>e.remove());
    const wrap = document.createElement('div');
    wrap.className='yt-bg-frame';
    wrap.style.cssText=`position:fixed;inset:0;z-index:-2;pointer-events:none;overflow:hidden;filter:blur(${blur}px);`;
    wrap.innerHTML=`<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&showinfo=0&rel=0&iv_load_policy=3" style="position:absolute;top:50%;left:50%;width:177.78vh;height:56.25vw;min-width:100%;min-height:100%;transform:translate(-50%,-50%);border:0;" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    document.body.appendChild(wrap);
  }

  let ytPlayer=null;
  function playMusic(id,vol,loop){
    if(ytPlayer){ try{ytPlayer.destroy();}catch(e){} }
    if(!window.YT){
      const tag=document.createElement('script');
      tag.src='https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady=()=>createYT(id,vol,loop);
    }else{
      createYT(id,vol,loop);
    }
  }
  function createYT(id,vol,loop){
    const holder=document.createElement('div');
    holder.id='yt-music-holder';
    holder.style.cssText='position:fixed;left:-9999px;top:-9999px;';
    document.body.appendChild(holder);
    const div=document.createElement('div');div.id='yt-music-player';holder.appendChild(div);
    ytPlayer=new YT.Player('yt-music-player',{
      videoId:id,
      playerVars:{autoplay:1,controls:0,loop:loop?1:0,playlist:loop?id:''},
      events:{
        onReady:e=>{e.target.setVolume(vol*100);e.target.playVideo();}
      }
    });
  }

  function restoreBg(){
    try{
      const bg = JSON.parse(localStorage.getItem(LS.bg)||'null');
      if(bg){
        if(bg.url) applyBackground(bg.url,bg.overlay,bg.blur);
        else if(bg.youtube) applyYouTubeBg(bg.youtube,bg.overlay,bg.blur);
      }
      const m = JSON.parse(localStorage.getItem(LS.music)||'null');
      if(m){
        const startMusic=()=>playMusic(m.id,m.vol,m.loop);
        document.addEventListener('click',startMusic,{once:true});
      }
    }catch(e){}
  }
  restoreBg();

  /* ==================== МОДАЛКА: РЕДАКТОР ЗАКОНОВ ==================== */
  const editorModal = $('#editorModal');
  const openEditor = $('#openEditor');
  const closeEditor = $('#closeEditor');
  const cancelEditor = $('#cancelEditor');
  const saveEditor = $('#saveEditor');
  const editorArea = $('#editorArea');
  const lawTitle = $('#lawTitle');
  const lawTag = $('#lawTag');
  const lawCategory = $('#lawCategory');
  const previewContent = $('#previewContent');

  if(openEditor) openEditor.addEventListener('click',()=>openModal(editorModal));
  if(closeEditor) closeEditor.addEventListener('click',()=>closeModal(editorModal));
  if(cancelEditor) cancelEditor.addEventListener('click',()=>closeModal(editorModal));
  if(editorModal) editorModal.addEventListener('click',(e)=>{if(e.target===editorModal) closeModal(editorModal);});

  // Тулбар
  $$('.tool-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const cmd = btn.getAttribute('data-cmd');
      const val = btn.getAttribute('data-value');
      editorArea.focus();
      if(cmd==='formatBlock') document.execCommand(cmd,false,val);
      else document.execCommand(cmd,false,null);
      updatePreview();
    });
  });

  function updatePreview(){
    if(previewContent && editorArea) previewContent.innerHTML = editorArea.innerHTML;
  }
  if(editorArea) editorArea.addEventListener('input',updatePreview);

  if(saveEditor){
    saveEditor.addEventListener('click',()=>{
      const cat = lawCategory.value;
      const tag = lawTag.value.trim();
      const title = lawTitle.value.trim();
      const text = editorArea.innerHTML.trim();
      if(!title || !text){alert('Заполните заголовок и текст закона');return;}

      const laws = JSON.parse(localStorage.getItem(LS.laws)||'{}');
      if(!laws[cat]) laws[cat]=[];
      laws[cat].push({id:Date.now(),tag,title,text,created:new Date().toISOString()});
      localStorage.setItem(LS.laws,JSON.stringify(laws));
      renderCustomLaws(cat);
      closeModal(editorModal);
      lawTitle.value='';lawTag.value='';editorArea.innerHTML='';updatePreview();
    });
  }

  function renderCustomLaws(cat){
    const container = document.getElementById('custom-'+cat) || document.querySelector(`#custom-${cat}`);
    if(!container) return;
    const laws = JSON.parse(localStorage.getItem(LS.laws)||'{}');
    const list = laws[cat]||[];
    container.innerHTML = list.map(l=>`
      <div class="acc-item open">
        <button class="acc-header">
          <span class="acc-emoji">📌</span>
          <span class="acc-num">${l.tag||'Закон'}</span>
          <span class="acc-title">${l.title}</span>
          <span class="acc-arrow">▾</span>
        </button>
        <div class="acc-body">
          <div class="acc-text">${l.text}</div>
        </div>
      </div>
    `).join('');
    $$('.acc-header',container).forEach(btn=>{
      btn.addEventListener('click',()=>btn.closest('.acc-item').classList.toggle('open'));
    });
  }

  // Восстановление пользовательских законов
  ['constitution','uk','koap','process','weapons','property','raids','vzk','discipline','garrison','internal','drill','custom'].forEach(renderCustomLaws);

  /* ==================== МОДАЛКА: РЕДАКТОР ГЛАВ ==================== */
  const chapterModal = $('#chapterModal');
  const closeChapterEditor = $('#closeChapterEditor');
  const saveChapter = $('#saveChapter');
  const resetChapterForm = $('#resetChapterForm');
  const chapterList = $('#chapterList');
  const chapterEmoji = $('#chapterEmoji');
  const chapterNum = $('#chapterNum');
  const chapterTitle = $('#chapterTitle');
  const chapterSection = $('#chapterSection');
  const chapterId = $('#chapterId');
  const chapterColor = $('#chapterColor');

  $$('[data-chapter-editor]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      chapterSection.value = btn.getAttribute('data-chapter-editor');
      chapterId.value = 'chapter_'+Date.now();
      renderChapterList();
      openModal(chapterModal);
    });
  });
  if(closeChapterEditor) closeChapterEditor.addEventListener('click',()=>closeModal(chapterModal));
  if(chapterModal) chapterModal.addEventListener('click',(e)=>{if(e.target===chapterModal) closeModal(chapterModal);});
  if(resetChapterForm) resetChapterForm.addEventListener('click',()=>{
    chapterEmoji.value='📖';chapterNum.value='';chapterTitle.value='';chapterColor.value='#ff4655';
    chapterId.value='chapter_'+Date.now();
  });

  if(saveChapter){
    saveChapter.addEventListener('click',()=>{
      const sec = chapterSection.value;
      const emoji = chapterEmoji.value.trim()||'📖';
      const num = chapterNum.value.trim();
      const title = chapterTitle.value.trim();
      const color = chapterColor.value;
      const id = chapterId.value;
      if(!title){alert('Введите название главы');return;}

      const chapters = JSON.parse(localStorage.getItem(LS.chapters)||'{}');
      if(!chapters[sec]) chapters[sec]=[];
      chapters[sec] = chapters[sec].filter(c=>c.id!==id);
      chapters[sec].push({id,emoji,num,title,color,created:new Date().toISOString()});
      localStorage.setItem(LS.chapters,JSON.stringify(chapters));
      renderChapterList();
      renderCustomChapters(sec);
      resetChapterForm.click();
    });
  }

  function renderChapterList(){
    if(!chapterList) return;
    const sec = chapterSection.value;
    const chapters = JSON.parse(localStorage.getItem(LS.chapters)||'{}');
    const list = chapters[sec]||[];
    chapterList.innerHTML = list.length
      ? list.map(c=>`
        <div class="chapter-item">
          <span class="ch-emoji">${c.emoji}</span>
          <span class="ch-num">${c.num||''}</span>
          <span class="ch-title">${c.title}</span>
          <button class="ch-del" data-id="${c.id}">✕</button>
        </div>`).join('')
      : '<div style="color:var(--txt-3);font-size:13px;padding:14px;text-align:center;">Пока нет добавленных глав для этого раздела</div>';
    $$('.ch-del',chapterList).forEach(b=>{
      b.addEventListener('click',()=>{
        const id=b.getAttribute('data-id');
        const ch = JSON.parse(localStorage.getItem(LS.chapters)||'{}');
        ch[sec] = (ch[sec]||[]).filter(c=>c.id!==id);
        localStorage.setItem(LS.chapters,JSON.stringify(ch));
        renderChapterList();
        renderCustomChapters(sec);
      });
    });
  }

  function renderCustomChapters(sec){
    const acc = document.querySelector(`[data-accordion="${sec}"]`);
    if(!acc) return;
    $$('.acc-item.user-chapter',acc).forEach(e=>e.remove());
    const chapters = JSON.parse(localStorage.getItem(LS.chapters)||'{}');
    const list = chapters[sec]||[];
    list.forEach(c=>{
      const div=document.createElement('div');
      div.className='acc-item user-chapter open';
      div.innerHTML=`
        <button class="acc-header" style="border-left:3px solid ${c.color||'#ff4655'}">
          <span class="acc-emoji">${c.emoji}</span>
          <span class="acc-num" style="color:${c.color||'#ff4655'}">${c.num||''}</span>
          <span class="acc-title">${c.title}</span>
          <span class="acc-arrow">▾</span>
        </button>
        <div class="acc-body"><div class="acc-text" style="color:var(--txt-3);font-style:italic;">Пользовательская глава. Отредактируйте содержимое через редактор законов.</div></div>
      `;
      acc.appendChild(div);
    });
    $$('.acc-header',acc).forEach(btn=>{
      btn.addEventListener('click',()=>btn.closest('.acc-item').classList.toggle('open'));
    });
  }

  ['constitution','uk','koap','process','weapons','property','raids','vzk','discipline','garrison','internal','drill'].forEach(renderCustomChapters);

  /* ==================== ЭКСПОРТ / ИМПОРТ ==================== */
  window.RMRP = {
    export(){
      const data = {
        laws: JSON.parse(localStorage.getItem(LS.laws)||'{}'),
        chapters: JSON.parse(localStorage.getItem(LS.chapters)||'{}'),
        bg: localStorage.getItem(LS.bg),
        music: localStorage.getItem(LS.music)
      };
      const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
      const a = document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download='rmrp-law-backup-'+Date.now()+'.json';
      a.click();
    },
    import(file){
      const reader = new FileReader();
      reader.onload = e=>{
        try{
          const data = JSON.parse(e.target.result);
          if(data.laws) localStorage.setItem(LS.laws,JSON.stringify(data.laws));
          if(data.chapters) localStorage.setItem(LS.chapters,JSON.stringify(data.chapters));
          if(data.bg) localStorage.setItem(LS.bg,data.bg);
          if(data.music) localStorage.setItem(LS.music,data.music);
          alert('Импорт выполнен. Перезагрузите страницу.');
          location.reload();
        }catch(err){alert('Ошибка чтения файла: '+err.message);}
      };
      reader.readAsText(file);
    }
  };

})();