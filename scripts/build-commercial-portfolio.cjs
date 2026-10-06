// Reuse the Hyper Motion page and shared player; keep original video files intact.
// Run with Node; ffprobe and ffmpeg must be available on PATH.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const folder = 'AI Commercial Video Ads';
const output = 'ai-commercial-video-ads-portfolio.html';
const posterDir = 'marketing/commercial-ads';
const escape = text => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const projects = {
  'Brillo 100ml Face Wash Product Commercial Video': ['Brillo', 'Face Wash · 100ml', 'Skincare'],
  'Cafe Commercial Video': ['Cafe', 'Commercial Film', 'Food & drink'],
  'Cafe Creative Commercial Video': ['Cafe', 'Creative Commercial Film', 'Food & drink'],
  'HoodX Fashion Commercial Video': ['HoodX', 'Fashion', 'Fashion'],
  'HoodX White Hoodie Commercial Video': ['HoodX', 'White Hoodie', 'Fashion'],
  'Niva Fashion Commercial Video': ['Niva', 'Fashion', 'Fashion'],
  'Protein Bar Product Commercial Video': ['Protein Bar', 'Product Commercial', 'Nutrition']
};
const template = fs.readFileSync(path.join(root, 'product-hyper-motion-portfolio.html'), 'utf8');
const cardTemplate = template.match(/          <article class="ugc-card"[\s\S]*?<\/article>/)[0];
fs.mkdirSync(path.join(root, posterDir), { recursive: true });
const files = fs.readdirSync(path.join(root, folder)).filter(file => Boolean(projects[path.parse(file).name])).sort();
if (!files.length) throw new Error('No commercial videos found.');
const metadata = new Map(files.map(file => [file, JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', path.join(root, folder, file)], { encoding: 'utf8' }))]));
// Match the reference collection: portrait films first, followed by wide films.
const landscape = file => { const { width, height } = metadata.get(file).streams[0]; return Number(width > height); };
files.sort((a, b) => landscape(a) - landscape(b) || a.localeCompare(b));
const cards = files.map((file, index) => {
  const source = path.join(root, folder, file);
  const name = path.parse(file).name;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const [brand, detail, category] = projects[name] || [name, 'Commercial Film', 'Commercial advertising'];
  const label = escape(`${brand} ${detail}`);
  const info = metadata.get(file);
  const { width, height } = info.streams[0];
  const seconds = Math.round(Number(info.format.duration));
  const duration = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const poster = `${posterDir}/${slug}.webp`;
  const posterPath = path.join(root, poster);
  if (!fs.existsSync(posterPath) || fs.statSync(source).mtimeMs > fs.statSync(posterPath).mtimeMs) {
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', '1', '-i', source, '-frames:v', '1', '-vf', 'scale=480:-2', '-c:v', 'libwebp', '-quality', '82', posterPath]);
  }
  const url = `${encodeURIComponent(folder)}/${encodeURIComponent(file)}`;
  return cardTemplate
    .replaceAll('lumera-motion-01', slug)
    .replace('data-brand="Lumera"', `data-brand="${escape(brand)}"`)
    .replaceAll('Lumera Vitamin C Serum · Film 01', label)
    .replaceAll('Hyper Motion video', 'commercial video ad')
    .replaceAll('Hyper%20Motion%20Video/Lumera%20Vitamin%20C%20Serum%20Hyper%20Motion.mp4', url)
    .replace(/poster="[^"]+"/, `poster="${poster}"`)
    .replace('--video-aspect:720 / 1280', `--video-aspect:${width} / ${height}`)
    .replace('width="720" height="1280"', `width="${width}" height="${height}"`)
    .replace('class="ugc-card"', `class="ugc-card${width > height ? ' ugc-card--landscape' : ''}"`)
    .replaceAll('00:10', duration)
    .replace('>Skincare</p>', `>${escape(category)}${width > height ? ' · Landscape' : ''}</p>`)
    .replace('Lumera <span>/ Vitamin C Serum · Film 01</span>', `${escape(brand)} <span>/ ${escape(detail)}</span>`)
    .replace('class="ugc-index">01', `class="ugc-index">${String(index + 1).padStart(2, '0')}`);
});
const portraitCards = [];
const landscapeCards = [];
files.forEach((file, index) => {
  if (landscape(file)) landscapeCards.push(cards[index]);
  else portraitCards.push(cards[index]);
});
const gridCards = landscapeCards.length
  ? `${portraitCards.join('\n')}\n          <div class="ugc-landscape-row">\n${landscapeCards.join('\n')}\n          </div>`
  : portraitCards.join('\n');
let page = template
  .replace('<title>Product Hyper Motion Portfolio', '<title>AI Commercial Video Ads Portfolio')
  .replace(/<meta name="description"[^>]+>/, '<meta name="description" content="Explore AI commercial video ads by WHYT.studio, from skincare and fashion to cafe and nutrition campaigns. Watch original portrait and landscape films."/>')
  .replace('href="product-hyper-motion-portfolio.html" aria-current="page"', 'href="product-hyper-motion-portfolio.html"')
  .replace('href="ai-commercial-video-ads-portfolio.html"', 'href="ai-commercial-video-ads-portfolio.html" aria-current="page"')
  .replace('PRODUCT HYPER MOTION</p>', 'AI COMMERCIAL VIDEO ADS</p>')
  .replace('Products in motion.<br><span>Made to stand out.</span>', 'Stories that connect.<br><span>Ads made for your brand.</span>')
  .replace('Your product. A new perspective.<br>Explore our Hyper Motion films.', 'Your brand. A story worth telling.<br>Explore our AI commercial video ads.')
  .replace(/<span class="ugc-count">\d+<\/span>/, `<span class="ugc-count">${String(files.length).padStart(2, '0')}</span>`)
  .replace(/(<div class="ugc-grid">)[\s\S]*?(\n        <\/div>\s*<p class="ugc-collection-note">)/, `$1\n${gridCards}\n$2`)
  .replace('Eight films. Six brands. A new perspective on your products.', 'Brand stories across skincare, fashion, food, and nutrition.');
fs.writeFileSync(path.join(root, output), page);
require('./build-service-media.cjs').buildServiceMedia();
console.log(`Built ${output} with ${files.length} original videos.`);
