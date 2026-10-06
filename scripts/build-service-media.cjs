// Classic-script fallback for direct file:// previews and failed HTTP requests.
// The portfolio pages remain the source of truth; no second media list to edit.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const pages = ['ugc-video-portfolio.html', 'product-hyper-motion-portfolio.html', 'ai-commercial-video-ads-portfolio.html'];
const decode = value => value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
function buildServiceMedia() {
  const portfolios = {};
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    const grid = html.slice(html.indexOf('<div class="ugc-grid">'), html.indexOf('<p class="ugc-collection-note">'));
    portfolios[page] = [...grid.matchAll(/<video\b([^>]+)>/g)].map(match => {
      const attributes = Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, decode(value)]));
      if (!attributes.src || !fs.existsSync(path.join(root, decodeURIComponent(attributes.src)))) {
        console.warn(`Skipping unavailable portfolio video: ${attributes.src || page}`);
        return null;
      }
      return { src: attributes.src, poster: attributes.poster || '', label: attributes['aria-label'] || '', width: Number(attributes.width), height: Number(attributes.height) };
    }).filter(Boolean);
    if (!portfolios[page].length) throw new Error(`No portfolio videos found in ${page}`);
  }
  fs.writeFileSync(path.join(root, 'portfolio/service-videos.js'), `// Generated from the video portfolio pages by scripts/build-service-media.cjs.\nwindow.SERVICE_VIDEO_PORTFOLIOS = ${JSON.stringify(portfolios, null, 2)};\n`);
  return portfolios;
}
module.exports = { buildServiceMedia };
if (require.main === module) {
  const portfolios = buildServiceMedia();
  console.log(Object.entries(portfolios).map(([page, items]) => `${page}: ${items.length} videos`).join('\n'));
}
