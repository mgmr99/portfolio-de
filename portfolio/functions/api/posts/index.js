// GET  /api/posts      -> list all posts (newest first), public
// POST /api/posts      -> create a post, requires Authorization: Bearer <ADMIN_TOKEN>
//
// Storage: Cloudflare KV namespace bound as BLOG_POSTS.
// Each post is stored as key "post:<slug>" with a JSON value.
// A separate key "post-index" stores an ordered array of slugs so listing
// doesn't require an expensive KV "list" scan.

export async function onRequestGet(context) {
  const { env } = context;
  const posts = await getAllPosts(env);
  return json(posts);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const authError = checkAuth(request, env);
  if (authError) return authError;

  let data;
  try {
    data = await request.json();
  } catch (e) {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { title, excerpt, body } = data;
  let { slug, date } = data;

  if (!title || !body) {
    return json({ error: 'title and body are required' }, 400);
  }
  if (!slug) {
    slug = title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
  }
  if (!date) {
    date = new Date().toISOString();
  }

  const post = { slug, title, excerpt: excerpt || '', body, date };

  await env.BLOG_POSTS.put(`post:${slug}`, JSON.stringify(post));

  const index = await getIndex(env);
  if (!index.includes(slug)) {
    index.unshift(slug);
    await env.BLOG_POSTS.put('post-index', JSON.stringify(index));
  }

  return json(post, 201);
}

async function getIndex(env) {
  const raw = await env.BLOG_POSTS.get('post-index');
  return raw ? JSON.parse(raw) : [];
}

async function getAllPosts(env) {
  const index = await getIndex(env);
  const posts = await Promise.all(
    index.map(async (slug) => {
      const raw = await env.BLOG_POSTS.get(`post:${slug}`);
      return raw ? JSON.parse(raw) : null;
    })
  );
  return posts.filter(Boolean).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function checkAuth(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
    return json({ error: 'Unauthorized' }, 401);
  }
  return null;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
