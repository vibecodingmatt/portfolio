import { projects, featuredId } from './projects.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let featureIndex = projects.findIndex((p) => p.id === featuredId);
let dialogIndex = -1;
let featureRevision = 0;
let restoreFocus = null;
let modalOwnsHistory = false;
let mediaRevision = 0;
const dialog = $('#project-dialog');

function setFeature(index, focusSelector = false) {
  featureIndex = (index + projects.length) % projects.length;
  const p = projects[featureIndex];
  $('#feature').dataset.project = p.id;
  const revision = ++featureRevision;
  $('#feature-name').textContent =
    p.title.toUpperCase() + (p.edition ? ` / ${p.edition.toUpperCase()}` : '');
  $('#feature-title').replaceChildren(
    ...p.headline
      .split('\n')
      .flatMap((line, i) =>
        i
          ? [document.createElement('br'), document.createTextNode(line)]
          : [document.createTextNode(line)],
      ),
  );
  $('#feature-description').textContent = p.description;
  $('#feature-platform').textContent = p.platform.toUpperCase();
  $('#feature').style.setProperty('--feature-color', p.color);
  $('#feature-launch').href = p.url || p.source;
  $('#feature-launch').innerHTML =
    `${esc(p.action)} <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span>`;
  $('#feature-preview').dataset.open = p.id;
  $('#feature-preview').innerHTML =
    `<span aria-hidden="true">${p.preview ? '▷' : '+'}</span> ${p.preview ? 'Take a peek' : 'The details'}`;
  $('#feature-credit').textContent =
    p.imageLabel.toUpperCase() + (p.preview ? ' · PREVIEW INSIDE' : '');
  $('#feature-number').innerHTML =
    `${String(featureIndex + 1).padStart(2, '0')} <span>/ ${String(projects.length).padStart(2, '0')}</span>`;
  const image = new Image();
  image.src = p.image;
  image.onload = () => {
    if (revision !== featureRevision) return;
    $('#feature-image').src = p.image;
    $('#feature-image').alt = p.alt;
    if (!reducedMotion.matches)
      $('#feature-image').animate([{ opacity: 0.3 }, { opacity: 1 }], {
        duration: 300,
        easing: 'ease-out',
      });
  };
  $$('.selector-item').forEach((button) =>
    button.setAttribute('aria-pressed', String(button.dataset.feature === p.id)),
  );
  const active = $(`[data-feature="${p.id}"]`);
  const selector = $('#project-selector');
  if (selector.scrollWidth > selector.clientWidth)
    selector.scrollTo({
      left: Math.max(0, active.offsetLeft - selector.offsetLeft - 10),
      behavior: reducedMotion.matches ? 'instant' : 'smooth',
    });
  if (focusSelector) active.focus({ preventScroll: true });
}

$('#feature-prev').addEventListener('click', () => setFeature(featureIndex - 1));
$('#feature-next').addEventListener('click', () => setFeature(featureIndex + 1));
$('#project-selector').addEventListener('click', (event) => {
  const button = event.target.closest('[data-feature]');
  if (button) setFeature(projects.findIndex((p) => p.id === button.dataset.feature));
});
$('#project-selector').addEventListener('keydown', (event) => {
  if (!event.target.closest('[data-feature]')) return;
  const index = projects.findIndex(
    (p) => p.id === event.target.closest('[data-feature]').dataset.feature,
  );
  const next = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: projects.length - 1 }[
    event.key
  ];
  if (next !== undefined) {
    event.preventDefault();
    setFeature(next, true);
  }
});

$$('[data-filter]').forEach((button) =>
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    $$('[data-filter]').forEach((b) => {
      const active = b === button;
      b.setAttribute('aria-pressed', String(active));
      b.classList.toggle('active', active);
    });
    $$('.project-card').forEach((card) => {
      card.hidden = filter !== 'all' && card.dataset.category !== filter;
    });
    const count = $$('.project-card:not([hidden])').length;
    $('#filter-status').textContent =
      `Showing ${count} ${count === 1 ? 'project' : 'projects'}${filter === 'all' ? ' across all work' : ` in ${button.textContent.replace(/\d/g, '').trim()}`}.`;
  }),
);

