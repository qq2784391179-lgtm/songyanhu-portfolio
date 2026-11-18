(() => {
  'use strict';
  const projects = window.FILM_CATALOG;
  const $ = id => document.getElementById(id);
  const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  const clipLabel = (clip, padded = false) => clip.label ?? `第 ${padded ? String(clip.number).padStart(2, '0') : clip.number} 集`;
  let featuredIndex = 0;
  let currentProject = null;
  let currentClipIndex = 0;
  let returnFocus = null;
  const dialog = $('player-dialog');
  const video = $('video-player');
  if (!Array.isArray(projects) || !projects.length) return;
  const featuredProjects = projects.slice(0, 5);

  function renderWorks(filter = '全部') {
    $('project-grid').replaceChildren();
    projects.forEach((project, index) => {
      if (filter !== '全部' && project.tag !== filter) return;
      const article = document.createElement('article');
      article.className = 'project-card';
      const shortFilm = project.clips[0].label;
      const count = shortFilm ? '01 部选映' : `${String(project.clips.length).padStart(2, '0')} 集选映`;
      const subtitle = shortFilm ? '中文成片' : `精选第 ${project.clips.map(clip => clip.number).join('、')} 集`;
      article.innerHTML = `<button class="poster-button" aria-label="观看《${project.title}》"><img src="assets/${project.id}-poster.jpg" alt="${project.title}海报" loading="lazy"><span class="poster-index">${String(index + 1).padStart(2, '0')} / FILM</span><span class="poster-watch">观看作品<span class="play-circle"><span class="play-icon"></span></span></span></button><div class="project-meta"><span class="tag">${project.tag} / AIGC</span><span>${count}</span></div><h3><button>${project.title}</button></h3><p class="project-subtitle">${subtitle}</p>`;
      article.querySelectorAll('button').forEach(button => button.addEventListener('click', () => openPlayer(project, 0)));
      $('project-grid').append(article);
    });
  }

  function selectEpisodeProject(project) {
    document.querySelectorAll('.episode-project').forEach(button => {
      const active = button.dataset.id === project.id;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $('episode-title').textContent = project.title;
    $('episode-tag').textContent = `${project.tag} / AIGC SHORT DRAMA`;
    $('selection-count').textContent = project.clips[0].label ? '1 部短片' : `${project.clips.length} 集精选`;
    $('clip-grid').replaceChildren();
    project.clips.forEach((clip, index) => {
      const button = document.createElement('button');
      button.className = 'clip-card';
      button.setAttribute('aria-label', `观看《${project.title}》${clipLabel(clip)}`);
      const stillAlt = clip.label ? `${project.title}剧照` : `${project.title}第${clip.number}集剧照`;
      button.innerHTML = `<div class="clip-image"><img src="${clip.still}" alt="${stillAlt}" loading="lazy"><span class="play-icon"></span><span class="clip-duration">${formatTime(clip.seconds)}</span></div><strong>${clipLabel(clip, true)}</strong><small>中文成片 · ${formatTime(clip.seconds)}</small>`;
      button.addEventListener('click', () => openPlayer(project, index));
      $('clip-grid').append(button);
    });
  }

  function setFeatured(index) {
    featuredIndex = (index + featuredProjects.length) % featuredProjects.length;
    const project = featuredProjects[featuredIndex];
    const image = $('hero-image');
    image.src = project.id === 'wolf' ? `assets/${project.id}-poster.jpg` : `assets/${project.id}-wide.jpg`;
    image.alt = `${project.title}作品海报`;
    $('hero-title').textContent = project.title;
    $('hero-index').textContent = String(featuredIndex + 1).padStart(2, '0');
    $('hero-play').setAttribute('aria-label', `观看《${project.title}》`);
  }

  function updateClip(index, attemptPlay = true) {
    currentClipIndex = index;
    const clip = currentProject.clips[index];
    video.pause();
    video.src = clip.file;
    video.poster = clip.still;
    video.load();
    $('player-error').hidden = true;
    $('player-title').textContent = currentProject.title;
    $('player-tag').textContent = `${currentProject.tag} / AI SHORT DRAMA`;
    $('player-episode-label').textContent = `${clipLabel(clip)} · ${formatTime(clip.seconds)} · 中文成片`;
    $('player-note').hidden = Boolean(clip.label);
    $('player-episodes').replaceChildren();
    currentProject.clips.forEach((item, itemIndex) => {
      const button = document.createElement('button');
      button.textContent = clipLabel(item);
      button.setAttribute('aria-pressed', String(itemIndex === index));
      button.addEventListener('click', () => updateClip(itemIndex));
      $('player-episodes').append(button);
    });
    $('prev-clip').disabled = index === 0;
    $('next-clip').disabled = index === currentProject.clips.length - 1;
    $('share-status').textContent = '';
    if (location.protocol !== 'file:') history.replaceState(null, '', `#watch=${currentProject.id}:${clip.number}`);
    if (attemptPlay) video.play().catch(() => {});
  }

  function openPlayer(project, index, attemptPlay = true) {
    if (!dialog.open) {
      returnFocus = document.activeElement;
      dialog.showModal();
      document.body.classList.add('dialog-open');
    }
    currentProject = project;
    updateClip(index, attemptPlay);
  }

  function clearPlayer() {
    video.pause();
    video.removeAttribute('src');
    video.load();
    document.body.classList.remove('dialog-open');
    if (location.protocol !== 'file:' && location.hash.startsWith('#watch=')) history.replaceState(null, '', location.pathname + location.search);
    returnFocus?.focus();
  }

  function readWatchHash() {
    const match = location.hash.match(/^#watch=([a-z]+):(\d+)$/);
    if (!match) return;
    const project = projects.find(item => item.id === match[1]);
    const index = project?.clips.findIndex(clip => clip.number === Number(match[2]));
    if (project && index >= 0) openPlayer(project, index, false);
  }

  document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach(item => {
      item.classList.toggle('active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    renderWorks(button.dataset.filter);
  }));
  projects.forEach((project, index) => {
    const button = document.createElement('button');
    button.className = 'episode-project';
    button.dataset.id = project.id;
    button.innerHTML = `<small>${String(index + 1).padStart(2, '0')}</small><strong>${project.title}</strong>`;
    button.addEventListener('click', () => selectEpisodeProject(project));
    $('episode-projects').append(button);
  });
  $('hero-play').addEventListener('click', () => openPlayer(featuredProjects[featuredIndex], 0));
  $('hero-prev').addEventListener('click', () => setFeatured(featuredIndex - 1));
  $('hero-next').addEventListener('click', () => setFeatured(featuredIndex + 1));
  $('close-player').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', clearPlayer);
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  $('prev-clip').addEventListener('click', () => { if (currentClipIndex > 0) updateClip(currentClipIndex - 1); });
  $('next-clip').addEventListener('click', () => { if (currentClipIndex < currentProject.clips.length - 1) updateClip(currentClipIndex + 1); });
  video.addEventListener('ended', () => { if ($('auto-next').checked && currentClipIndex < currentProject.clips.length - 1) updateClip(currentClipIndex + 1); });
  video.addEventListener('error', () => { if (video.getAttribute('src')) $('player-error').hidden = false; });
  $('share-clip').addEventListener('click', async () => {
    if (location.protocol === 'file:') { $('share-status').textContent = '网站发布后，即可复制本集的在线链接。'; return; }
    const url = new URL(location.href);
    url.hash = `watch=${currentProject.id}:${currentProject.clips[currentClipIndex].number}`;
    try {
      await navigator.clipboard.writeText(url.href);
      $('share-status').textContent = ['localhost', '127.0.0.1', '::1'].includes(location.hostname) ? '本机预览链接已复制。网站发布后，即可对外分享。' : '本集链接已复制。';
    } catch { $('share-status').textContent = '请复制浏览器地址栏中的本集链接。'; }
  });
  window.addEventListener('hashchange', readWatchHash);
  $('copy-wechat').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('wechat-id').textContent); $('contact-status').textContent = '微信号已复制'; }
    catch { $('contact-status').textContent = '请长按或选中上方微信号复制'; }
  });
  renderWorks();
  selectEpisodeProject(projects[0]);
  setFeatured(0);
  readWatchHash();
})();
