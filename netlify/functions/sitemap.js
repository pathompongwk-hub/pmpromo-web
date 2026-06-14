const fs = require('fs');
const path = require('path');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const data = {};
  match[1].split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) data[key.trim()] = rest.join(':').trim().replace(/^["']|["']$/g, '');
  });
  return data;
}

exports.handler = async function(event) {
  const baseUrl = 'https://pm-promo.netlify.app';
  const postsDir = path.join(process.cwd(), '_posts');

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/blog.html', priority: '0.9', changefreq: 'daily' },
    { url: '/artwork.html', priority: '0.8', changefreq: 'weekly' },
    { url: '/video.html', priority: '0.8', changefreq: 'weekly' },
    { url: '/seo.html', priority: '0.8', changefreq: 'weekly' },
  ];

  let postUrls = [];
  try {
    if (fs.existsSync(postsDir)) {
      const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
      postUrls = files.map(file => {
        const content = fs.readFileSync(path.join(postsDir, file), 'utf8');
        const data = parseFrontmatter(content);
        const slug = data.slug || file.replace(/\.md$/, '');
        const date = data.date ? data.date.split('T')[0] : new Date().toISOString().split('T')[0];
        return { url: `/post.html?slug=${slug}`, priority: '0.7', changefreq: 'monthly', lastmod: date };
      });
    }
  } catch(e) {}

  const allPages = [...staticPages, ...postUrls];
  const today = new Date().toISOString().split('T')[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(p => `  <url>
    <loc>${baseUrl}${p.url}</loc>
    <lastmod>${p.lastmod || today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
    body: xml
  };
};