function stopMedia() {
  mediaRevision++;
  const video = dialog.querySelector('video');
  if (video) {
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.remove();
  }
}

function renderDialog(index) {
  stopMedia();
  dialogIndex = (index + projects.length) % projects.length;
  const p = projects[dialogIndex];
  $('#dialog-kicker').textContent =
    `${String(dialogIndex + 1).padStart(2, '0')} / SELECTED WORK · ${p.platform.toUpperCase()}`;
  $('#dialog-content').innerHTML = `
    <div class="dialog-heading"><div><h2 id="dialog-title">${esc(p.title)}${p.edition ? `<small>${esc(p.edition)}</small>` : ''}</h2><p>${esc(p.hook)}</p></div><span class="tag">${esc(p.type)}</span></div>
    <div class="dialog-media"><img src="${p.image}" alt="${esc(p.alt)}" width="1600" height="900">${p.preview ? `<button class="preview-start" aria-label="Play silent preview of ${esc(p.title)}"><span aria-hidden="true">▷</span></button>` : ''}</div>
    <div class="preview-caption"><span id="media-label">${esc(p.imageLabel.toUpperCase())}</span><span>${p.preview ? 'SHORT PREVIEW · SOUND OFF' : 'A CLOSER LOOK AT THE PROJECT'}</span></div>
    <div class="dialog-layout"><div class="dialog-overview"><h3>THE IDEA</h3><p>${esc(p.challenge)}</p><h3>THE CRAFT</h3><p>${esc(p.craft)}</p></div><div><div class="dialog-stats">${p.facts.map(([number, label]) => `<div><strong>${esc(number)}</strong><span>${esc(label)}</span></div>`).join('')}</div><div class="dialog-tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div><div class="dialog-actions"><a class="button button-accent" href="${p.url || p.source}" target="_blank" rel="noopener noreferrer">${esc(p.action)} <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>${p.source ? `<a class="button button-outline" href="${p.source}" target="_blank" rel="noopener noreferrer">View source <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>` : ''}</div><p class="dialog-notice">${esc(p.notice)}</p><button class="share-button">Copy project link ↗</button><p id="share-status" class="sr-only" role="status"></p></div></div>`;
  $('#dialog-count').textContent =
    `${String(dialogIndex + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`;
  dialog.querySelector('.preview-start')?.addEventListener('click', () => playPreview(p));
  dialog.querySelector('.share-button').addEventListener('click', copyProjectLink);
  dialog.scrollTo({ top: 0, behavior: 'instant' });
}

async function playPreview(p, { focus = true } = {}) {
  if (!p.preview || dialogIndex !== projects.indexOf(p)) return;
  const revision = ++mediaRevision;
  const media = dialog.querySelector('.dialog-media');
  if (media.querySelector('video')) return;
  const play = media.querySelector('.preview-start');
  play.disabled = true;
  play.setAttribute('aria-label', 'Loading silent preview');
  const video = document.createElement('video');
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.controls = true;
  video.loop = true;
  video.setAttribute('aria-label', `Silent visual preview of ${p.title}`);
  video.poster = p.image;
  video.src = p.preview;
  media.append(video);
  const failed = () => {
    if (revision !== mediaRevision) return;
    video.remove();
    play.hidden = false;
    play.disabled = false;
    play.setAttribute('aria-label', `Retry preview of ${p.title}`);
    if (!media.querySelector('.media-fallback')) {
      const notice = document.createElement('p');
      notice.className = 'media-fallback';
      notice.setAttribute('role', 'status');
      notice.textContent =
        'This preview could not load. You can still launch the full experience below.';
      media.append(notice);
    }
  };
  video.addEventListener('error', failed, { once: true });
  try {
    await video.play();
    if (revision !== mediaRevision) return;
    play.hidden = true;
    media.querySelector('.media-fallback')?.remove();
    $('#media-label').textContent = p.previewLabel.toUpperCase();
    if (focus) video.focus({ preventScroll: true });
  } catch (error) {
    if (revision === mediaRevision) failed();
  }
}

