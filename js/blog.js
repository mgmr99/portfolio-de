document.addEventListener('DOMContentLoaded', loadFullBlog);

async function loadFullBlog() {
  const grid = document.getElementById('blogGrid');
  try {
    const res = await fetch('/api/posts');
    if (!res.ok) throw new Error('Failed to load posts');
    const posts = await res.json();

    if (!posts.length) {
      grid.innerHTML = '<div class="empty-state">No posts yet — first one\'s coming soon.</div>';
      return;
    }

    grid.innerHTML = posts.map(postCardHtml).join('');
  } catch (err) {
    grid.innerHTML = '<div class="empty-state">Couldn\'t load posts. If you just deployed, make sure the BLOG_POSTS KV namespace is bound in your Cloudflare Pages settings.</div>';
  }
}
