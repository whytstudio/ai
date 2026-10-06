// Validate local page links, styles, responsive images, and generated media lists.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const failures = new Set();
let checked = 0;
function check(value, from) {
  if (!value || /^(?:data:|mailto:|tel:|https?:|\/\/)/i.test(value)) return;
  const [url, fragment] = value.replaceAll('&amp;', '&').split('#');
  const target = path.resolve(root, path.dirname(from), decodeURIComponent(url.split('?')[0] || path.basename(from)));
  checked++;
  if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) {
    failures.add(`${from}: missing ${value}`);
  } else if (fragment && target.endsWith('.html')) {
    const html = fs.readFileSync(target, 'utf8');
    if (!html.includes(`id="${fragment}"`)) failures.add(`${from}: missing anchor ${value}`);
  }
}
function srcset(value, from) {
  for (const item of value.split(',')) check(item.trim().split(/\s+/)[0], from);
}
const pages = fs.readdirSync(root).filter(file => file.endsWith('.html'));
for (const file of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of html.matchAll(/(?:src|href|poster|data-portfolio)="([^"]+)"/g)) check(match[1], file);
  for (const match of html.matchAll(/srcset="([^"]+)"/g)) srcset(match[1], file);
}
for (const file of fs.readdirSync(path.join(root, 'css'))) {
  const css = fs.readFileSync(path.join(root, 'css', file), 'utf8');
  for (const match of css.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)) check(match[1], `css/${file}`);
}
const context = { window: {} };
for (const file of ['portfolio/service-videos.js', 'portfolio/creative-image/projects.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
for (const [page, videos] of Object.entries(context.window.SERVICE_VIDEO_PORTFOLIOS)) {
  check(page, 'index.html');
  for (const video of videos) {
    check(video.src, page);
    check(video.poster, page);
  }
}
const images = JSON.parse(fs.readFileSync(path.join(root, 'portfolio/creative-image/projects.json'), 'utf8'));
if (JSON.stringify(images) !== JSON.stringify(context.window.CREATIVE_IMAGE_PORTFOLIO)) failures.add('Creative image JS and JSON manifests differ');
for (const project of images.projects) {
  check(project.cover, 'index.html');
  for (const image of project.images) {
    for (const key of ['src', 'original', 'thumbnail', 'preview']) check(image[key], 'index.html');
    srcset(image.srcset, 'index.html');
  }
}
for (const [input, output] of Object.entries(require('./site-image-sources.json'))) {
  check(input, 'index.html');
  check(output, 'index.html');
}
for (const icon of JSON.parse(fs.readFileSync(path.join(root, 'site.webmanifest'), 'utf8')).icons) check(icon.src, 'index.html');
for (const file of ['sitemap.xml', 'image-sitemap.xml']) {
  const xml = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of xml.matchAll(/<(?:image:)?loc>https:\/\/whyt\.studio\/([^<]*)<\//g)) check(match[1] || 'index.html', 'index.html');
}
if (failures.size) {
  console.error([...failures].join('\n'));
  process.exitCode = 1;
} else console.log(`Verified ${pages.length} pages and ${checked} local references, including all portfolio media and build inputs.`);