function openProject(id, { historyMode = 'push', opener = null } = {}) {
  const index = projects.findIndex((p) => p.id === id);
  if (index < 0) return;
  const alreadyOpen = dialog.open;
  if (!alreadyOpen) restoreFocus = opener || document.activeElement;
  renderDialog(index);
  if (!alreadyOpen) {
    dialog.showModal();
    document.body.classList.add('modal-open');
  }
  $('.dialog-close').focus({ preventScroll: true });
  if (projects[index].preview && !reducedMotion.matches && !navigator.connection?.saveData)
    playPreview(projects[index], { focus: false });
  if (historyMode === 'push') {
    const url = new URL(location.href);
    url.hash = `project=${id}`;
    if (alreadyOpen) history.replaceState(history.state, '', url);
    else {
      history.pushState({ portfolioDialog: true }, '', url);
      modalOwnsHistory = true;
    }
  }
}

function finishClose() {
  stopMedia();
  if (dialog.open) dialog.close();
  document.body.classList.remove('modal-open');
  dialogIndex = -1;
  if (restoreFocus instanceof HTMLElement && restoreFocus.isConnected)
    restoreFocus.focus({ preventScroll: true });
  restoreFocus = null;
}

function closeProject() {
  finishClose();
  if (modalOwnsHistory) {
    modalOwnsHistory = false;
    history.back();
  } else if (location.hash.startsWith('#project=')) {
    const url = new URL(location.href);
    url.hash = 'work';
    history.replaceState(null, '', url);
  }
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-open]');
  if (button) openProject(button.dataset.open, { opener: button });
});
$('.dialog-close').addEventListener('click', closeProject);
dialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeProject();
});
let pointerStartedOutside = false;
dialog.addEventListener('pointerdown', (event) => {
  const r = dialog.getBoundingClientRect();
  pointerStartedOutside =
    event.clientX < r.left ||
    event.clientX > r.right ||
    event.clientY < r.top ||
    event.clientY > r.bottom;
});
dialog.addEventListener('click', (event) => {
  const r = dialog.getBoundingClientRect();
  if (
    event.target === dialog &&
    pointerStartedOutside &&
    (event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom)
  )
    closeProject();
  pointerStartedOutside = false;
});
$('#dialog-previous').addEventListener('click', () =>
  openProject(projects[(dialogIndex - 1 + projects.length) % projects.length].id),
);
$('#dialog-next').addEventListener('click', () =>
  openProject(projects[(dialogIndex + 1) % projects.length].id),
);

function syncHash() {
  const id = location.hash.startsWith('#project=') ? location.hash.slice(9) : '';
  if (projects.some((p) => p.id === id)) {
    modalOwnsHistory = Boolean(history.state?.portfolioDialog);
    openProject(id, { historyMode: 'none' });
  } else if (dialog.open) {
    modalOwnsHistory = false;
    finishClose();
  }
}
window.addEventListener('popstate', syncHash);
window.addEventListener('hashchange', () => {
  const id = location.hash.slice(9);
  if (dialogIndex < 0 || projects[dialogIndex].id !== id) syncHash();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) dialog.querySelector('video')?.pause();
});

async function copyProjectLink() {
  const url = new URL(location.href);
  url.hash = `project=${projects[dialogIndex].id}`;
  try {
    await navigator.clipboard.writeText(url.href);
    $('#share-status').textContent = 'Project link copied.';
    dialog.querySelector('.share-button').textContent = 'Link copied ✓';
  } catch {
    $('#share-status').textContent = 'Copy the selected project link below.';
    let input = dialog.querySelector('.share-field');
    if (!input) {
      input = document.createElement('input');
      input.className = 'share-field';
      input.readOnly = true;
      input.setAttribute('aria-label', 'Project link to copy');
      dialog.querySelector('.share-button').after(input);
    }
    input.value = url.href;
    input.focus();
    input.select();
  }
}
syncHash();
