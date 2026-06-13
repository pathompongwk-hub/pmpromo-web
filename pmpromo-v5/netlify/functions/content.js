const fs = require('fs');
const path = require('path');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { data: {}, body: content };
  const data = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) {
      data[key.trim()] = rest.join(':').trim().replace(/^["']|["']$/g, '');
    }
  }
  return { data, body: content.slice(match[0].length).trim() };
}

exports.handler = async function(event) {
  const type = event.path.split('/')[2] || 'posts';
  const dirs = { posts: '_posts', artworks: '_artworks', videos: '_videos', seo: '_seo' };
  const dir = dirs[type] || '_posts';
  const fullPath = path.join(process.cwd(), dir);
  
  try {
    if (!fs.existsSync(fullPath)) return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: '[]' };
    const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.md') || f.endsWith('.json'));
    const items = files.map(file => {
      const content = fs.readFileSync(path.join(fullPath, file), 'utf8');
      if (file.endsWith('.json')) return JSON.parse(content);
      const { data, body } = parseFrontmatter(content);
      return { ...data, body, slug: file.replace(/\.md$/, '') };
    }).filter(Boolean);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(items) };
  } catch(e) {
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: '[]' };
  }
};
