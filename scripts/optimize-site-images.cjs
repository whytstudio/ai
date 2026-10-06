const fs = require('node:fs/promises');
const path = require('node:path');
const { webp } = require('./image-utils.cjs');
const root = path.resolve(__dirname, '..');

async function main() {
  const portfolio = JSON.parse(await fs.readFile(path.join(root, 'portfolio/creative-image/projects.json'), 'utf8'));
  const lumera = portfolio.projects.flatMap(project => project.images)
    .find(asset => decodeURIComponent(asset.original) === 'Creative Image/Lumera/lumera-vitamin-c-serum-glow-orange-slices.webp');
  if (!lumera) throw new Error('Build the Creative Image portfolio first.');
  const mapPath = path.join(__dirname, 'site-image-sources.json');
  const mapping = JSON.parse(await fs.readFile(mapPath, 'utf8').catch(() => '{}'));
  const pages = (await fs.readdir(root)).filter(file => file.endsWith('.html'));
  for (const file of pages) {
    const pagePath = path.join(root, file);
    let html = await fs.readFile(pagePath, 'utf8');
    for (const match of html.matchAll(/poster="([^"]+)"/g)) {
      const sourceURL = match[1];
      if (Object.values(mapping).includes(sourceURL)) continue;
      const source = path.join(root, decodeURIComponent(sourceURL));
      const stat = await fs.stat(source);
      if (/\.webp$/i.test(source) && stat.size <= 100 * 1024) continue;
      const outputURL = `marketing/optimized/${path.parse(source).name}.webp`;
      await webp(source, path.join(root, outputURL), 720);
      mapping[sourceURL] = outputURL;
    }
    for (const [source, output] of Object.entries(mapping)) {
      await webp(path.join(root, decodeURIComponent(source)), path.join(root, output), 720);
      html = html.split(`poster="${source}"`).join(`poster="${output}"`);
    }
    html = html.replace(/<img\b[^>]*class="(?:hero-card-image|make-image-contain)"[^>]*>/g, tag => {
      const hero = tag.includes('hero-card-image');
      const sizes = hero ? '(max-width:768px) 135px, (max-width:992px) 160px, 215px' : '(max-width:480px) calc(100vw - 32px), (max-width:880px) 420px, (max-width:1200px) 30vw, 380px';
      return `<img class="${hero ? 'hero-card-image' : 'make-image-contain'}" src="${lumera.preview}" srcset="${lumera.srcset}" sizes="${sizes}" width="${lumera.width}" height="${lumera.height}" alt="${lumera.alt}" loading="${hero ? 'eager' : 'lazy'}" decoding="async"/>`;
    });
    await fs.writeFile(pagePath, html);
  }
  await fs.writeFile(mapPath, JSON.stringify(mapping, null, 2) + '\n');
  const assets = portfolio.projects.flatMap(project => project.images.flatMap(image => image.srcset.split(', ').map(entry => entry.split(' ')[0])));
  const unique = [...new Set([...assets, ...Object.values(mapping)])];
  let total = 0, small = 0;
  for (const asset of unique) { const stat = await fs.stat(path.join(root, decodeURIComponent(asset))); total += stat.size; if (stat.size <= 100 * 1024) small++; }
  console.log(`${unique.length} WebP assets: ${small} under 100 KB; ${(total / 1024 / 1024).toFixed(2)} MB including full-size viewer images. Originals retained.`);
  for (const project of portfolio.projects) {
    const stat = await fs.stat(path.join(root, project.images[0].preview));
    console.log(`${project.name} card preview: ${(stat.size / 1024).toFixed(1)} KB`);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
