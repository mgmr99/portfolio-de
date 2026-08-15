document.addEventListener('DOMContentLoaded', loadPost);

async function loadPost() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const body = document.getElementById('postBody');
  const titleEl = document.getElementById('postTitle');
  const dateEl = document.getElementById('postDate');
  const pageTitle = document.getElementById('pageTitle');

  if (!slug) {
    titleEl.textContent = 'Post not found';
    body.innerHTML = '<p>No post specified. <a href="blog.html" class="back-link">Back to blog</a></p>';
    return;
  }

  try {
    const res = await fetch(`/api/posts/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error('Not found');
    const post = await res.json();

    document.title = `${post.title} — Madhu Ghimire`;
    pageTitle.textContent = `${post.title} — Madhu Ghimire`;
    titleEl.textContent = post.title;
    dateEl.textContent = new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    // Body is authored by the site owner via the admin panel (trusted source),
    // so it's rendered as HTML to allow headings, code blocks, etc.
    body.innerHTML = post.body;
  } catch (err) {
    titleEl.textContent = 'Post not found';
    body.innerHTML = '<p>This post doesn\'t exist or couldn\'t be loaded. <a href="blog.html" class="back-link">Back to blog</a></p>';
  }
}
