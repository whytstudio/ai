/** Convert supplied images and discover every project in the public portfolio folders. */
const fs = require('node:fs/promises');
const path = require('node:path');
const cp = require('node:child_process');
let sharp = null;
try {
  sharp = require('sharp');
} catch {}
const { createHash } = require('node:crypto');
const { variants } = require('./image-utils.cjs');
const descriptions = require('./image-descriptions.json');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'Creative Image');
const outputRoot = path.join(root, 'portfolio', 'creative-image');
const supported = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif']);
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
const slug = name => name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const url = (...parts) => parts.map(part => encodeURIComponent(part)).join('/');

async function main() {
  await fs.mkdir(outputRoot, { recursive: true });
  const folders = await fs.readdir(sourceRoot, { withFileTypes: true }).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  const sourceFolders = folders.filter(item => item.isDirectory()).sort((a, b) => collator.compare(a.name, b.name));
  const sourceNames = new Map();
  const usedSlugs = new Set();
  const originals = new Map();

  for (const folder of sourceFolders) {
    const projectSlug = slug(folder.name);
    if (!projectSlug || usedSlugs.has(projectSlug)) throw new Error(`Project folder name is not unique: ${folder.name}`);
    usedSlugs.add(projectSlug);
    sourceNames.set(projectSlug, folder.name);
    const sourceDirectory = path.join(sourceRoot, folder.name);
    const files = (await fs.readdir(sourceDirectory, { withFileTypes: true }))
      .filter(item => item.isFile() && supported.has(path.extname(item.name).toLowerCase()))
      .sort((a, b) => collator.compare(a.name, b.name));
    if (!files.length) continue;

    const projectDirectory = path.join(outputRoot, projectSlug);
    await fs.mkdir(projectDirectory, { recursive: true });
    for (let index = 0; index < files.length; index++) {
      const source = path.join(sourceDirectory, files[index].name);
      const targetName = files[index].name;
      const target = path.join(projectDirectory, targetName);
      const relativeSource = path.relative(root, source).split(path.sep).join('/');
      originals.set(target, { source, original: url(...relativeSource.split('/')), alt: descriptions[relativeSource] });
      const sourceStat = await fs.stat(source);
      const targetStat = await fs.stat(target).catch(() => null);
      if (!targetStat || targetStat.mtimeMs < sourceStat.mtimeMs) {
        if (sharp) {
          await sharp(source).rotate().webp({ quality: 88, effort: 5 }).toFile(target);
        } else {
          cp.execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', source, '-c:v', 'libwebp', '-quality', '88', target]);
        }
      }
    }
  }

  // The public folders are the source of truth for the page. A new folder of
  // web-ready images is included by the next build without changing page code.
  const publicFolders = (await fs.readdir(outputRoot, { withFileTypes: true }))
    .filter(item => item.isDirectory()).sort((a, b) => collator.compare(a.name, b.name));
  const projects = [];
  for (const folder of publicFolders) {
    const projectDirectory = path.join(outputRoot, folder.name);
    const files = (await fs.readdir(projectDirectory, { withFileTypes: true }))
      .filter(item => item.isFile() && supported.has(path.extname(item.name).toLowerCase()))
      .sort((a, b) => collator.compare(a.name, b.name));
    if (!files.length) continue;
    const images = [];
    const hashes = new Set();
    const customDescriptions = JSON.parse(await fs.readFile(path.join(projectDirectory, 'descriptions.json'), 'utf8').catch(() => '{}'));
    for (const file of files) {
      const fullPath = path.join(projectDirectory, file.name);
      const hash = createHash('sha256').update(await fs.readFile(fullPath)).digest('hex');
      if (hashes.has(hash)) continue;
      hashes.add(hash);
      const sourceInfo = originals.get(fullPath);
      const src = url('portfolio', 'creative-image', folder.name, file.name);
      const responsive = await variants(sourceInfo?.source || fullPath, path.join(projectDirectory, 'responsive'),
        path.parse(file.name).name, url('portfolio', 'creative-image', folder.name, 'responsive'));
      const alt = sourceInfo?.alt || customDescriptions[file.name] ||
        `${sourceNames.get(folder.name) || folder.name} — ${path.parse(file.name).name.replace(/[-_]+/g, ' ')}`;
      if (!sourceInfo?.alt && !customDescriptions[file.name]) console.warn(`Add an image description in ${folder.name}/descriptions.json for ${file.name}`);
      images.push({ src, original: sourceInfo?.original || src, width: responsive.width, height: responsive.height, alt,
        thumbnail: responsive.entries[0]?.src || src,
        preview: responsive.entries.find(entry => entry.width === 320)?.src || src,
        srcset: [...responsive.entries, { src, width: responsive.width }].map(entry => `${entry.src} ${entry.width}w`).join(', ') });
    }
    const name = sourceNames.get(folder.name) || folder.name.replace(/[-_]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
    projects.push({ slug: folder.name, name, cover: images[0].src, images });
  }

  const manifest = { projects };
  const manifestJSON = JSON.stringify(manifest, null, 2);
  await fs.writeFile(path.join(outputRoot, 'projects.json'), manifestJSON + '\n');
  // A classic script also works when Chrome opens the HTML directly via file://.
  await fs.writeFile(path.join(outputRoot, 'projects.js'), `window.CREATIVE_IMAGE_PORTFOLIO = ${manifestJSON};\n`);
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const cards = projects.map((project, index) => {
    const cover = project.images[0];
    return `<article class="ugc-card creative-project-card" aria-labelledby="creative-project-${escape(project.slug)}">
      <div class="ugc-media"><a class="creative-project-trigger" href="${escape(cover.src)}" data-project-slug="${escape(project.slug)}" aria-haspopup="dialog" aria-label="View ${escape(project.name)} creative images">
        <img src="${escape(cover.preview)}" srcset="${escape(cover.srcset)}" sizes="(max-width:560px) 260px, (max-width:768px) 276px, (max-width:1000px) 30vw, 255px" width="${cover.width}" height="${cover.height}" alt="${escape(cover.alt)}" loading="${index < 4 ? 'eager' : 'lazy'}" decoding="async"/>
        <span class="creative-project-badge">${project.images.length} IMAGES</span><span class="creative-project-hint">View project ↗</span></a></div>
      <div class="ugc-card-meta"><div><p class="ugc-category">Creative Images</p><h3 id="creative-project-${escape(project.slug)}">${escape(project.name)}<span> / ${project.images.length} images</span></h3></div><span class="ugc-index">${String(index + 1).padStart(2, '0')}</span></div></article>`;
  }).join('\n');
  const pagePath = path.join(root, 'creative-image-portfolio.html');
  const page = await fs.readFile(pagePath, 'utf8');
  await fs.writeFile(pagePath, page.replace(/<!-- creative-projects:start -->[\s\S]*?<!-- creative-projects:end -->/, `<!-- creative-projects:start -->\n${cards}\n<!-- creative-projects:end -->`)
    .replace(/(id="creative-project-count">)[^<]*/, `$1${String(projects.length).padStart(2, '0')}`)
    .replace(/(id="creative-project-status" role="status">)[^<]*/, `$1${projects.length} project collections · ${projects.reduce((sum, project) => sum + project.images.length, 0)} images`));
  const pageImages = projects.flatMap(project => project.images).map(asset => `<image:image><image:loc>https://whyt.studio/${escape(asset.src)}</image:loc></image:image>`).join('\n');
  await fs.writeFile(path.join(root, 'image-sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"><url><loc>https://whyt.studio/creative-image-portfolio.html</loc>\n${pageImages}\n</url></urlset>\n`);
  console.log(`Creative Image portfolio: ${projects.length} projects, ${projects.reduce((count, project) => count + project.images.length, 0)} images.`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
