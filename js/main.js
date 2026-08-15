// Shared behavior across all pages: mobile nav toggle, footer year,
// and (on the homepage) fetching the latest posts for the preview grid.

document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  const previewGrid = document.getElementById('blogPreviewGrid');
  if (previewGrid) loadBlogPreview(previewGrid);
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return '';
  }
}

async function loadBlogPreview(container) {
  try {
    const res = await fetch('/api/posts');
    if (!res.ok) throw new Error('Failed to load posts');
    const posts = await res.json();

    if (!posts.length) {
      container.innerHTML = '<div class="empty-state">No posts yet — first one\'s coming soon.</div>';
      return;
    }

    const latest = posts.slice(0, 3);
    container.innerHTML = latest.map(postCardHtml).join('');
  } catch (err) {
    container.innerHTML = '<div class="empty-state">Blog is not connected yet. Once deployed with a KV namespace, posts will show here.</div>';
  }
}

function postCardHtml(post) {
  return `
    <a class="post-card" href="post.html?slug=${encodeURIComponent(post.slug)}">
      <span class="post-date">${formatDate(post.date)}</span>
      <h3>${escapeHtml(post.title)}</h3>
      <p>${escapeHtml(post.excerpt || '')}</p>
      <span class="post-read">Read post →</span>
    </a>
  `;
}
