import { projects, featuredId } from '../projects.js';
export const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export function renderIndex(template) {
  const selectors = projects
    .map(
      (p) =>
        `<button class="selector-item" data-feature="${p.id}" aria-pressed="${p.id === featuredId}" aria-label="Feature ${escapeHtml(p.title)}${p.edition ? ' ' + escapeHtml(p.edition) : ''}"><img src="./${p.thumbnail}" alt="" width="72" height="48" loading="lazy"><span><strong>${escapeHtml(p.title)}</strong><small>${escapeHtml(p.id === 'rex-encounter' ? 'Rex: Pursuit' : p.edition || p.platform)}</small></span></button>`,
    )
    .join('\n');
  const cards = projects
    .map(
      (
        p,
        i,
      ) => `<article class="project-card" data-category="${p.category}" data-project="${p.id}" aria-labelledby="title-${p.id}">
    <div class="card-visual"><button class="card-media-button" data-open="${p.id}" aria-label="Preview ${escapeHtml(p.title)}${p.edition ? ' ' + escapeHtml(p.edition) : ''}"><img class="card-image" src="./${p.thumbnail}" alt="${escapeHtml(p.alt)}" width="720" height="450" loading="lazy"><span class="card-type">${escapeHtml(p.platform)}</span><span class="card-preview"><span aria-hidden="true">${p.preview ? '▷' : '+'}</span> ${p.preview ? 'Take a peek' : 'Explore project'}</span><span class="card-number" aria-hidden="true">${String(i + 1).padStart(2, '0')} /</span></button><img class="card-static-image card-image" src="./${p.thumbnail}" alt="${escapeHtml(p.alt)}" loading="lazy" width="720" height="450"></div>
    <div class="card-heading"><h3 id="title-${p.id}">${escapeHtml(p.title)}${p.edition ? `<span class="card-edition">${escapeHtml(p.edition)}</span>` : ''}</h3><a class="card-outbound" href="${p.url || p.source}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(p.action)}: ${escapeHtml(p.title)} ${escapeHtml(p.edition)} (opens in a new tab)">↗</a></div>
    <p class="card-description">${escapeHtml(p.description)}</p><div class="card-meta"><div class="card-tags">${p.tags.map((t) => `<span>${escapeHtml(t)}</span>`).join('')}</div><button class="card-details-button" data-open="${p.id}" aria-label="View details for ${escapeHtml(p.title)} ${escapeHtml(p.edition)}">The details <span aria-hidden="true">↗</span></button></div>
  </article>`,
    )
    .join('\n');
  return template
    .replace('<!-- PROJECT_SELECTOR -->', selectors)
    .replace('<!-- PROJECT_CARDS -->', cards);
}
