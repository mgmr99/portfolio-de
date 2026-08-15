const tokenInput = document.getElementById('tokenInput');
const statusEl = document.getElementById('status');
const existingPostsEl = document.getElementById('existingPosts');
const form = document.getElementById('postForm');

// Restore token for this tab only (sessionStorage clears when the tab closes).
const savedToken = sessionStorage.getItem('admin_token');
if (savedToken) {
  tokenInput.value = savedToken;
  loadExistingPosts();
}

tokenInput.addEventListener('change', () => {
  sessionStorage.setItem('admin_token', tokenInput.value);
  loadExistingPosts();
});

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = tokenInput.value.trim();
  if (!token) {
    setStatus('Enter your admin token first.', 'err');
    return;
  }

  const title = document.getElementById('title').value.trim();
  const excerpt = document.getElementById('excerpt').value.trim();
  const body = document.getElementById('body').value.trim();
  const slug = slugify(title);

  setStatus('Publishing…', '');

  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ slug, title, excerpt, body, date: new Date().toISOString() })
    });

    if (res.status === 401) {
      setStatus('Wrong admin token.', 'err');
      return;
    }
    if (!res.ok) throw new Error('Publish failed');

    setStatus(`Published: ${title}`, 'ok');
    form.reset();
    loadExistingPosts();
  } catch (err) {
    setStatus('Something went wrong publishing this post. Check the console.', 'err');
    console.error(err);
  }
});

async function loadExistingPosts() {
  const token = tokenInput.value.trim();
  if (!token) return;

  try {
    const res = await fetch('/api/posts');
    const posts = await res.json();

    if (!posts.length) {
      existingPostsEl.innerHTML = '<p style="color:var(--text-faint);font-family:var(--font-mono);font-size:13px;">No posts yet.</p>';
      return;
    }

    existingPostsEl.innerHTML = posts.map(p => `
      <div class="post-row">
        <span>${p.title} — ${new Date(p.date).toLocaleDateString()}</span>
        <button data-slug="${p.slug}">Delete</button>
      </div>
    `).join('');

    existingPostsEl.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => deletePost(btn.dataset.slug));
    });
  } catch (err) {
    existingPostsEl.innerHTML = '<p style="color:var(--text-faint);font-family:var(--font-mono);font-size:13px;">Could not load posts.</p>';
  }
}

async function deletePost(slug) {
  const token = tokenInput.value.trim();
  if (!confirm(`Delete "${slug}"? This can't be undone.`)) return;

  try {
    const res = await fetch(`/api/posts/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Delete failed');
    loadExistingPosts();
  } catch (err) {
    alert('Could not delete post.');
  }
}

function setStatus(msg, cls) {
  statusEl.textContent = msg;
  statusEl.className = `admin-status ${cls}`;
}
