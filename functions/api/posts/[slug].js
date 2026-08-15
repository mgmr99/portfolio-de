// GET    /api/posts/:slug  -> fetch one post, public
// DELETE /api/posts/:slug  -> delete a post, requires Authorization: Bearer <ADMIN_TOKEN>

export async function onRequestGet(context) {
  const { env, params } = context;
  const raw = await env.BLOG_POSTS.get(`post:${params.slug}`);
  if (!raw) return json({ error: 'Not found' }, 404);
  return json(JSON.parse(raw));
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;

  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
    return json({ error: 'Unauthorized' }, 401);
  }

  await env.BLOG_POSTS.delete(`post:${params.slug}`);

  const raw = await env.BLOG_POSTS.get('post-index');
  const index = raw ? JSON.parse(raw) : [];
  const updated = index.filter((s) => s !== params.slug);
  await env.BLOG_POSTS.put('post-index', JSON.stringify(updated));

  return json({ deleted: params.slug });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
