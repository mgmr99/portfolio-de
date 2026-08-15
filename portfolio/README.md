# Madhu Ghimire — Portfolio + Blog

A no-build-step portfolio site (plain HTML/CSS/JS) with a working blog:
- `/` — homepage (about, skills, projects, latest posts, contact)
- `/blog.html` — full blog list
- `/post.html?slug=...` — single post view
- `/admin.html` — password-protected page to publish/delete posts
- `/functions/api/...` — Cloudflare Pages Functions (serverless backend) that read/write posts to Cloudflare KV

No database to host, no server to manage — Cloudflare Pages serves the static files **and** runs the API functions.

---

## 0. Before you deploy — fill in your real details

Search the project for these placeholders and replace them:

| Placeholder | Where | Replace with |
|---|---|---|
| `YOUR_EMAIL@example.com` | `index.html` | your real email |
| `YOUR_GITHUB_USERNAME` | `index.html` (nav, contact, project links) | your GitHub username |
| `YOUR_LINKEDIN` | `index.html` | your LinkedIn handle |
| `assets/resume.pdf` | `index.html` (x2) | add your actual resume PDF at `assets/resume.pdf` |

Also double check the project descriptions in the "Projects" section match how you'd want `dbsync` and the daily automation pipeline described publicly — trim anything you consider internal/confidential to Zakipoint before this goes live.

---

## 1. Push the project to GitHub

```bash
cd portfolio
git init
git add .
git commit -m "Initial portfolio site"
gh repo create portfolio --public --source=. --push
```

(No `gh` CLI? Create an empty repo on github.com named `portfolio`, then:)

```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/portfolio.git
git branch -M main
git push -u origin main
```

---

## 2. Connect the repo to Cloudflare Pages

1. Go to the [Cloudflare dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Select your `portfolio` repo.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
4. Click **Save and Deploy**. Cloudflare will give you a live URL like `portfolio-abc.pages.dev` within a minute.

At this point your site is live, but the blog API will return errors — it needs a KV namespace (step 3) and an admin token (step 4).

---

## 3. Create the KV namespace for blog posts

1. In the Cloudflare dashboard: **Workers & Pages** → **KV** → **Create a namespace**.
2. Name it `BLOG_POSTS` (name is just for you — the binding name matters more, see below).
3. Go back to your Pages project → **Settings** → **Functions** → **KV namespace bindings** → **Add binding**.
   - **Variable name:** `BLOG_POSTS` (must match exactly — the code references `env.BLOG_POSTS`)
   - **KV namespace:** the one you just created
4. Save. Redeploy (Cloudflare → your project → **Deployments** → **Retry deployment**, or just push a new commit) so the binding takes effect.

---

## 4. Set your admin token (protects the `/admin.html` posting page)

1. Pages project → **Settings** → **Environment variables**.
2. Add a variable:
   - **Variable name:** `ADMIN_TOKEN`
   - **Value:** any long random string, e.g. generate one with `openssl rand -hex 24`
   - Set it for **Production** (and Preview if you want to test there too).
3. Save and redeploy.

Now go to `https://yoursite.pages.dev/admin.html`, paste that same token into the "Admin token" field, and you can publish posts. **Keep this token private** — treat it like a password. Do not commit it into the repo.

---

## 5. Connect your custom domain

1. Pages project → **Custom domains** → **Set up a custom domain**.
2. Enter your domain (e.g. `madhughimire.com` or a subdomain like `me.yourdomain.com`).
3. If the domain's nameservers are already on Cloudflare, the DNS record is added automatically. If not, Cloudflare will show you the CNAME record to add wherever your domain is registered.
4. Wait for the SSL certificate to provision (usually a few minutes) — then your site is live on your own domain.

---

## 6. Writing posts going forward

- Go to `/admin.html`, enter your token.
- Fill in **Title**, **Excerpt** (shown on the blog list card), and **Body**.
- The body field accepts HTML — use `<h2>` for subheadings, `<p>` for paragraphs, `<pre><code>` for code blocks.
- Click **Publish post**. It appears immediately on `/blog.html` and in the homepage preview.
- Existing posts are listed below the form with a **Delete** button.

Every push to your `main` branch on GitHub automatically redeploys the site — no separate build step, since there's nothing to compile.

---

## 7. Local preview (optional, before pushing)

If you have Node installed:

```bash
npx wrangler pages dev . --kv BLOG_POSTS
```

This runs the site with a local KV emulation so you can test the blog before deploying. Set a local `ADMIN_TOKEN` by adding `--binding ADMIN_TOKEN=your-local-token` to the command, or create a `.dev.vars` file:

```
ADMIN_TOKEN=your-local-token
```

---

## Project structure

```
portfolio/
├── index.html              Homepage
├── blog.html                Blog list
├── post.html                 Single post view
├── admin.html                Post/delete UI (needs ADMIN_TOKEN)
├── css/style.css
├── js/
│   ├── main.js               Nav toggle, homepage blog preview
│   ├── blog.js                Blog list fetch/render
│   ├── post.js                 Single post fetch/render
│   └── admin.js                 Publish/delete logic
├── functions/api/
│   ├── posts/index.js         GET (list) / POST (create)
│   └── posts/[slug].js         GET (one) / DELETE
└── assets/                    Put resume.pdf and any images here
```

## Notes on the blog security model

- Reading posts (`GET /api/posts`, `GET /api/posts/:slug`) is public — that's what makes the blog show up on the site.
- Writing (`POST /api/posts`) and deleting (`DELETE /api/posts/:slug`) require the `Authorization: Bearer <ADMIN_TOKEN>` header, checked against the `ADMIN_TOKEN` environment variable server-side. The token never lives in the repo.
- The admin token is stored in `sessionStorage` in your browser tab only (cleared when you close the tab) — it is never written to a file or committed.
